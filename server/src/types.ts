export type Coordinates = [number, number];

export interface Poi {
  id: string;
  amapPoiId?: string;
  name: string;
  type: string;
  description: string;
  highlight: string;
  duration: string;
  location: Coordinates;
  subtitle?: string;
  tags: string[];
  imageSrc?: string;
  rating?: number;
  openTime?: string;
}

export interface CityGuide {
  city: string;
  slogan: string;
  story: string;
  center: Coordinates;
  travelSeasons: string[];
  tags: string[];
  pois: Poi[];
}

export interface CitySummary {
  city: string;
  slogan: string;
  tags: string[];
  center?: Coordinates;
  capital?: string;
  narrative?: string;
  poiCount?: number;
}

export interface PlannerInput {
  city: string;
  days: number;
  budget: string;
  style: string;
  interests: string[];
  note?: string;
}

export interface ItineraryStop {
  time: string;
  name: string;
  activity: string;
  transport: string;
  cost: string;
}

export interface DayPlan {
  day: number;
  theme: string;
  summary: string;
  stops: ItineraryStop[];
}

export interface TravelItinerary {
  title: string;
  overview: string;
  routeReason: string;
  dailyPlan: DayPlan[];
  tips: string[];
}

export interface AppUser {
  id: string;
  username: string;
  createdAt: string;
}

export interface FavoriteRecord {
  userId: string;
  poiId: string;
  city: string;
  poiName: string;
  poiType: string;
  poiDescription: string;
  location: Coordinates;
  createdAt: string;
}

export type RouteMode = "walking" | "driving";

export interface RouteWaypoint {
  poiId: string;
  name: string;
  location: Coordinates;
}

export interface RouteSegment {
  fromPoiId: string;
  toPoiId: string;
  fromName: string;
  toName: string;
  distanceMeters: number;
  durationSeconds: number;
  instructions: string[];
  polyline: Coordinates[];
}

export interface RoutePlan {
  city: string;
  mode: RouteMode;
  source: "amap-webservice" | "manual-estimate";
  distanceMeters: number;
  durationSeconds: number;
  waypoints: RouteWaypoint[];
  polyline: Coordinates[];
  segments: RouteSegment[];
  warnings: string[];
}

export type DiscoveryThemeId =
  | "heritage"
  | "museum"
  | "intangible"
  | "tea"
  | "night"
  | "food";

export interface MapDiscoveryItem {
  id: string;
  amapPoiId: string;
  name: string;
  type: string;
  subtitle: string;
  description: string;
  highlight: string;
  location: Coordinates;
  imageSrc?: string;
  tags: string[];
  rating?: number;
  openTime?: string;
}

export interface MapDiscoveryTheme {
  id: DiscoveryThemeId;
  label: string;
  hint: string;
  keyword: string;
  itemIds: string[];
}

export interface CityMapDiscovery {
  city: string;
  headline: string;
  themes: MapDiscoveryTheme[];
  items: MapDiscoveryItem[];
}
