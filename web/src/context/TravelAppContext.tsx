import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { travelApi } from '../api'
import { readAuthToken, writeAuthToken } from '../lib/authStorage'
import { getAuthSubmitValidationMessage } from '../lib/authValidation'
import { readLastCity, writeLastCity } from '../lib/appPreferences'
import { clearPlannerChatMessages } from '../lib/plannerChatMemory'
import {
  clearItineraryHistory,
  readItineraryHistory,
  upsertItineraryHistoryEntry,
  writeItineraryHistory,
} from '../lib/itineraryHistory'
import type {
  CaptchaChallenge,
  CityGuide,
  CitySummary,
  Favorite,
  HealthResponse,
  Itinerary,
  PlannerGenerationResult,
  ItineraryHistoryEntry,
  PlannerForm,
  RouteMode,
  RoutePlan,
  UpdatePasswordPayload,
  User,
} from '../types'
import { TravelAppContext, type TravelAppStore } from './travelAppStore'

const interestOptions = ['历史古迹', '自然风光', '非遗体验', '美食街区', 'Citywalk', '夜游打卡']
const styleOptions = ['沉浸文化', '轻松打卡', '深度讲解', '预算友好']
const budgetOptions = ['1000-2000', '2000-3000', '3000-5000', '高品质体验']

const initialForm: PlannerForm = {
  city: '杭州',
  days: 2,
  budget: '2000-3000',
  style: '沉浸文化',
  interests: ['历史古迹', '非遗体验'],
  note: '希望路线兼顾地图观感、真实动线和城市文化体验。',
}

const emptyAuthForm = {
  username: '',
  password: '',
  confirmPassword: '',
  captchaCode: '',
  captchaId: '',
}

