import assert from 'node:assert/strict'
import test from 'node:test'

import { getUsernameAvailabilityResult } from './usernameAvailability.js'

test('returns available when the username is not taken', () => {
  const result = getUsernameAvailabilityResult('heritage-travel', () => false)

  assert.deepEqual(result, {
    available: true,
    suggestions: [],
  })
})

test('returns replacement suggestions when the username is already taken', () => {
  const taken = new Set([
    'heritage-travel',
    'heritage-travel_01',
    'heritage-travel_trip',
  ])

  const result = getUsernameAvailabilityResult('heritage-travel', (candidate) =>
    taken.has(candidate),
  )

  assert.equal(result.available, false)
  assert.equal(result.suggestions.length, 3)
  assert.ok(result.suggestions.every((candidate) => !taken.has(candidate)))
})
