interface LoginAttemptLimiterOptions {
  failureWindowMs: number
  lockoutMs: number
  maxFailures: number
}

interface AttemptEntry {
  failures: number[]
  lockedUntil: number | null
}

export type LoginAttemptStatus =
  | {
      allowed: true
    }
  | {
      allowed: false
      retryAfterMs: number
    }

export class LoginAttemptLimiter {
  private readonly attempts = new Map<string, AttemptEntry>()

  constructor(private readonly options: LoginAttemptLimiterOptions) {}

  getStatus(key: string, now = Date.now()): LoginAttemptStatus {
    const entry = this.getActiveEntry(key, now)

    if (!entry?.lockedUntil || entry.lockedUntil <= now) {
      return { allowed: true }
    }

    return {
      allowed: false,
      retryAfterMs: entry.lockedUntil - now,
    }
  }

  recordFailure(key: string, now = Date.now()): LoginAttemptStatus {
    const status = this.getStatus(key, now)

    if (!status.allowed) {
      return status
    }

    const entry = this.getOrCreateEntry(key)
    entry.failures.push(now)
    entry.failures = entry.failures.filter(
      (timestamp) => now - timestamp <= this.options.failureWindowMs,
    )

    if (entry.failures.length >= this.options.maxFailures) {
      entry.failures = []
      entry.lockedUntil = now + this.options.lockoutMs

      return {
        allowed: false,
        retryAfterMs: this.options.lockoutMs,
      }
    }

    return { allowed: true }
  }

  clear(key: string) {
    this.attempts.delete(key)
  }

  private getOrCreateEntry(key: string) {
    const existing = this.attempts.get(key)

    if (existing) {
      return existing
    }

    const created: AttemptEntry = {
      failures: [],
      lockedUntil: null,
    }

    this.attempts.set(key, created)
    return created
  }

  private getActiveEntry(key: string, now: number) {
    const entry = this.attempts.get(key)

    if (!entry) {
      return null
    }

    entry.failures = entry.failures.filter(
      (timestamp) => now - timestamp <= this.options.failureWindowMs,
    )

    if (entry.lockedUntil && entry.lockedUntil <= now) {
      entry.lockedUntil = null
    }

    if (!entry.lockedUntil && entry.failures.length === 0) {
      this.attempts.delete(key)
      return null
    }

    return entry
  }
}