export function TravelAppProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<CitySummary[]>([])
  const [guide, setGuide] = useState<CityGuide | null>(null)
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [itineraryHistory, setItineraryHistory] = useState<ItineraryHistoryEntry[]>(() =>
    readItineraryHistory(),
  )
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [planSource, setPlanSource] = useState('fallback-template')
  const [loadingGuide, setLoadingGuide] = useState(false)
  const [planning, setPlanning] = useState(false)
  const [error, setError] = useState('')
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null)
  const [routeMode, setRouteMode] = useState<RouteMode>('walking')
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [token, setToken] = useState<string | null>(() => readAuthToken())
  const [user, setUser] = useState<User | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [favoriteBusyPoiId, setFavoriteBusyPoiId] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthModeState] = useState<'login' | 'register'>('login')
  const [authCaptcha, setAuthCaptcha] = useState<CaptchaChallenge | null>(null)
  const [authCaptchaLoading, setAuthCaptchaLoading] = useState(false)
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [form, setForm] = useState<PlannerForm>({
    ...initialForm,
    city: readLastCity() || initialForm.city,
  })

  const amapKey = import.meta.env.VITE_AMAP_KEY ?? ''

  const bootstrap = useEffectEvent(async () => {
    try {
      const [healthResponse, cityResponse] = await Promise.all([
        travelApi.getHealth(),
        travelApi.getCities(),
      ])

      setHealth(healthResponse)
      setCities(cityResponse.cities)

      const savedCity = readLastCity()
      const initialCity = cityResponse.cities.some((city) => city.city === savedCity)
        ? savedCity
        : cityResponse.cities[0]?.city ?? initialForm.city

      setForm((current) => ({ ...current, city: initialCity }))
      await loadGuide(initialCity)

      if (token) {
        await restoreSession(token)
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    }
  })

  useEffect(() => {
    void bootstrap()
  }, [])

  useEffect(() => {
    writeItineraryHistory(itineraryHistory)
  }, [itineraryHistory])

  useEffect(() => {
    if (token || user) {
      return
    }

    clearItineraryHistory()
    clearPlannerChatMessages()
    setItineraryHistory([])
    setItinerary(null)
    setPlanSource('fallback-template')
  }, [token, user])

  useEffect(() => {
    if (!guide) {
      return
    }

    let cancelled = false
    setRouteLoading(true)
    setRouteError('')

    void requestRoutePlan(guide, routeMode)
      .then((response) => {
        if (cancelled) {
          return
        }

        startTransition(() => {
          setRoutePlan(response.routePlan)
        })
      })
      .catch((caughtError) => {
        if (cancelled) {
          return
        }

        setRoutePlan(null)
        setRouteError(getErrorMessage(caughtError))
      })
      .finally(() => {
        if (!cancelled) {
          setRouteLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [guide, routeMode])

  async function restoreSession(authToken: string) {
    try {
      const [meResponse, favoritesResponse] = await Promise.all([
        travelApi.getMe(authToken),
        travelApi.getFavorites(authToken),
      ])

      setUser(meResponse.user)
      setFavorites(favoritesResponse.favorites)
    } catch {
      clearAuthState()
    }
  }

  function clearAuthState() {
    setToken(null)
    setUser(null)
    setFavorites([])
    setAuthForm(emptyAuthForm)
    writeAuthToken(null)
  }

  const clearError = useCallback(() => setError(''), [])

  const refreshAuthCaptcha = useCallback(async () => {
    setAuthCaptchaLoading(true)

    try {
      const captcha = await travelApi.getCaptcha()
      setAuthCaptcha(captcha)
      setAuthForm((current) => ({
        ...current,
        captchaCode: '',
        captchaId: captcha.captchaId,
      }))
    } catch (caughtError) {
      setAuthCaptcha(null)
      setAuthForm((current) => ({
        ...current,
        captchaCode: '',
        captchaId: '',
      }))
      setError(getErrorMessage(caughtError))
    } finally {
      setAuthCaptchaLoading(false)
    }
  }, [])

  function openAuthDialog(mode: 'login' | 'register' = 'login') {
    setAuthModeState(mode)
    setAuthDialogOpen(true)
    setError('')
  }

  function closeAuthDialog() {
    setAuthDialogOpen(false)
    setAuthForm(emptyAuthForm)
    setError('')
  }

  const setAuthMode = useCallback((mode: 'login' | 'register') => {
    setAuthModeState(mode)
    setError('')
  }, [])

  async function loadGuide(city: string) {
    setLoadingGuide(true)
    setError('')

    try {
      const response = await travelApi.getGuide(city)
      writeLastCity(response.guide.city)
      startTransition(() => {
        setGuide(response.guide)
      })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoadingGuide(false)
    }
  }

  async function selectCity(city: string) {
    writeLastCity(city)
    setForm((current) => ({
      ...current,
      city,
    }))
    startTransition(() => setItinerary(null))
    await loadGuide(city)
  }

  async function refreshGuide() {
    await loadGuide(form.city)
  }

  function pushItineraryHistoryEntry(entry: ItineraryHistoryEntry) {
    setItineraryHistory((current) => upsertItineraryHistoryEntry(current, entry))
  }

  function restoreItineraryHistory(historyId: string) {
    if (!token || !user) {
      openAuthDialog('login')
      setError('请先登录或注册，再查看历史行程。')
      return
    }

    const historyEntry = itineraryHistory.find((entry) => entry.id === historyId)
    if (!historyEntry) {
      return
    }

    writeLastCity(historyEntry.guide.city)
    startTransition(() => {
      setForm({
        ...historyEntry.form,
        interests: [...historyEntry.form.interests],
      })
      setGuide(historyEntry.guide)
      setItinerary(historyEntry.itinerary)
      setPlanSource('history-memory')
    })
  }

  async function handleGeneratePlan(overrides?: Partial<PlannerForm>): Promise<PlannerGenerationResult | null> {
    if (!token || !user) {
      openAuthDialog('login')
      setError('请先登录或注册，再使用行程规划。')
      return null
    }

    setPlanning(true)
    setError('')

    try {
      const payload: PlannerForm = {
        ...form,
        ...overrides,
        interests: overrides?.interests ? [...overrides.interests] : [...form.interests],
        note: overrides?.note ?? form.note,
      }
      const response = await travelApi.createItinerary(payload)
      writeLastCity(response.guide.city)
      const historyEntry: ItineraryHistoryEntry = {
        createdAt: new Date().toISOString(),
        form: { ...payload, interests: [...payload.interests] },
        guide: response.guide,
        id: `${response.guide.city}-${Date.now()}`,
        itinerary: response.itinerary,
      }

      startTransition(() => {
        setForm(payload)
        setGuide(response.guide)
        setItinerary(response.itinerary)
        setPlanSource(response.source)
      })
      pushItineraryHistoryEntry(historyEntry)
      return {
        form: payload,
        guide: response.guide,
        itinerary: response.itinerary,
        source: response.source,
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      return null
    } finally {
      setPlanning(false)
    }
  }

  async function handlePlanRoute() {
    if (!guide) {
      return
    }

    setRouteLoading(true)
    setRouteError('')

    try {
      const response = await requestRoutePlan(guide, routeMode)
      startTransition(() => {
        setRoutePlan(response.routePlan)
      })
    } catch (caughtError) {
      setRoutePlan(null)
      setRouteError(getErrorMessage(caughtError))
    } finally {
      setRouteLoading(false)
    }
  }

  async function handleAuthSubmit() {
    const validationMessage = getAuthSubmitValidationMessage(authMode, authForm)

    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setAuthBusy(true)
    setError('')

    try {
      const payload = {
        ...authForm,
        username: authForm.username.trim(),
      }
      const response =
        authMode === 'login'
          ? await travelApi.login(payload)
          : await travelApi.register(payload)

      setToken(response.token)
      setUser(response.user)
      writeAuthToken(response.token)
      setAuthForm(emptyAuthForm)
      setError('')
      setAuthDialogOpen(false)

      const favoritesResponse = await travelApi.getFavorites(response.token)
      setFavorites(favoritesResponse.favorites)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      await refreshAuthCaptcha()
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleToggleFavorite(poiId: string) {
    if (!token || !guide) {
      openAuthDialog('login')
      setError('登录后才能收藏点位。')
      return
    }

    setFavoriteBusyPoiId(poiId)
    setError('')

    try {
      const isFavorite = favorites.some((favorite) => favorite.poiId === poiId)

      if (isFavorite) {
        await travelApi.removeFavorite(poiId, token)
        setFavorites((current) => current.filter((favorite) => favorite.poiId !== poiId))
      } else {
        const response = await travelApi.addFavorite({ city: guide.city, poiId }, token)
        setFavorites((current) => [
          response.favorite,
          ...current.filter((favorite) => favorite.poiId !== response.favorite.poiId),
        ])
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setFavoriteBusyPoiId(null)
    }
  }

  async function handleRemoveFavorite(poiId: string) {
    if (!token) {
      return
    }

    setFavoriteBusyPoiId(poiId)
    setError('')

    try {
      await travelApi.removeFavorite(poiId, token)
      setFavorites((current) => current.filter((favorite) => favorite.poiId !== poiId))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setFavoriteBusyPoiId(null)
    }
  }

  async function handleProfileUsernameUpdate(username: string) {
    if (!token || !user) {
      openAuthDialog('login')
      throw new Error('请先登录后再修改用户名。')
    }

    const response = await travelApi.updateUsername(
      {
        username: username.trim(),
      },
      token,
    )

    setToken(response.token)
    setUser(response.user)
    writeAuthToken(response.token)

    return response.user
  }

  async function handleProfilePasswordUpdate(payload: UpdatePasswordPayload) {
    if (!token || !user) {
      openAuthDialog('login')
      throw new Error('请先登录后再修改密码。')
    }

    await travelApi.updatePassword(payload, token)
  }

  function handleLogout() {
    clearAuthState()
    closeAuthDialog()
  }

  function updateForm<K extends keyof PlannerForm>(field: K, value: PlannerForm[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function toggleInterest(interest: string) {
    setForm((current) => {
      const exists = current.interests.includes(interest)
      const interests = exists
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest]

      return {
        ...current,
        interests: interests.length > 0 ? interests : [interest],
      }
    })
  }

  function setAuthField(
    field: 'username' | 'password' | 'confirmPassword' | 'captchaCode',
    value: string,
  ) {
    setAuthForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const value: TravelAppStore = {
    amapKey,
    authBusy,
    authCaptcha,
    authCaptchaLoading,
    authDialogOpen,
    authForm,
    authMode,
    budgetOptions,
    cities,
    cityOptions: cities.length > 0 ? cities.map((city) => city.city) : [form.city],
    clearError,
    closeAuthDialog,
    error,
    favoriteBusyPoiId,
    favoritePoiIds: new Set(favorites.map((favorite) => favorite.poiId)),
    favorites,
    form,
    guide,
    handleAuthSubmit,
    handleGeneratePlan,
    handleLogout,
    handlePlanRoute,
    handleProfilePasswordUpdate,
    handleProfileUsernameUpdate,
    handleRemoveFavorite,
    handleToggleFavorite,
    health,
    interestOptions,
    itineraryHistory,
    itinerary,
    loadingGuide,
    planning,
    planSource,
    refreshGuide,
    restoreItineraryHistory,
    routeError,
    routeLoading,
    routeMode,
    routePlan,
    selectCity,
    openAuthDialog,
    refreshAuthCaptcha,
    setAuthField,
    setAuthMode,
    setRouteMode,
    styleOptions,
    toggleInterest,
    updateForm,
    user,
  }

  return <TravelAppContext.Provider value={value}>{children}</TravelAppContext.Provider>
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return '请求失败，请检查前后端服务是否已经启动。'
}

async function requestRoutePlan(guide: CityGuide, mode: RouteMode) {
  const poiIds = guide.pois.slice(0, 4).map((poi) => poi.id)

  return travelApi.planRoute({
    city: guide.city,
    poiIds,
    mode,
  })
}
