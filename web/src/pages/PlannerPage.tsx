import {
  Bot,
  CalendarDays,
  History,
  MapPinned,
  SendHorizonal,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTravelApp } from '../context/useTravelApp'
import { formatDistance, formatDuration } from '../lib/format'
import {
  readPlannerChatMessages,
  writePlannerChatMessages,
} from '../lib/plannerChatMemory'
import type { PlannerChatMessage, PlannerForm, PlannerGenerationResult } from '../types'

function createMessage(role: PlannerChatMessage['role'], text: string): PlannerChatMessage {
  return {
    createdAt: new Date().toISOString(),
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
  }
}

function buildGreeting(form: PlannerForm, historyCount: number) {
  if (historyCount > 0) {
    return `我记得你最近在看 ${form.city}，默认先按 ${form.days} 天、${form.budget}、${form.style} 来继续。直接告诉我“想去哪、玩几天、预算多少、重点想看什么”，我就帮你整理路线。`
  }

  return '直接和我说你的想法，比如“去陕西玩 3 天，预算 3000，想多看博物馆和夜游”，我会边记边帮你规划。'
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
  cityNames: string[],
): Partial<PlannerForm> {
  const matchedCity =
    [...cityNames]
      .sort((left, right) => right.length - left.length)
      .find((city) => message.includes(city)) ?? form.city

  const dayMatch = message.match(/(\d+)\s*(天|日)/)
  const days = dayMatch ? Math.min(5, Math.max(1, Number(dayMatch[1]) || form.days)) : form.days
  const noteParts = [form.note, message].filter(Boolean)

  return {
    budget: normalizeBudget(message, form.budget),
    city: matchedCity,
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
    result.itinerary.overview,
    `第一天我会从 ${firstDay?.theme ?? '城市主线'} 开始，重点放在 ${firstStops}。`,
    '这些偏好我已经记住了，你接着补充“想压缩预算”“多加夜游”“换个省份”就行。',
  ].join('\n\n')
}

export function PlannerPage() {
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
    routePlan,
  } = useTravelApp()

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<PlannerChatMessage[]>(() =>
    readPlannerChatMessages(),
  )
  const [selectedDay, setSelectedDay] = useState(1)

  const cityNames = useMemo(() => cities.map((city) => city.city), [cities])
  const currentDayPlan = itinerary?.dailyPlan.find((day) => day.day === selectedDay) ?? null

  useEffect(() => {
    if (messages.length > 0) {
      return
    }

    setMessages([createMessage('assistant', buildGreeting(form, itineraryHistory.length))])
  }, [form, itineraryHistory.length, messages.length])

  useEffect(() => {
    writePlannerChatMessages(messages)
  }, [messages])

  useEffect(() => {
    if (!itinerary) {
      return
    }

    if (selectedDay > itinerary.dailyPlan.length) {
      setSelectedDay(1)
    }
  }, [itinerary, selectedDay])

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
    const overrides = deriveOverrides(text, form, cityNames)

    setMessages((current) => [...current, userMessage, thinkingMessage])
    setDraft('')

    const result = await handleGeneratePlan(overrides)

    setMessages((current) => {
      const next = current.filter((message) => message.id !== thinkingMessage.id)

      if (!result) {
        return [
          ...next,
          createMessage(
            'assistant',
            error || '这次规划没有成功，我已经保留了你的偏好，你可以直接补一句要求后继续让我重试。',
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
        `我已经帮你恢复 ${historyEntry.guide.city} 的历史方案：${historyEntry.itinerary.title}。之前记住的预算是 ${historyEntry.form.budget}，偏好是 ${historyEntry.form.interests.join('、')}。`,
      ),
    ])
  }

  return (
    <div className="screen-page itinerary-page planner-chat-page">
      <header className="page-header">
        <div className="planner-page__header">
          <div>
            <span className="map-kicker">智能行程</span>
            <h1>我帮你规划</h1>
            <p className="planner-page__lede">
              像聊天一样把需求告诉我，我会记住你的城市、预算、天数和偏好，再把路线整理成可直接出发的方案。
            </p>
          </div>
        </div>
      </header>

      <section className="content-section planner-chat-layout">
        <article className="planner-chat-card">
          <div className="section-header">
            <div>
              <h2>规划对话</h2>
              <p className="map-summary__hint">越像真实聊天越好，我会把你最新说过的条件继续带到后面的规划里。</p>
            </div>
            <span className="section-meta">
              <Bot className="icon-4" />
              带记忆的路线助手
            </span>
          </div>

          <div className="planner-chat-thread">
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === 'assistant'
                    ? 'planner-chat-message planner-chat-message--assistant'
                    : 'planner-chat-message planner-chat-message--user'
                }
              >
                <span className="planner-chat-message__role">
                  {message.role === 'assistant' ? '我帮你规划' : '你'}
                </span>
                <p>{message.text}</p>
              </article>
            ))}
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
          <div className="section-header">
            <div>
              <h2>当前记忆</h2>
              <p className="map-summary__hint">这里会持续保留你最近一次确认过的规划条件。</p>
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
            <div className="section-header">
              <h3>历史记忆</h3>
              <span className="section-meta">
                <History className="icon-4" />
                自动保存最近 8 次
              </span>
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

            <p>{itinerary.overview}</p>
            <p className="planner-overview-card__reason">{itinerary.routeReason}</p>

            <div className="planner-route-rail">
              {itinerary.dailyPlan.map((day) => (
                <button
                  key={day.day}
                  className={selectedDay === day.day ? 'planner-route-node active' : 'planner-route-node'}
                  onClick={() => setSelectedDay(day.day)}
                  type="button"
                >
                  <span>Day {day.day}</span>
                  <strong>{day.theme}</strong>
                  <small>{day.stops.length} 个停靠点</small>
                </button>
              ))}
            </div>

            {routePlan ? (
              <div className="planner-route-summary">
                <div className="summary-tile">
                  <span>路线长度</span>
                  <strong>{formatDistance(routePlan.distanceMeters)}</strong>
                </div>
                <div className="summary-tile">
                  <span>预计时长</span>
                  <strong>{formatDuration(routePlan.durationSeconds)}</strong>
                </div>
                <div className="summary-tile">
                  <span>路线节点</span>
                  <strong>{routePlan.waypoints.length} 个</strong>
                </div>
              </div>
            ) : null}
          </div>

          {currentDayPlan ? (
            <div className="planner-timeline">
              {currentDayPlan.stops.map((stop, index) => (
                <article key={`${currentDayPlan.day}-${stop.time}-${stop.name}`} className="planner-timeline__item">
                  <div className="planner-timeline__dot">
                    <span>{index + 1}</span>
                  </div>
                  <div className="planner-timeline__content">
                    <div className="planner-timeline__time">{stop.time}</div>
                    <h3>{stop.name}</h3>
                    <div className="planner-timeline__meta">
                      <span>
                        <MapPinned className="icon-4" />
                        {stop.transport}
                      </span>
                      <span>
                        <Sparkles className="icon-4" />
                        {stop.cost}
                      </span>
                    </div>
                    <p>{stop.activity}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
