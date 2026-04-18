export interface Poi {
  id: string
  amapPoiId?: string
  name: string
  type: string
  description: string
  highlight: string
  duration: string
  location: [number, number]
  subtitle?: string
  tags: string[]
  imageSrc?: string
  rating?: number
  openTime?: string
}

export interface CityGuide {
  city: string
  slogan: string
  story: string
  center: [number, number]
  travelSeasons: string[]
  tags: string[]
  pois: Poi[]
}

export interface CitySummary {
  city: string
  slogan: string
  tags: string[]
  center?: [number, number]
  capital?: string
  narrative?: string
  poiCount?: number
}

export interface ItineraryStop {
  time: string
  name: string
  activity: string
  transport: string
  cost: string
}

export interface DayPlan {
  day: number
  theme: string
  summary: string
  stops: ItineraryStop[]
}

export interface Itinerary {
  title: string
  overview: string
  routeReason: string
  dailyPlan: DayPlan[]
  tips: string[]
}

export interface ItineraryHistoryEntry {
  createdAt: string
  form: PlannerForm
  guide: CityGuide
  id: string
  itinerary: Itinerary
}

export type PlannerChatRole = 'assistant' | 'user'

export interface PlannerChatMessage {
  createdAt: string
  id: string
  role: PlannerChatRole
  text: string
}

export interface PlannerForm {
  city: string
  days: number
  budget: string
  style: string
  interests: string[]
  note: string
}

export interface PlannerGenerationResult {
  form: PlannerForm
  guide: CityGuide
  itinerary: Itinerary
  source: string
}

export interface User {
  id: string
  username: string
  createdAt: string
}

export interface CaptchaChallenge {
  captchaId: string
  expiresInSeconds: number
  svg: string
}

export interface AuthPayload {
  username: string
  password: string
  confirmPassword?: string
  captchaId: string
  captchaCode: string
}

export interface UpdateUsernamePayload {
  username: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UsernameAvailability {
  available: boolean
  suggestions: string[]
}

export interface Favorite {
  userId: string
  poiId: string
  city: string
  poiName: string
  poiType: string
  poiDescription: string
  location: [number, number]
  createdAt: string
}

export type RouteMode = 'walking' | 'driving'

export interface RouteSegment {
  fromPoiId: string
  toPoiId: string
  fromName: string
  toName: string
  distanceMeters: number
  durationSeconds: number
  instructions: string[]
  polyline: [number, number][]
}

export interface RouteWaypoint {
  poiId: string
  name: string
  location: [number, number]
}

export interface RoutePlan {
  city: string
  mode: RouteMode
  source: 'amap-webservice' | 'manual-estimate'
  distanceMeters: number
  durationSeconds: number
  waypoints: RouteWaypoint[]
  polyline: [number, number][]
  segments: RouteSegment[]
  warnings: string[]
}

export type DiscoveryThemeId =
  | 'heritage'
  | 'museum'
  | 'intangible'
  | 'tea'
  | 'night'
  | 'food'

export interface MapDiscoveryItem {
  id: string
  amapPoiId: string
  name: string
  type: string
  subtitle: string
  description: string
  highlight: string
  location: [number, number]
  imageSrc?: string
  tags: string[]
  rating?: number
  openTime?: string
}

export interface MapDiscoveryTheme {
  id: DiscoveryThemeId
  label: string
  hint: string
  keyword: string
  itemIds: string[]
}

export interface CityMapDiscovery {
  city: string
  headline: string
  themes: MapDiscoveryTheme[]
  items: MapDiscoveryItem[]
}

export interface HealthFeatures {
  auth: boolean
  favorites: boolean
  sqlite: boolean
  amapRoutePlanning: boolean
  aiItinerary: boolean
}

export interface HealthResponse {
  ok: boolean
  service: string
  time: string
  features: HealthFeatures
}
