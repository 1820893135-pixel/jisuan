const USERNAME_PATTERN = /^[\w\u4E00-\u9FFF-]+$/u
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 24
const SUGGESTION_SUFFIXES = ['_01', '_trip', '_city', '2026', '_map', '_guide', '88']

export interface UsernameAvailabilityResult {
  available: boolean
  suggestions: string[]
}

function clipUsername(value: string, maxLength: number) {
  return Array.from(value).slice(0, maxLength).join('')
}

function normalizeUsernameBase(username: string) {
  const sanitized = Array.from(username.trim())
    .filter((char) => USERNAME_PATTERN.test(char))
    .join('')

  if (!sanitized) {
    return 'lvyou'
  }

  return clipUsername(sanitized, USERNAME_MAX_LENGTH)
}

function buildCandidate(base: string, suffix: string) {
  const maxBaseLength = Math.max(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH - suffix.length)
  return clipUsername(base, maxBaseLength) + suffix
}

export function getUsernameAvailabilityResult(
  username: string,
  isTaken: (candidate: string) => boolean,
): UsernameAvailabilityResult {
  const normalizedUsername = username.trim()

  if (!normalizedUsername || !isTaken(normalizedUsername)) {
    return {
      available: true,
      suggestions: [],
    }
  }

  const normalizedBase = normalizeUsernameBase(normalizedUsername)
  const suggestions: string[] = []
  const seen = new Set<string>([normalizedUsername])

  for (const suffix of SUGGESTION_SUFFIXES) {
    const candidate = buildCandidate(normalizedBase, suffix)

    if (
      candidate.length < USERNAME_MIN_LENGTH ||
      candidate.length > USERNAME_MAX_LENGTH ||
      !USERNAME_PATTERN.test(candidate) ||
      seen.has(candidate) ||
      isTaken(candidate)
    ) {
      continue
    }

    suggestions.push(candidate)
    seen.add(candidate)

    if (suggestions.length >= 3) {
      return {
        available: false,
        suggestions,
      }
    }
  }

  for (let index = 11; suggestions.length < 3 && index <= 999; index += 1) {
    const candidate = buildCandidate(normalizedBase, `_${index}`)

    if (
      candidate.length < USERNAME_MIN_LENGTH ||
      candidate.length > USERNAME_MAX_LENGTH ||
      !USERNAME_PATTERN.test(candidate) ||
      seen.has(candidate) ||
      isTaken(candidate)
    ) {
      continue
    }

    suggestions.push(candidate)
    seen.add(candidate)
  }

  return {
    available: false,
    suggestions,
  }
}
