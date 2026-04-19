/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'
import type { ItineraryHistoryEntry } from '../types.ts'
import {
  clearItineraryHistory,
  readItineraryHistory,
  upsertItineraryHistoryEntry,
  writeItineraryHistory,
} from './itineraryHistory.ts'

function createHistoryEntry(index: number): ItineraryHistoryEntry {
  return {
    createdAt: `2026-04-${String(index + 1).padStart(2, '0')}T08:00:00.000Z`,
    form: {
      budget: '2000-3000',
      city: `城市 ${index}`,
      days: (index % 5) + 1,
      interests: ['历史古迹'],
      note: `备注 ${index}`,
      style: '沉浸文化',
    },
    guide: {
      center: [120 + index, 30 + index],
      city: `城市 ${index}`,
      pois: [],
      slogan: `城市 ${index} 导览`,
      story: `城市 ${index} 的导览故事`,
      tags: ['文化'],
      travelSeasons: ['春'],
    },
    id: `history-${index}`,
    itinerary: {
      dailyPlan: [],
      overview: `概览 ${index}`,
      routeReason: `原因 ${index}`,
      tips: [],
      title: `方案 ${index}`,
    },
  }
}

function withMockWindow(run: () => void) {
  const hadWindow = 'window' in globalThis
  const originalWindow = hadWindow
    ? (globalThis as typeof globalThis & { window?: Window }).window
    : undefined
  const storage = new Map<string, string>()
  const localStorage: Storage = {
    clear() {
      storage.clear()
    },
    getItem(key) {
      return storage.get(key) ?? null
    },
    key(index) {
      return Array.from(storage.keys())[index] ?? null
    },
    get length() {
      return storage.size
    },
    removeItem(key) {
      storage.delete(key)
    },
    setItem(key, value) {
      storage.set(key, value)
    },
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
    writable: true,
  })

  try {
    run()
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
        writable: true,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'window')
    }
  }
}

test('writeItineraryHistory preserves every saved itinerary entry', () => {
  withMockWindow(() => {
    const entries = Array.from({ length: 12 }, (_, index) => createHistoryEntry(index))

    writeItineraryHistory(entries)

    assert.equal(readItineraryHistory().length, 12)
    assert.deepEqual(
      readItineraryHistory().map((entry) => entry.id),
      entries.map((entry) => entry.id),
    )
  })
})

test('upsertItineraryHistoryEntry prepends new history without trimming older plans', () => {
  const current = Array.from({ length: 11 }, (_, index) => createHistoryEntry(index))
  const nextEntry = createHistoryEntry(11)

  const next = upsertItineraryHistoryEntry(current, nextEntry)

  assert.equal(next.length, 12)
  assert.equal(next[0]?.id, nextEntry.id)
  assert.deepEqual(
    next.slice(1).map((entry) => entry.id),
    current.map((entry) => entry.id),
  )
})

test('upsertItineraryHistoryEntry keeps a single copy when restoring an existing plan', () => {
  const current = Array.from({ length: 12 }, (_, index) => createHistoryEntry(index))
  const existingEntry = createHistoryEntry(5)

  const next = upsertItineraryHistoryEntry(current, existingEntry)

  assert.equal(next.length, 12)
  assert.equal(next[0]?.id, existingEntry.id)
  assert.equal(
    next.filter((entry) => entry.id === existingEntry.id).length,
    1,
  )
})

test('clearItineraryHistory removes persisted entries for logged-out sessions', () => {
  withMockWindow(() => {
    writeItineraryHistory([createHistoryEntry(0), createHistoryEntry(1)])

    clearItineraryHistory()

    assert.deepEqual(readItineraryHistory(), [])
  })
})
