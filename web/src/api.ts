import type {
  AuthPayload,
  CaptchaChallenge,
  CityGuide,
  CityMapDiscovery,
  CitySummary,
  Favorite,
  HealthResponse,
  Itinerary,
  PlannerForm,
  RouteMode,
  RoutePlan,
  UpdatePasswordPayload,
  UpdateUsernamePayload,
  UsernameAvailability,
  User,
} from './types'

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

interface RequestOptions extends RequestInit {
  token?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const { token, headers, ...init } = options

  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    ...init,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String(payload.message)
        : typeof payload === 'string'
          ? payload
          : '接口请求失败'

    throw new Error(message)
  }

  return payload as T
}

export const travelApi = {
  getHealth() {
    return request<HealthResponse>('/health')
  },
  getCities() {
    return request<{ cities: CitySummary[] }>('/cities')
  },
  getGuide(city: string) {
    return request<{ guide: CityGuide }>(`/guide?city=${encodeURIComponent(city)}`)
  },
  getMapDiscovery(city: string) {
    return request<{ discovery: CityMapDiscovery }>(
      `/map/discovery?city=${encodeURIComponent(city)}`,
    )
  },
  createItinerary(payload: PlannerForm) {
    return request<{ guide: CityGuide; itinerary: Itinerary; source: string }>('/itinerary', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  planRoute(payload: { city: string; poiIds: string[]; mode: RouteMode }) {
    return request<{ routePlan: RoutePlan }>('/routes/plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getCaptcha() {
    return request<CaptchaChallenge>('/auth/captcha')
  },
  checkUsernameAvailability(username: string) {
    return request<UsernameAvailability>(
      `/auth/username-availability?username=${encodeURIComponent(username)}`,
    )
  },
  register(payload: AuthPayload) {
    return request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  login(payload: AuthPayload) {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getMe(token: string) {
    return request<{ user: User }>('/auth/me', { token })
  },
  updateUsername(payload: UpdateUsernamePayload, token: string) {
    return request<{ user: User; token: string }>('/auth/profile', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    })
  },
  updatePassword(payload: UpdatePasswordPayload, token: string) {
    return request<{ success: boolean }>('/auth/password', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    })
  },
  getFavorites(token: string) {
    return request<{ favorites: Favorite[] }>('/favorites', { token })
  },
  addFavorite(payload: { city: string; poiId: string }, token: string) {
    return request<{ favorite: Favorite }>('/favorites', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },
  removeFavorite(poiId: string, token: string) {
    return request<{ deleted: boolean }>(`/favorites/${encodeURIComponent(poiId)}`, {
      method: 'DELETE',
      token,
    })
  },
}
