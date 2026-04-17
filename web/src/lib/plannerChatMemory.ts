import type { PlannerChatMessage } from '../types'

const plannerChatStorageKey = 'lvyou-planner-chat'

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
    return Array.isArray(parsed) ? (parsed as PlannerChatMessage[]) : []
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
