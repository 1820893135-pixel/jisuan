const tokenStorageKey = 'lvyou-auth-token'

export function readAuthToken() {
  return window.localStorage.getItem(tokenStorageKey)
}

export function writeAuthToken(token: string | null) {
  if (!token) {
    window.localStorage.removeItem(tokenStorageKey)
    return
  }

  window.localStorage.setItem(tokenStorageKey, token)
}
