import type { ItineraryHistoryEntry } from '../types'

const itineraryHistoryStorageKey = 'lvyou-itinerary-history'

export function upsertItineraryHistoryEntry(
  entries: ItineraryHistoryEntry[],
  nextEntry: ItineraryHistoryEntry,
) {
  return [nextEntry, ...entries.filter((entry) => entry.id !== nextEntry.id)]
}

export function readItineraryHistory() {
  if (typeof window === 'undefined') {
    return [] as ItineraryHistoryEntry[]
  }

  try {
    const raw = window.localStorage.getItem(itineraryHistoryStorageKey)
    if (!raw) {
      return [] as ItineraryHistoryEntry[]
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ItineraryHistoryEntry[]) : []
  } catch {
    return [] as ItineraryHistoryEntry[]
  }
}

export function writeItineraryHistory(entries: ItineraryHistoryEntry[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    itineraryHistoryStorageKey,
    JSON.stringify(entries),
  )
}

export function clearItineraryHistory() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(itineraryHistoryStorageKey)
}
