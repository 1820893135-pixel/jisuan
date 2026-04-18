import assert from 'node:assert/strict'
import test from 'node:test'

import { LoginAttemptLimiter } from './loginAttemptLimiter.js'

test('locks a key after repeated failures within the active window', () => {
  const limiter = new LoginAttemptLimiter({
    failureWindowMs: 10 * 60 * 1000,
    lockoutMs: 5 * 60 * 1000,
    maxFailures: 5,
  })
  const key = 'traveler@127.0.0.1'

  for (let index = 0; index < 4; index += 1) {
    const status = limiter.recordFailure(key, index * 1000)
    assert.equal(status.allowed, true)
  }

  const lockedStatus = limiter.recordFailure(key, 5_000)

  assert.equal(lockedStatus.allowed, false)
  assert.equal(lockedStatus.retryAfterMs, 5 * 60 * 1000)
})

test('clears a lock after the lockout expires or a successful login', () => {
  const limiter = new LoginAttemptLimiter({
    failureWindowMs: 10 * 60 * 1000,
    lockoutMs: 60_000,
    maxFailures: 2,
  })
  const key = 'traveler@127.0.0.1'

  limiter.recordFailure(key, 0)
  limiter.recordFailure(key, 1_000)

  assert.equal(limiter.getStatus(key, 30_000).allowed, false)
  assert.equal(limiter.getStatus(key, 62_000).allowed, true)

  limiter.recordFailure(key, 63_000)
  limiter.clear(key)

  assert.equal(limiter.getStatus(key, 64_000).allowed, true)
})
