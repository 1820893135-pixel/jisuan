import {
  Bot,
  CalendarDays,
  MapPinned,
  SendHorizonal,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTravelApp } from '../context/useTravelApp'
import {
  getCompactPlannerGreeting,
  isLegacyPlannerGreeting,
  sanitizePlannerCopy,
} from '../lib/plannerCopy'
import {
  readPlannerChatMessages,
  writePlannerChatMessages,
} from '../lib/plannerChatMemory'
import { resolvePlannerCity } from '../lib/plannerPageHelpers'
import { getItineraryStopMedia } from '../content/heritageMedia'
import type { PlannerChatMessage, PlannerForm, PlannerGenerationResult } from '../types'

const plannerAssistantName = '文脉行程师'

function createMessage(role: PlannerChatMessage['role'], text: string): PlannerChatMessage {
  return {
    createdAt: new Date().toISOString(),
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
  }
}

function normalizeBudget(message: string, currentBudget: string) {
  const rangeMatch = message.match(/(\d{3,5})\s*[-~到至]\s*(\d{3,5})/)
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}`
  }

  if (/省钱|预算友好|便宜/.test(message)) {
    return '1000-2000'
  }

  if (/品质|高端|舒服一点|住好/.test(message)) {
    return '高品质体验'
  }

  return currentBudget
}

function normalizeStyle(message: string, currentStyle: string) {
  if (/沉浸|文化|慢慢逛/.test(message)) {
    return '沉浸文化'
  }

  if (/轻松|打卡|随便逛/.test(message)) {
    return '轻松打卡'
  }

  if (/讲解|深度|知识/.test(message)) {
    return '深度讲解'
  }

  if (/预算|省钱/.test(message)) {
    return '预算友好'
  }

  return currentStyle
}

function pickInterests(message: string, currentInterests: string[]) {
  const next = new Set<string>()

  if (/古迹|遗址|历史/.test(message)) {
    next.add('历史古迹')
  }
  if (/自然|湖|山|风景/.test(message)) {
    next.add('自然风光')
  }
  if (/非遗|手作|民俗/.test(message)) {
    next.add('非遗体验')
  }
  if (/美食|小吃|夜宵/.test(message)) {
    next.add('美食街区')
  }
  if (/citywalk|街区|散步/.test(message.toLowerCase())) {
    next.add('Citywalk')
  }
  if (/夜游|夜景|夜拍/.test(message)) {
    next.add('夜游打卡')
  }

  return next.size > 0 ? Array.from(next) : currentInterests
}

function deriveOverrides(
  message: string,
  form: PlannerForm,
  cityOptions: Array<{ capital?: string; city: string }>,
): Partial<PlannerForm> {
  const dayMatch = message.match(/(\d+)\s*(天|日)/)
  const days = dayMatch ? Math.min(5, Math.max(1, Number(dayMatch[1]) || form.days)) : form.days
  const noteParts = [form.note, message].filter(Boolean)

  return {
    budget: normalizeBudget(message, form.budget),
    city: resolvePlannerCity(message, form.city, cityOptions),
    days,
    interests: pickInterests(message, form.interests),
    note: noteParts.slice(-3).join('；'),
    style: normalizeStyle(message, form.style),
  }
}

function buildAssistantReply(result: PlannerGenerationResult) {
  const firstDay = result.itinerary.dailyPlan[0]
  const firstStops = firstDay?.stops.map((stop) => stop.name).join('、') ?? '我已经先整理好了主线'

  return [
    `我先按 ${result.form.city} ${result.form.days} 天来帮你规划，预算参考 ${result.form.budget}，路线风格偏 ${result.form.style}。`,
    sanitizePlannerCopy(result.itinerary.overview),
    `第一天我会从 ${firstDay?.theme ?? '城市主线'} 开始，重点放在 ${firstStops}。`,
    '这些条件我已经整理进当前方案里，你接着补充“想压缩预算”“多加夜游”“换个省份”就行。',
  ]
    .map((section) => sanitizePlannerCopy(section))
    .join('\n\n')
}

function createGreetingMessage(form: PlannerForm, historyCount: number): PlannerChatMessage {
  return {
    createdAt: new Date().toISOString(),
    id: 'planner-greeting',
    role: 'assistant',
    text: getCompactPlannerGreeting(form, historyCount),
  }
}

function AuthenticatedPlannerWorkspace() {
  const {
    cities,
    error,
    form,
    guide,
    handleGeneratePlan,
    itinerary,
    itineraryHistory,
    planning,
    restoreItineraryHistory,
  } = useTravelApp()

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<PlannerChatMessage[]>(() =>
    readPlannerChatMessages(),
  )
  const [selectedDay, setSelectedDay] = useState(1)
  const activeDay = itinerary && selectedDay <= itinerary.dailyPlan.length ? selectedDay : 1
  const currentDayPlan = itinerary?.dailyPlan.find((day) => day.day === activeDay) ?? null
  const threadMessages =
    messages.length > 0 ? messages : [createGreetingMessage(form, itineraryHistory.length)]

  useEffect(() => {
    writePlannerChatMessages(messages)
  }, [messages])

  async function submitMessage(prefilled?: string) {
    const text = (prefilled ?? draft).trim()
    if (!text || planning) {
      return
    }

    const userMessage = createMessage('user', text)
    const thinkingMessage = createMessage(
      'assistant',
      '我在整理你的偏好、景点顺序和路线节奏，马上给你一版可直接出发的方案。',
    )
    const overrides = deriveOverrides(text, form, cities)

    setMessages((current) => [
      ...(current.length > 0 ? current : [createGreetingMessage(form, itineraryHistory.length)]),
      userMessage,
      thinkingMessage,
    ])
    setDraft('')

    const result = await handleGeneratePlan(overrides)

    setMessages((current) => {
      const next = current.filter((message) => message.id !== thinkingMessage.id)

      if (!result) {
        return [
          ...next,
          createMessage(
            'assistant',
            error || '这次规划没有成功，我已经保留了你刚才的条件，你可以直接补一句要求后继续让我重试。',
          ),
        ]
      }

      return [...next, createMessage('assistant', buildAssistantReply(result))]
    })
  }

  function handleRestoreHistory(historyId: string) {
    const historyEntry = itineraryHistory.find((entry) => entry.id === historyId)
    restoreItineraryHistory(historyId)

    if (!historyEntry) {
      return
    }

    setMessages((current) => [
      ...current,
      createMessage(
        'assistant',
        `我已经帮你恢复 ${historyEntry.guide.city} 的历史方案：${historyEntry.itinerary.title}。之前方案里的预算是 ${historyEntry.form.budget}，偏好是 ${historyEntry.form.interests.join('、')}。`,
      ),
    ])
  }

  return (
    <>
      <section className="content-section planner-chat-layout">
        <article className="planner-chat-card">
          <div className="section-header planner-panel__header">
            <div>
              <h2>规划对话</h2>
            </div>
            <span className="section-meta planner-panel__meta">
              <Bot className="icon-4" />
              文脉路线规划
            </span>
          </div>

          <div className="planner-chat-thread">
            {threadMessages.map((message) => {
              const displayText =
                message.role === 'assistant'
                  ? isLegacyPlannerGreeting(message.text)
                    ? getCompactPlannerGreeting(form, itineraryHistory.length)
                    : sanitizePlannerCopy(message.text)
                  : message.text

              return (
                <article
                  key={message.id}
                  className={
                    message.role === 'assistant'
                      ? 'planner-chat-message planner-chat-message--assistant'
                      : 'planner-chat-message planner-chat-message--user'
                  }
                >
                  <span className="planner-chat-message__role">
                    {message.role === 'assistant' ? plannerAssistantName : '你'}
                  </span>
                  <p>{displayText}</p>
                </article>
              )
            })}
          </div>

          <div className="planner-chat-composer">
            <textarea
              className="planner-chat-input"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="比如：下周去陕西玩 3 天，预算 3000，想多看博物馆和夜游，少一点赶路。"
              rows={4}
              value={draft}
            />

            <div className="planner-chat-composer__actions">
              <button
                className="button-primary"
                disabled={planning || !draft.trim()}
                onClick={() => void submitMessage()}
                type="button"
              >
                <SendHorizonal className="icon-5" />
                {planning ? '整理中...' : '发送并规划'}
              </button>
            </div>
          </div>
        </article>

        <aside className="planner-memory-card">
          <div className="section-header planner-panel__header">
            <div>
              <h2>当前规划</h2>
              <p className="map-summary__hint">这里展示你最近一次确认的规划条件。</p>
            </div>
          </div>

          <div className="planner-memory-grid">
            <div className="summary-tile">
              <span>目的地</span>
              <strong>{guide?.city ?? form.city}</strong>
            </div>
            <div className="summary-tile">
              <span>天数</span>
              <strong>{form.days} 天</strong>
            </div>
            <div className="summary-tile">
              <span>预算</span>
              <strong>{form.budget}</strong>
            </div>
            <div className="summary-tile">
              <span>风格</span>
              <strong>{form.style}</strong>
            </div>
          </div>

          <div className="planner-memory-tags">
            {form.interests.map((interest) => (
              <span key={interest} className="planner-memory-chip">
                {interest}
              </span>
            ))}
          </div>

          <div className="planner-history-stack">
            <div className="section-header planner-panel__header">
              <h3>历史规划</h3>
            </div>

            {itineraryHistory.length > 0 ? (
              itineraryHistory.map((entry) => (
                <button
                  key={entry.id}
                  className="planner-history-item"
                  onClick={() => handleRestoreHistory(entry.id)}
                  type="button"
                >
                  <strong>{entry.guide.city}</strong>
                  <span>
                    <CalendarDays className="icon-4" />
                    {entry.form.days} 天
                  </span>
                  <small>{entry.itinerary.title}</small>
                </button>
              ))
            ) : (
              <div className="planner-empty-card">
                <span>还没有历史记录，先聊一句你的旅行需求，我就会把它记下来。</span>
              </div>
            )}
          </div>
        </aside>
      </section>

      {itinerary ? (
        <section className="content-section">
          <div className="planner-overview-card">
            <div className="planner-overview-card__head">
              <div>
                <span className="map-kicker">当前方案</span>
                <h2>{itinerary.title}</h2>
              </div>
              <div className="planner-overview-card__stats">
                <span>{guide?.city ?? form.city}</span>
                <span>{form.days} 天</span>
              </div>
            </div>

            <p>{sanitizePlannerCopy(itinerary.overview)}</p>
            <p className="planner-overview-card__reason">
              {sanitizePlannerCopy(itinerary.routeReason)}
            </p>

            <div className="planner-route-rail">
              {itinerary.dailyPlan.map((day) => (
                <button
                  key={day.day}
                  className={activeDay === day.day ? 'planner-route-node active' : 'planner-route-node'}
                  onClick={() => setSelectedDay(day.day)}
                  type="button"
                >
                  <span>Day {day.day}</span>
                  <strong>{sanitizePlannerCopy(day.theme)}</strong>
                  <small>{day.stops.length} 个停靠点</small>
                </button>
              ))}
            </div>
          </div>

          {currentDayPlan ? (
            <div className="planner-timeline">
              {currentDayPlan.stops.map((stop, index) => {
                const stopMedia = getItineraryStopMedia(
                  stop.name,
                  guide?.city ?? form.city,
                  index,
                  guide?.pois ?? [],
                )

                return (
                  <article
                    key={`${currentDayPlan.day}-${stop.time}-${stop.name}`}
                    className="planner-timeline__item"
                  >
                    <div className="planner-timeline__dot">
                      <span>{index + 1}</span>
                    </div>
                    <div className="planner-timeline__content">
                      <div className="planner-timeline__media">
                        <img alt={stopMedia.alt} loading="lazy" src={stopMedia.src} />
                      </div>
                      <div className="planner-timeline__body">
                        <div className="planner-timeline__time">{stop.time}</div>
                        <h3>{sanitizePlannerCopy(stop.name)}</h3>
                        <div className="planner-timeline__meta">
                          <span>
                            <MapPinned className="icon-4" />
                            {sanitizePlannerCopy(stop.transport)}
                          </span>
                        </div>
                        <p>{sanitizePlannerCopy(stop.activity)}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  )
}

export function PlannerPage() {
  const { openAuthDialog, user } = useTravelApp()

  return (
    <div className="screen-page itinerary-page planner-chat-page">
      <header className="page-header planner-page__hero">
        <div className="planner-page__header">
          <div className="planner-page__title-block">
            <h1>{plannerAssistantName}</h1>
          </div>
        </div>
      </header>

      {user ? (
        <AuthenticatedPlannerWorkspace key={user.id} />
      ) : (
        <section className="content-section">
          <div className="planner-auth-gate">
            <span className="map-kicker">登录后可用</span>
            <h2>请先登录或注册</h2>
            <p>登录后才能继续生成行程、查看历史规划，并保留你的文化遗产导览偏好。</p>
            <div className="planner-auth-gate__actions">
              <button className="button-primary" onClick={() => openAuthDialog('login')} type="button">
                登录
              </button>
              <button className="button-secondary" onClick={() => openAuthDialog('register')} type="button">
                注册
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
