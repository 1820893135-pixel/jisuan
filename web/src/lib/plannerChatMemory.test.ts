/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearPlannerChatMessages,
  readPlannerChatMessages,
  writePlannerChatMessages,
} from './plannerChatMemory.ts'

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

test('clearPlannerChatMessages removes persisted planner conversation', () => {
  withMockWindow(() => {
    writePlannerChatMessages([
      {
        createdAt: '2026-04-18T08:00:00.000Z',
        id: 'assistant-1',
        role: 'assistant',
        text: '这是一条旧聊天记录',
      },
    ])

    clearPlannerChatMessages()

    assert.deepEqual(readPlannerChatMessages(), [])
  })
})

test('readPlannerChatMessages merges legacy assistant text and standalone summary card records', () => {
  withMockWindow(() => {
    writePlannerChatMessages([
      {
        createdAt: '2026-04-18T08:00:00.000Z',
        id: 'assistant-text',
        role: 'assistant',
        text: '这是旧版单独保存的规划说明',
      },
      {
        createdAt: '2026-04-18T08:00:01.000Z',
        id: 'assistant-card',
        role: 'assistant',
        summaryCard: {
          budget: '2000-3000',
          city: '北京市',
          days: 3,
          interests: ['历史古迹'],
          note: '少赶路',
          requestSummary: '北京市 · 3天 · 沉浸文化',
          stops: ['故宫博物院', '天坛公园'],
          style: '沉浸文化',
          targetId: 'planner-itinerary-anchor',
          title: '北京市3天行程概览',
        },
        text: '北京市 · 3天 · 沉浸文化',
        variant: 'summary-card',
      },
    ])

    const messages = readPlannerChatMessages()

    assert.equal(messages.length, 1)
    assert.equal(messages[0]?.text, '这是旧版单独保存的规划说明')
    assert.equal(messages[0]?.summaryCard?.city, '北京市')
    assert.equal(messages[0]?.variant, 'summary-card')
  })
})
