import {
  Bot,
  CalendarDays,
  MapPinned,
  SendHorizonal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getItineraryStopMedia } from "../content/heritageMedia";
import { useTravelApp } from "../context/useTravelApp";
import {
  buildPlannerReplyMessage,
  buildPlannerSummaryCard,
  buildPlannerThinkingPrelude,
} from "../lib/plannerConversation";
import {
  readPlannerChatMessages,
  writePlannerChatMessages,
} from "../lib/plannerChatMemory";
import {
  getCompactPlannerGreeting,
  isLegacyPlannerGreeting,
  sanitizePlannerCopy,
} from "../lib/plannerCopy";
import { resolvePlannerCity } from "../lib/plannerPageHelpers";
import type {
  PlannerChatMessage,
  PlannerForm,
  PlannerGenerationResult,
} from "../types";

const plannerAssistantName = "文脉行程师";
const itineraryAnchorId = "planner-itinerary-anchor";

function createMessage(
  role: PlannerChatMessage["role"],
  text: string,
  options: Partial<PlannerChatMessage> = {},
): PlannerChatMessage {
  return {
    createdAt: new Date().toISOString(),
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    ...options,
  };
}

function normalizeBudget(message: string, currentBudget: string) {
  const rangeMatch = message.match(/(\d{3,5})\s*[-~到至]\s*(\d{3,5})/);
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}`;
  }

  if (/省钱|预算友好|便宜/.test(message)) {
    return "1000-2000";
  }

  if (/品质|高端|舒服一点|住好/.test(message)) {
    return "高品质体验";
  }

  return currentBudget;
}

function normalizeStyle(message: string, currentStyle: string) {
  if (/沉浸|文化|慢慢逛/.test(message)) {
    return "沉浸文化";
  }

  if (/轻松|打卡|随便逛/.test(message)) {
    return "轻松打卡";
  }

  if (/讲解|深度|知识/.test(message)) {
    return "深度讲解";
  }

  if (/预算|省钱/.test(message)) {
    return "预算友好";
  }

  return currentStyle;
}

function pickInterests(message: string, currentInterests: string[]) {
  const next = new Set<string>();

  if (/古迹|遗址|历史/.test(message)) {
    next.add("历史古迹");
  }
  if (/自然|湖|山|风景/.test(message)) {
    next.add("自然风光");
  }
  if (/非遗|手作|民俗/.test(message)) {
    next.add("非遗体验");
  }
  if (/美食|小吃|夜宵/.test(message)) {
    next.add("美食街区");
  }
  if (/citywalk|街区|散步/.test(message.toLowerCase())) {
    next.add("Citywalk");
  }
  if (/夜游|夜景|夜拍/.test(message)) {
    next.add("夜游打卡");
  }

  return next.size > 0 ? Array.from(next) : currentInterests;
}

function deriveOverrides(
  message: string,
  form: PlannerForm,
  cityOptions: Array<{ capital?: string; city: string }>,
): Partial<PlannerForm> {
  const dayMatch = message.match(/(\d+)\s*(天|日)/);
  const days = dayMatch
    ? Math.min(5, Math.max(1, Number(dayMatch[1]) || form.days))
    : form.days;
  const noteParts = [form.note, message].filter(Boolean);

  return {
    budget: normalizeBudget(message, form.budget),
    city: resolvePlannerCity(message, form.city, cityOptions),
    days,
    interests: pickInterests(message, form.interests),
    note: noteParts.slice(-3).join("；"),
    style: normalizeStyle(message, form.style),
  };
}

function createGreetingMessage(
  form: PlannerForm,
  historyCount: number,
): PlannerChatMessage {
  return {
    createdAt: new Date().toISOString(),
    id: "planner-greeting",
    role: "assistant",
    text: getCompactPlannerGreeting(form, historyCount),
  };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
  } = useTravelApp();
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<PlannerChatMessage[]>(() =>
    readPlannerChatMessages(),
  );
  const [selectedDay, setSelectedDay] = useState(1);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const activeThinkingTargetsRef = useRef<
    Record<string, { complete: boolean; text: string }>
  >({});
  const streamingAliveRef = useRef(true);
  const activeDay =
    itinerary && selectedDay <= itinerary.dailyPlan.length ? selectedDay : 1;
  const currentDayPlan =
    itinerary?.dailyPlan.find((day) => day.day === activeDay) ?? null;
  const threadMessages =
    messages.length > 0 ? messages : [createGreetingMessage(form, itineraryHistory.length)];

  useEffect(() => {
    writePlannerChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) {
      return;
    }

    thread.scrollTo({
      behavior: "smooth",
      top: thread.scrollHeight,
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      streamingAliveRef.current = false;
    };
  }, []);

  function scrollToItinerarySection(targetId = itineraryAnchorId) {
    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function streamThinkingMessage(messageId: string) {
    let visibleLength = 0;

    while (streamingAliveRef.current) {
      const target = activeThinkingTargetsRef.current[messageId];
      if (!target) {
        return;
      }

      if (visibleLength < target.text.length) {
        visibleLength += 1;
        const nextText = target.text.slice(0, visibleLength);
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId ? { ...message, text: nextText } : message,
          ),
        );
        await wait(14);
        continue;
      }

      if (target.complete) {
        delete activeThinkingTargetsRef.current[messageId];
        return;
      }

      await wait(40);
    }
  }

  async function submitMessage(prefilled?: string) {
    const text = (prefilled ?? draft).trim();
    if (!text || planning || isStreaming) {
      return;
    }

    const overrides = deriveOverrides(text, form, cities);
    const userMessage = createMessage("user", text);
    const provisionalResult: PlannerGenerationResult = {
      form: {
        ...form,
        ...overrides,
        interests: overrides.interests ? [...overrides.interests] : [...form.interests],
        note: overrides.note ?? form.note,
      },
      guide: guide ?? {
        center: cities[0]?.center ?? [120.1551, 30.2741],
        city: overrides.city ?? form.city,
        pois: [],
        slogan: "",
        story: "",
        tags: [],
        travelSeasons: [],
      },
      itinerary: {
        dailyPlan: [],
        overview: "",
        routeReason: "",
        tips: [],
        title: "",
      },
      source: "local-thinking",
    };
    const thinkingMessage = createMessage("assistant", "", {
      variant: "thinking",
    });

    setIsStreaming(true);
    setMessages((current) => [
      ...(current.length > 0
        ? current
        : [createGreetingMessage(form, itineraryHistory.length)]),
      userMessage,
      thinkingMessage,
    ]);
    setDraft("");

    activeThinkingTargetsRef.current[thinkingMessage.id] = {
      complete: false,
      text: buildPlannerThinkingPrelude(provisionalResult),
    };
    const streamPromise = streamThinkingMessage(thinkingMessage.id);
    const result = await handleGeneratePlan(overrides);

    if (!result) {
      delete activeThinkingTargetsRef.current[thinkingMessage.id];
      setMessages((current) =>
        current.map((message) =>
          message.id === thinkingMessage.id
            ? {
                ...message,
                text:
                  error ||
                  "这次规划没有成功，我已经保留了你刚才的条件，你可以继续补一句要求后让我重试。",
                variant: "text",
              }
            : message,
        ),
      );
      setIsStreaming(false);
      return;
    }

    const summaryCard = buildPlannerSummaryCard(result, itineraryAnchorId);
    const replyText = buildPlannerReplyMessage(result);

    activeThinkingTargetsRef.current[thinkingMessage.id] = {
      complete: true,
      text: replyText,
    };
    await streamPromise;

    setMessages((current) =>
      current.map((message) =>
        message.id === thinkingMessage.id
          ? {
              ...message,
              summaryCard,
              text: replyText,
              variant: "summary-card",
            }
          : message,
      ),
    );
    setIsStreaming(false);
  }

  function handleRestoreHistory(historyId: string) {
    const historyEntry = itineraryHistory.find((entry) => entry.id === historyId);
    restoreItineraryHistory(historyId);

    if (!historyEntry) {
      return;
    }

    const restoredResult: PlannerGenerationResult = {
      form: historyEntry.form,
      guide: historyEntry.guide,
      itinerary: historyEntry.itinerary,
      source: "history-memory",
    };
    const summaryCard = buildPlannerSummaryCard(
      restoredResult,
      itineraryAnchorId,
    );

    setMessages((current) => [
      ...current,
      createMessage(
        "assistant",
        buildPlannerReplyMessage(restoredResult),
        {
          summaryCard,
          variant: "summary-card",
        },
      ),
    ]);
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

          <div ref={threadRef} className="planner-chat-thread">
            {threadMessages.map((message) => {
              const displayText =
                message.role === "assistant"
                  ? isLegacyPlannerGreeting(message.text)
                    ? getCompactPlannerGreeting(form, itineraryHistory.length)
                    : sanitizePlannerCopy(message.text)
                  : message.text;
              const messageClassName =
                message.role === "assistant"
                  ? [
                      "planner-chat-message",
                      "planner-chat-message--assistant",
                      message.variant === "thinking"
                        ? "planner-chat-message--thinking"
                        : "",
                      message.summaryCard ? "planner-chat-message--card" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : "planner-chat-message planner-chat-message--user";

              return (
                <article key={message.id} className={messageClassName}>
                  <span className="planner-chat-message__role">
                    {message.role === "assistant" ? plannerAssistantName : "你"}
                  </span>
                  <p>{displayText}</p>
                  {message.summaryCard && message.role === "assistant" ? (
                    <button
                      className="planner-history-item planner-summary-card"
                      onClick={() =>
                        scrollToItinerarySection(message.summaryCard?.targetId)
                      }
                      type="button"
                    >
                      <div className="planner-summary-card__head">
                        <strong>{message.summaryCard.city}</strong>
                        <span>查看路线</span>
                      </div>
                      <div className="planner-summary-card__meta">
                        <span>
                          <CalendarDays className="icon-4" />
                          {message.summaryCard.days} 天
                        </span>
                        <span>{message.summaryCard.style}</span>
                      </div>
                      <small>{message.summaryCard.requestSummary}</small>
                      <small>
                        主线：{message.summaryCard.stops.join("、") || "待补充"}
                      </small>
                    </button>
                  ) : null}
                </article>
              );
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
                disabled={planning || isStreaming || !draft.trim()}
                onClick={() => void submitMessage()}
                type="button"
              >
                <SendHorizonal className="icon-5" />
                {planning || isStreaming ? "整理中..." : "发送并规划"}
              </button>
            </div>
          </div>
        </article>

        <aside className="planner-memory-card">
          <div className="section-header planner-panel__header">
            <div>
              <h2>历史规划</h2>
            </div>
          </div>

          <div className="planner-history-stack">
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
        <section className="content-section" id={itineraryAnchorId}>
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
                  className={
                    activeDay === day.day
                      ? "planner-route-node active"
                      : "planner-route-node"
                  }
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
                );

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
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

export function PlannerPage() {
  const { user } = useTravelApp();

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
              <Link className="button-primary" to="/auth/login?from=%2Fitinerary">
                登录
              </Link>
              <Link className="button-secondary" to="/auth/register?from=%2Fitinerary">
                注册
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
