import { createContext } from 'react'
import type {
  CaptchaChallenge,
  CityGuide,
  CitySummary,
  Favorite,
  HealthResponse,
  ItineraryHistoryEntry,
  Itinerary,
  PlannerGenerationResult,
  PlannerForm,
  RouteMode,
  RoutePlan,
  User,
} from '../types'

export interface TravelAppStore {
  amapKey: string
  authBusy: boolean
  authDialogOpen: boolean
  authForm: {
    username: string
    password: string
    captchaCode: string
    captchaId: string
  }
  authMode: 'login' | 'register'
  authCaptcha: CaptchaChallenge | null
  authCaptchaLoading: boolean
  budgetOptions: string[]
  cities: CitySummary[]
  cityOptions: string[]
  clearError: () => void
  closeAuthDialog: () => void
  error: string
  favoriteBusyPoiId: string | null
  favoritePoiIds: Set<string>
  favorites: Favorite[]
  form: PlannerForm
  guide: CityGuide | null
  handleAuthSubmit: () => Promise<void>
  handleGeneratePlan: (overrides?: Partial<PlannerForm>) => Promise<PlannerGenerationResult | null>
  handleLogout: () => void
  handlePlanRoute: () => Promise<void>
  handleRemoveFavorite: (poiId: string) => Promise<void>
  handleToggleFavorite: (poiId: string) => Promise<void>
  health: HealthResponse | null
  interestOptions: string[]
  itineraryHistory: ItineraryHistoryEntry[]
  itinerary: Itinerary | null
  loadingGuide: boolean
  planning: boolean
  planSource: string
  refreshGuide: () => Promise<void>
  restoreItineraryHistory: (historyId: string) => void
  routeError: string
  routeLoading: boolean
  routeMode: RouteMode
  routePlan: RoutePlan | null
  selectCity: (city: string) => Promise<void>
  openAuthDialog: (mode?: 'login' | 'register') => void
  refreshAuthCaptcha: () => Promise<void>
  setAuthField: (field: 'username' | 'password' | 'captchaCode', value: string) => void
  setAuthMode: (mode: 'login' | 'register') => void
  setRouteMode: (mode: RouteMode) => void
  styleOptions: string[]
  toggleInterest: (interest: string) => void
  updateForm: <K extends keyof PlannerForm>(field: K, value: PlannerForm[K]) => void
  user: User | null
}

export const TravelAppContext = createContext<TravelAppStore | null>(null)
