/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearPlannerChatMessages,
  readPlannerChatMessages,
  writePlannerChatMessages,
} from './plannerChatMemory'

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
