import type { PlannerChatMessage } from '../types'

const plannerChatStorageKey = 'lvyou-planner-chat'

function normalizePlannerChatMessages(messages: PlannerChatMessage[]) {
  const normalized: PlannerChatMessage[] = []

  for (let index = 0; index < messages.length; index += 1) {
    const current = messages[index]
    const next = messages[index + 1]

    if (
      current?.role === 'assistant' &&
      !current.summaryCard &&
      next?.role === 'assistant' &&
      next.summaryCard &&
      next.variant === 'summary-card'
    ) {
      normalized.push({
        ...current,
        summaryCard: next.summaryCard,
        text: current.text || next.text,
        variant: 'summary-card',
      })
      index += 1
      continue
    }

    normalized.push(current)
  }

  return normalized
}

export function readPlannerChatMessages() {
  if (typeof window === 'undefined') {
    return [] as PlannerChatMessage[]
  }

  try {
    const raw = window.localStorage.getItem(plannerChatStorageKey)
    if (!raw) {
      return [] as PlannerChatMessage[]
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? normalizePlannerChatMessages(parsed as PlannerChatMessage[])
      : []
  } catch {
    return [] as PlannerChatMessage[]
  }
}

export function writePlannerChatMessages(messages: PlannerChatMessage[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    plannerChatStorageKey,
    JSON.stringify(messages.slice(-24)),
  )
}

export function clearPlannerChatMessages() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(plannerChatStorageKey)
}
