/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const plannerPageSource = readFileSync(resolve(currentDir, 'PlannerPage.tsx'), 'utf8')

test('planner page renders a typed thinking block and clickable summary card entry', () => {
  assert.match(plannerPageSource, /planner-chat-message--thinking/)
  assert.match(plannerPageSource, /planner-chat-message--card/)
  assert.match(plannerPageSource, /scrollToItinerarySection/)
  assert.match(plannerPageSource, /planner-summary-card/)
  assert.doesNotMatch(plannerPageSource, /openAuthDialog\('login'\)/)
  assert.doesNotMatch(plannerPageSource, /openAuthDialog\('register'\)/)
})
