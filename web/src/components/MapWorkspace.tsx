import {
  CarFront,
  ExternalLink,
  Footprints,
  LocateFixed,
  MapPinned,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { travelApi } from "../api";
import { getCityHero, getPoiMedia } from "../content/heritageMedia";
import {
  observeElementResize,
  scheduleStabilizedResize,
  waitForElementToHaveSize,
  waitForMapComplete,
} from "../lib/amapCanvas";
import { formatDistance, formatDuration } from "../lib/format";
import { loadAMap } from "../lib/loadAMap";
import type {
  CityMapDiscovery,
  DiscoveryThemeId,
  MapDiscoveryItem,
  MapDiscoveryTheme,
  Poi,
  RouteMode,
  RoutePlan,
} from "../types";

type SearchScope = "guide" | "theme" | "keyword" | "nearby";
type PlaceSource = "guide" | "mcp-discovery" | "amap-search" | "amap-nearby";
type NearbyThemeId = DiscoveryThemeId;
type DiscoveryTheme = MapDiscoveryTheme;

interface SearchSuggestion {
  address: string;
  district: string;
  id: string;
  name: string;
}

interface DiscoveryPlace {
  id: string;
  name: string;
  type: string;
  subtitle: string;
  stayDuration?: string;
  description: string;
  highlight?: string;
  imageSrc?: string;
  location: [number, number];
  source: PlaceSource;
  guidePoiId?: string;
  amapPoiId?: string;
  openTime?: string;
  rating?: number;
  tags?: string[];
  distanceMeters?: number;
}

interface LiveRouteSummary {
  distanceMeters: number;
  durationSeconds: number;
  mode: RouteMode;
  steps: string[];
}

interface ResolvedLocationDetails {
  address: string;
  businessArea: string;
  district: string;
}

interface LiveWeatherSnapshot {
  city: string;
  humidity: string;
  reportTime: string;
  temperature: string;
  weather: string;
  windDirection: string;
  windPower: string;
}

interface WeatherForecastCast {
  date: string;
  dayTemp: string;
  dayWeather: string;
  nightTemp: string;
}

interface MapWorkspaceProps {
  amapKey: string;
  city: string;
  center: [number, number];
  favoriteBusyPoiId: string | null;
  favoritePoiIds: Set<string>;
  immersive3D: boolean;
  initialPoiId?: string | null;
  mapLanguage: "zh_cn" | "en";
  onRouteModeChange: (mode: RouteMode) => void;
  onToggleFavorite: (poiId: string) => Promise<void>;
  onWeatherLineChange?: (line: string) => void;
  pois: Poi[];
  routeMode: RouteMode;
  routePlan: RoutePlan | null;
}

interface MapState {
  AMap: AMapNamespace | null;
  driving: AMapRouteService | null;
  geocoder: AMapGeocoder | null;
  geolocation: AMapGeolocation | null;
  infoWindow: AMapInfoWindow | null;
  map: AMapMap | null;
  markers: AMapMarker[];
  roadNetLayer: AMapLayer | null;
  routeLine: AMapPolyline | null;
  satelliteLayer: AMapLayer | null;
  standardLayer: AMapLayer | null;
  userMarker: AMapMarker | null;
  weather: AMapWeather | null;
  walking: AMapRouteService | null;
}

function createInitialMapState(): MapState {
  return {
    AMap: null,
    driving: null,
    geocoder: null,
    geolocation: null,
    infoWindow: null,
    map: null,
    markers: [],
    roadNetLayer: null,
    routeLine: null,
    satelliteLayer: null,
    standardLayer: null,
    userMarker: null,
    weather: null,
    walking: null,
  };
}

const defaultDiscoveryThemes: DiscoveryTheme[] = [
  {
    id: "museum",
    label: "博物馆",
    keyword: "博物馆",
    hint: "适合先建立城市知识框架，再转入街区漫游。",
    itemIds: [],
  },
  {
    id: "heritage",
    label: "古迹遗产",
    keyword: "文化遗产",
    hint: "更适合串联古建、遗址与城市记忆。",
    itemIds: [],
  },
  {
    id: "intangible",
    label: "非遗体验",
    keyword: "非遗",
    hint: "补足地方技艺、手作与当代生活场景。",
    itemIds: [],
  },
  {
    id: "tea",
    label: "茶文化",
    keyword: "茶文化",
    hint: "适合做慢节奏、停留型的文化导览。",
    itemIds: [],
  },
  {
    id: "night",
    label: "夜游线索",
    keyword: "夜游",
    hint: "适合查看傍晚到夜间的地图层与街区动线。",
    itemIds: [],
  },
  {
    id: "food",
    label: "风味街区",
    keyword: "美食",
    hint: "把地方风味和城市烟火气也纳入路线。",
    itemIds: [],
  },
];

const preferredThemeIds = new Set<DiscoveryThemeId>([
  "heritage",
  "museum",
  "intangible",
]);

const nearbyKeyword = "文化遗产";

function toGuidePlaces(pois: Poi[]): DiscoveryPlace[] {
  return pois.map((poi) => ({
    amapPoiId: poi.amapPoiId,
    id: poi.id,
    name: poi.name,
    type: poi.type,
    subtitle: poi.duration,
    stayDuration: poi.duration,
    description: poi.description,
    highlight: poi.highlight,
    imageSrc: poi.imageSrc,
    location: poi.location,
    guidePoiId: poi.id,
    openTime: poi.openTime,
    rating: poi.rating,
    tags: poi.tags,
    source: "guide",
  }));
}

function toDiscoveryPlaces(items: MapDiscoveryItem[]): DiscoveryPlace[] {
  return items.map((item) => ({
    id: item.id,
    amapPoiId: item.amapPoiId,
    name: item.name,
    type: item.type,
    subtitle: item.subtitle,
    description: item.description,
    highlight: item.highlight,
    imageSrc: item.imageSrc,
    location: item.location,
    openTime: item.openTime,
    rating: item.rating,
    tags: item.tags,
    source: "mcp-discovery",
  }));
}

function getPlaceSourceLabel(source: PlaceSource) {
  switch (source) {
    case "guide":
      return "导览点位";
    case "mcp-discovery":
      return "主题点位";
    case "amap-nearby":
      return "附近推荐";
    default:
      return "高德检索";
  }
}

function getMarkerLabel(place: DiscoveryPlace, index: number) {
  if (place.source === "guide") {
    return String(index + 1);
  }

  if (place.source === "mcp-discovery") {
    return "荐";
  }

  return place.source === "amap-nearby" ? "近" : "搜";
}

function getPlaceSecondaryLabel(place: DiscoveryPlace) {
  if (place.source === "guide") {
    return `建议停留 ${place.subtitle}`;
  }

  return place.subtitle;
}

function normalizeCoordinates(input: unknown): [number, number] | null {
  if (Array.isArray(input) && input.length >= 2) {
    const [lng, lat] = input.map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  if (typeof input === "string") {
    const [lngText, latText] = input.split(",");
    const lng = Number(lngText);
    const lat = Number(latText);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "getLng" in input &&
    "getLat" in input
  ) {
    const lngLat = input as AMapLngLatLike;
    return [lngLat.getLng(), lngLat.getLat()];
  }

  return null;
}

function extractImageSrc(item: Record<string, unknown>) {
  const photos =
    "photos" in item && Array.isArray(item.photos) ? item.photos : [];
  const firstPhoto = photos[0];

  if (typeof firstPhoto === "string" && firstPhoto.trim()) {
    return firstPhoto;
  }

  if (
    typeof firstPhoto === "object" &&
    firstPhoto !== null &&
    "url" in firstPhoto &&
    typeof firstPhoto.url === "string" &&
    firstPhoto.url.trim()
  ) {
    return firstPhoto.url;
  }

  if ("photo" in item && typeof item.photo === "string" && item.photo.trim()) {
    return item.photo;
  }

  return undefined;
}

function extractPlaceSearchResults(
  result: unknown,
  source: PlaceSource,
  city: string,
): DiscoveryPlace[] {
  const items =
    typeof result === "object" &&
    result !== null &&
    "poiList" in result &&
    typeof result.poiList === "object" &&
    result.poiList !== null &&
    "pois" in result.poiList &&
    Array.isArray(result.poiList.pois)
      ? result.poiList.pois
      : [];

  const places: DiscoveryPlace[] = [];

  items.forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      return;
    }

    const location = normalizeCoordinates(
      "location" in item ? item.location : null,
    );
    if (!location) {
      return;
    }

    const name =
      typeof item.name === "string" && item.name.trim()
        ? item.name
        : `Place ${index + 1}`;
    const type =
      typeof item.type === "string" && item.type.trim()
        ? item.type.split(";")[0]
        : "AMap place";
    const district =
      typeof item.adname === "string" && item.adname.trim()
        ? item.adname
        : typeof item.address === "string" && item.address.trim()
          ? item.address
          : city;
    const address =
      typeof item.address === "string" && item.address.trim()
        ? item.address
        : district;
    const distanceMeters =
      typeof item.distance === "string" || typeof item.distance === "number"
        ? Number(item.distance) || undefined
        : undefined;
    const rawId =
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `${source}-${index}-${name}`;

    places.push({
      id: `amap-${rawId}`,
      amapPoiId: rawId,
      name,
      type,
      subtitle: district,
      description: address,
      distanceMeters,
      imageSrc: extractImageSrc(item),
      location,
      source,
    });
  });

  return places;
}

function extractAutoCompleteTips(
  result: unknown,
  city: string,
): SearchSuggestion[] {
  const tips =
    typeof result === "object" &&
    result !== null &&
    "tips" in result &&
    Array.isArray(result.tips)
      ? result.tips
      : [];

  const items: SearchSuggestion[] = [];

  tips.forEach((tip, index) => {
    if (typeof tip !== "object" || tip === null) {
      return;
    }

    const name = typeof tip.name === "string" ? tip.name.trim() : "";
    if (!name) {
      return;
    }

    const district =
      typeof tip.district === "string" && tip.district.trim()
        ? tip.district
        : city;
    const address =
      typeof tip.address === "string" && tip.address.trim()
        ? tip.address
        : district;
    const rawId =
      typeof tip.id === "string" && tip.id.trim()
        ? tip.id
        : `${district}-${name}-${index}`;

    items.push({
      address,
      district,
      id: `tip-${rawId}`,
      name,
    });
  });

  return items.slice(0, 6);
}

function extractRouteSummary(
  result: unknown,
  mode: RouteMode,
): LiveRouteSummary | null {
  const routes =
    typeof result === "object" &&
    result !== null &&
    "routes" in result &&
    Array.isArray(result.routes)
      ? result.routes
      : [];

  const firstRoute =
    routes.length > 0 && typeof routes[0] === "object" && routes[0] !== null
      ? routes[0]
      : null;

  if (!firstRoute) {
    return null;
  }

  const distance =
    "distance" in firstRoute &&
    (typeof firstRoute.distance === "string" ||
      typeof firstRoute.distance === "number")
      ? Number(firstRoute.distance)
      : 0;
  const duration =
    "time" in firstRoute &&
    (typeof firstRoute.time === "string" || typeof firstRoute.time === "number")
      ? Number(firstRoute.time)
      : 0;
  const steps =
    "steps" in firstRoute && Array.isArray(firstRoute.steps)
      ? firstRoute.steps
          .map((step: unknown) =>
            typeof step === "object" &&
            step !== null &&
            "instruction" in step &&
            typeof step.instruction === "string"
              ? step.instruction
              : null,
          )
          .filter((instruction: string | null): instruction is string =>
            Boolean(instruction),
          )
          .slice(0, 4)
      : [];

  return distance > 0
    ? {
        distanceMeters: distance,
        durationSeconds: duration > 0 ? duration : Math.round(distance / 1.35),
        mode,
        steps,
      }
    : null;
}

function extractResolvedLocationDetails(
  result: unknown,
  fallbackDistrict: string,
): ResolvedLocationDetails | null {
  const regeocode =
    typeof result === "object" &&
    result !== null &&
    "regeocode" in result &&
    typeof result.regeocode === "object" &&
    result.regeocode !== null
      ? result.regeocode
      : null;

  if (!regeocode) {
    return null;
  }

  const address =
    "formattedAddress" in regeocode &&
    typeof regeocode.formattedAddress === "string" &&
    regeocode.formattedAddress.trim()
      ? regeocode.formattedAddress
      : fallbackDistrict;
  const addressComponent =
    "addressComponent" in regeocode &&
    typeof regeocode.addressComponent === "object" &&
    regeocode.addressComponent !== null
      ? regeocode.addressComponent
      : null;
  const district =
    addressComponent &&
    "district" in addressComponent &&
    typeof addressComponent.district === "string" &&
    addressComponent.district.trim()
      ? addressComponent.district
      : fallbackDistrict;
  const businessAreas =
    addressComponent &&
    "businessAreas" in addressComponent &&
    Array.isArray(addressComponent.businessAreas)
      ? addressComponent.businessAreas
      : [];
  const firstBusinessArea =
    businessAreas.length > 0 &&
    typeof businessAreas[0] === "object" &&
    businessAreas[0] !== null &&
    "name" in businessAreas[0] &&
    typeof businessAreas[0].name === "string" &&
    businessAreas[0].name.trim()
      ? businessAreas[0].name
      : "";

  return {
    address,
    businessArea: firstBusinessArea,
    district,
  };
}

function extractLiveWeatherSnapshot(result: unknown): LiveWeatherSnapshot | null {
  if (typeof result !== "object" || result === null) {
    return null;
  }

  const city =
    "city" in result && typeof result.city === "string" && result.city.trim()
      ? result.city
      : "";
  const weather =
    "weather" in result &&
    typeof result.weather === "string" &&
    result.weather.trim()
      ? result.weather
      : "";
  const temperature =
    "temperature" in result &&
    typeof result.temperature === "string" &&
    result.temperature.trim()
      ? result.temperature
      : "";

  if (!city && !weather && !temperature) {
    return null;
  }

  return {
    city,
    humidity:
      "humidity" in result && typeof result.humidity === "string"
        ? result.humidity
        : "",
    reportTime:
      "reportTime" in result && typeof result.reportTime === "string"
        ? result.reportTime
        : "",
    temperature,
    weather,
    windDirection:
      "windDirection" in result && typeof result.windDirection === "string"
        ? result.windDirection
        : "",
    windPower:
      "windPower" in result && typeof result.windPower === "string"
        ? result.windPower
        : "",
  };
}

function extractForecastCasts(result: unknown): WeatherForecastCast[] {
  if (typeof result !== "object" || result === null) {
    return [];
  }

  const forecasts =
    "forecasts" in result && Array.isArray(result.forecasts)
      ? result.forecasts
      : [];
  const firstForecast =
    forecasts.length > 0 &&
    typeof forecasts[0] === "object" &&
    forecasts[0] !== null
      ? forecasts[0]
      : null;
  const casts: unknown[] =
    firstForecast &&
    "casts" in firstForecast &&
    Array.isArray(firstForecast.casts)
      ? firstForecast.casts
      : [];

  return casts
    .map((cast) => {
      if (typeof cast !== "object" || cast === null) {
        return null;
      }

      const date =
        "date" in cast && typeof cast.date === "string" ? cast.date : "";
      const dayTemp =
        "dayTemp" in cast && typeof cast.dayTemp === "string"
          ? cast.dayTemp
          : "daytemp" in cast && typeof cast.daytemp === "string"
            ? cast.daytemp
            : "";
      const nightTemp =
        "nightTemp" in cast && typeof cast.nightTemp === "string"
          ? cast.nightTemp
          : "nighttemp" in cast && typeof cast.nighttemp === "string"
            ? cast.nighttemp
            : "";
      const dayWeather =
        "dayWeather" in cast && typeof cast.dayWeather === "string"
          ? cast.dayWeather
          : "dayweather" in cast && typeof cast.dayweather === "string"
            ? cast.dayweather
            : "";

      if (!date && !dayTemp && !nightTemp && !dayWeather) {
        return null;
      }

      return {
        date,
        dayTemp,
        dayWeather,
        nightTemp,
      } satisfies WeatherForecastCast;
    })
    .filter((cast): cast is WeatherForecastCast => cast !== null)
    .slice(0, 3);
}

function buildNavigationUrl(
  place: DiscoveryPlace,
  mode: RouteMode,
  origin: [number, number] | null,
) {
  const params = new URLSearchParams({
    callnative: "1",
    mode: mode === "driving" ? "car" : "walk",
    src: "lvyou",
    to: `${place.location[0]},${place.location[1]},${place.name}`,
  });

  if (origin) {
    params.set("from", `${origin[0]},${origin[1]},My location`);
  }

  return `https://uri.amap.com/navigation?${params.toString()}`;
}

export function MapWorkspace({
  amapKey,
  city,
  center,
  favoriteBusyPoiId,
  favoritePoiIds,
  immersive3D,
  initialPoiId,
  mapLanguage,
  onRouteModeChange,
  onToggleFavorite,
  onWeatherLineChange,
  pois,
  routeMode,
  routePlan,
}: MapWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("guide");
  const [discovery, setDiscovery] = useState<CityMapDiscovery | null>(null);
  const [, setDiscoveryError] = useState("");
  const [searchResults, setSearchResults] = useState<DiscoveryPlace[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [, setSearchLoading] = useState(false);
  const [, setSearchMessage] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [mapReady, setMapReady] = useState(false);
  const [isInspectorVisible, setIsInspectorVisible] = useState(false);
  const [liveRouteSummary, setLiveRouteSummary] =
    useState<LiveRouteSummary | null>(null);
  const [resolvedSelectedPlace, setResolvedSelectedPlace] =
    useState<ResolvedLocationDetails | null>(null);
  const [cityWeather, setCityWeather] = useState<LiveWeatherSnapshot | null>(
    null,
  );
  const [, setCityForecast] = useState<WeatherForecastCast[]>([]);
  const [nearbyOriginLabel, setNearbyOriginLabel] = useState("城市中心");
  const [activeNearbyThemeId, setActiveNearbyThemeId] = useState<NearbyThemeId>(
    () => defaultDiscoveryThemes[0]?.id ?? "museum",
  );

  const guidePlaces = useMemo(() => toGuidePlaces(pois), [pois]);
  const discoveryPlaces = useMemo(
    () => toDiscoveryPlaces(discovery?.items ?? []),
    [discovery],
  );
  const discoveryPlaceLookup = useMemo(
    () => new Map(discoveryPlaces.map((place) => [place.id, place])),
    [discoveryPlaces],
  );
  const guideLookup = useMemo(
    () => new Map(pois.map((poi) => [poi.id, poi])),
    [pois],
  );
  const nearbyThemes = useMemo(() => {
    const sourceThemes =
      discovery?.themes && discovery.themes.length > 0
        ? discovery.themes
        : defaultDiscoveryThemes;
    const filteredThemes = sourceThemes.filter((theme) =>
      preferredThemeIds.has(theme.id),
    );

    return filteredThemes.length > 0
      ? filteredThemes
      : defaultDiscoveryThemes.filter((theme) => preferredThemeIds.has(theme.id));
  }, [discovery]);
  const heroMedia = getCityHero(city);
  const deferredQuery = useDeferredValue(query.trim());

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const routePanelRef = useRef<HTMLDivElement | null>(null);
  const mapStateRef = useRef<MapState>(createInitialMapState());
  const mapRunIdRef = useRef(0);
  const geolocationResolverRef = useRef<
    ((value: [number, number]) => void) | null
  >(null);
  const geolocationRejectRef = useRef<((error: Error) => void) | null>(null);

  function isActiveMapRun(runId: number, state: MapState | null | undefined) {
    return Boolean(
      state?.map &&
        runId === mapRunIdRef.current &&
        mapStateRef.current.map === state.map,
    );
  }

  function runMapCommand(command: () => void) {
    try {
      command();
    } catch {
      // 高德实例在切换视图和重建时会短暂进入不可操作状态，这里静默跳过瞬时异常。
    }
  }

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) {
      return;
    }

    return observeElementResize(container, () => {
      const map = mapStateRef.current.map;
      if (map) {
        runMapCommand(() => map.resize());
      }
    });
  }, []);

  const activeNearbyTheme =
    nearbyThemes.find((theme) => theme.id === activeNearbyThemeId) ??
    nearbyThemes[0];
  const themePlaces = useMemo(() => {
    if (!activeNearbyTheme) {
      return discoveryPlaces;
    }

    return activeNearbyTheme.itemIds
      .map((itemId) => discoveryPlaceLookup.get(itemId) ?? null)
      .filter((place): place is DiscoveryPlace => place !== null);
  }, [activeNearbyTheme, discoveryPlaceLookup, discoveryPlaces]);
  const visiblePlaces =
    scope === "guide"
      ? guidePlaces
      : scope === "theme"
        ? themePlaces
        : searchResults;
  const resultPlaces =
    scope === "guide"
      ? guidePlaces
      : scope === "theme"
        ? themePlaces
        : searchResults;
  const selectedPlace =
    visiblePlaces.find((place) => place.id === selectedPlaceId) ??
    visiblePlaces[0] ??
    null;
  const selectedGuidePoi = selectedPlace?.guidePoiId
    ? (guideLookup.get(selectedPlace.guidePoiId) ?? null)
    : null;
  const selectedMedia = selectedGuidePoi
    ? getPoiMedia(selectedGuidePoi.id)
    : selectedPlace?.imageSrc
      ? {
          alt: `${selectedPlace.name}实景`,
          src: selectedPlace.imageSrc,
        }
      : heroMedia;
  const selectedDescription =
    selectedGuidePoi?.description ?? selectedPlace?.description ?? "";
  const resolvedSelectedMedia =
    selectedPlace?.imageSrc && selectedPlace.imageSrc.length > 0
      ? {
          alt: `${selectedPlace.name} 实景`,
          src: selectedPlace.imageSrc,
        }
      : selectedMedia;
  const selectedHighlight =
    selectedGuidePoi?.highlight ?? selectedPlace?.highlight ?? "";
  const selectedTags = selectedGuidePoi?.tags ?? selectedPlace?.tags ?? [];
  const selectedRatingLabel = selectedPlace?.rating
    ? `${selectedPlace.rating.toFixed(1)}分`
    : selectedPlace?.source === "guide"
      ? "精选"
      : selectedPlace?.source === "mcp-discovery"
        ? "推荐"
        : "实时";
  const selectedLocationTitle =
    resolvedSelectedPlace?.district ||
    resolvedSelectedPlace?.businessArea ||
    city;
  const selectedLocationDescription = resolvedSelectedPlace
    ? resolvedSelectedPlace.businessArea
      ? `${resolvedSelectedPlace.address} · ${resolvedSelectedPlace.businessArea}`
      : resolvedSelectedPlace.address
    : "正在通过高德逆地理编码补全详细地址";
  const weatherLine = cityWeather
    ? [
        cityWeather.city || city,
        cityWeather.weather || "天气",
        cityWeather.temperature ? `${cityWeather.temperature}°C` : "",
        cityWeather.windDirection
          ? `${cityWeather.windDirection}风${cityWeather.windPower || ""}级`
          : "",
        cityWeather.humidity ? `湿度${cityWeather.humidity}%` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : `${city}天气加载中`;
  useEffect(() => {
    onWeatherLineChange?.(weatherLine);
  }, [onWeatherLineChange, weatherLine]);

  useEffect(() => {
    if (!nearbyThemes.some((theme) => theme.id === activeNearbyThemeId)) {
      setActiveNearbyThemeId(nearbyThemes[0]?.id ?? "museum");
    }
  }, [activeNearbyThemeId, nearbyThemes]);

  useEffect(() => {
    if (!initialPoiId) {
      return;
    }

    const target =
      visiblePlaces.find((place) => place.id === initialPoiId) ??
      visiblePlaces.find((place) => place.guidePoiId === initialPoiId);

    if (target) {
      setSelectedPlaceId(target.id);
      setIsInspectorVisible(true);
    }
  }, [initialPoiId, visiblePlaces]);

  useEffect(() => {
    let cancelled = false;
    setDiscoveryError("");

    void travelApi
      .getMapDiscovery(city)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setDiscovery(response.discovery);
        const preferredTheme = response.discovery.themes.find((theme) =>
          preferredThemeIds.has(theme.id),
        );
        setActiveNearbyThemeId(
          preferredTheme?.id ?? defaultDiscoveryThemes[0].id,
        );
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setDiscovery(null);
        setDiscoveryError(
          error instanceof Error ? error.message : "主题点位加载失败",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    if (visiblePlaces.length === 0) {
      setSelectedPlaceId(null);
      return;
    }

    if (
      !selectedPlaceId ||
      !visiblePlaces.some((place) => place.id === selectedPlaceId)
    ) {
      setSelectedPlaceId(visiblePlaces[0].id);
    }
  }, [selectedPlaceId, visiblePlaces]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedPlace) {
      setResolvedSelectedPlace(null);
      return () => {
        cancelled = true;
      };
    }

    setResolvedSelectedPlace(null);

    void resolveLocationDetails(selectedPlace.location).then((details) => {
      if (!cancelled) {
        setResolvedSelectedPlace(details);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [city, selectedPlace?.id]);

  useEffect(() => {
    let cancelled = false;

    setCityWeather(null);
    setCityForecast([]);

    void Promise.all([loadCityWeather(city), loadCityForecast(city)]).then(
      ([snapshot, forecast]) => {
        if (!cancelled) {
          setCityWeather(snapshot);
          setCityForecast(forecast);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [city]);

  function clearLiveRoute() {
    mapStateRef.current.driving?.clear();
    mapStateRef.current.walking?.clear();
    if (routePanelRef.current) {
      routePanelRef.current.innerHTML = "";
    }
    setLiveRouteSummary(null);
  }

  function resetToGuide() {
    setQuery("");
    setScope("guide");
    setSearchResults([]);
    setSearchSuggestions([]);
    setSearchMessage("已切回城市导览主线");
    setNearbyOriginLabel("城市中心");
    clearLiveRoute();
  }

  function handleSelectPlace(placeId: string) {
    if (selectedPlaceId && selectedPlaceId !== placeId) {
      clearLiveRoute();
    }

    setSelectedPlaceId(placeId);
    setIsInspectorVisible(true);
  }

  function handleWorkspacePointerMove(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    const target = event.target as HTMLElement | null;
    const isInsideInspector = Boolean(
      target?.closest(".map-shell__inspector"),
    );

    if (isInsideInspector) {
      setIsInspectorVisible(true);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const revealZone = Math.max(72, Math.min(120, rect.width * 0.1));
    const nextVisible = event.clientX >= rect.right - revealZone;
    setIsInspectorVisible((current) =>
      current === nextVisible ? current : nextVisible,
    );
  }

  async function ensureMapReady() {
    const container = mapContainerRef.current;
    if (!container || !amapKey) {
      return null;
    }

    const AMap = await loadAMap(amapKey);
    const containerReady = await waitForElementToHaveSize(container);
    if (!containerReady || mapContainerRef.current !== container) {
      return null;
    }

    const state = mapStateRef.current;

    if (!state.map) {
      setMapReady(false);
      const standardLayer = new AMap.TileLayer();
      const satelliteLayer = new AMap.TileLayer.Satellite();
      const roadNetLayer = new AMap.TileLayer.RoadNet();
      const map = new AMap.Map(container, {
        layers: immersive3D ? [satelliteLayer, roadNetLayer] : [standardLayer],
        center,
        animateEnable: true,
        doubleClickZoom: true,
        dragEnable: true,
        jogEnable: true,
        lang: mapLanguage === "en" ? "en" : "zh_cn",
        mapStyle: "amap://styles/normal",
        pitch: immersive3D ? 62 : 0,
        pitchEnable: true,
        resizeEnable: true,
        rotateEnable: true,
        rotation: immersive3D ? -28 : 0,
        scrollWheel: true,
        showBuildingBlock: immersive3D,
        viewMode: "3D",
        zoom: immersive3D ? 14 : 12.8,
        zoomEnable: true,
      });

      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        position: "RT",
        showButton: false,
        timeout: 8000,
        zoomToAccuracy: true,
      });
      const geocoder = new AMap.Geocoder({
        extensions: "all",
        radius: 1000,
      });
      const weather = new AMap.Weather();

      geolocation.on("complete", (result) => {
        const coordinates =
          typeof result === "object" && result !== null && "position" in result
            ? normalizeCoordinates(result.position)
            : normalizeCoordinates(result);

        if (!coordinates) {
          setSearchMessage("定位失败，已保留当前城市视角");
          geolocationRejectRef.current?.(new Error("定位失败"));
          geolocationResolverRef.current = null;
          geolocationRejectRef.current = null;
          return;
        }

        setUserLocation(coordinates);
        setSearchMessage("定位成功，可检索周边");
        map.setCenter(coordinates);
        void resolveLocationDetails(coordinates).then((details) => {
          if (details) {
            setNearbyOriginLabel(
              details.businessArea
                ? `${details.businessArea}附近`
                : `${details.district}附近`,
            );
          }
        });
        geolocationResolverRef.current?.(coordinates);
        geolocationResolverRef.current = null;
        geolocationRejectRef.current = null;
      });

      geolocation.on("error", () => {
        setSearchMessage("定位失败，已切回城市导览视角");
        geolocationRejectRef.current?.(new Error("定位失败"));
        geolocationResolverRef.current = null;
        geolocationRejectRef.current = null;
      });

      map.addControl(
        new AMap.Scale({
          languageCode: mapLanguage === "en" ? "en" : "zh",
        }),
      );
      map.addControl(new AMap.ToolBar({ position: "RB" }));
      map.addControl(
        new AMap.MapType({
          position: "RT",
          showRoad: true,
          showTraffic: true,
        }),
      );
      map.addControl(new AMap.ControlBar({ position: "RB" }));
      map.addControl(geolocation);

      state.AMap = AMap;
      state.driving = new AMap.Driving({
        autoFitView: true,
        map,
        panel: routePanelRef.current,
        showTraffic: true,
      });
      state.geocoder = geocoder;
      state.geolocation = geolocation;
      state.infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -18),
      });
      state.map = map;
      state.roadNetLayer = roadNetLayer;
      state.satelliteLayer = satelliteLayer;
      state.standardLayer = standardLayer;
      state.weather = weather;
      state.walking = new AMap.Walking({
        autoFitView: true,
        map,
        panel: routePanelRef.current,
      });

      const activeMap = map;
      scheduleStabilizedResize(() => {
        if (
          mapStateRef.current.map === activeMap &&
          mapContainerRef.current === container
        ) {
          runMapCommand(() => activeMap.resize());
        }
      });

      await waitForMapComplete(map);
      if (mapStateRef.current.map !== activeMap) {
        return null;
      }
      setMapReady(true);
    } else {
      setMapReady(true);
    }

    return state;
  }

  const resolveLocationDetails = useEffectEvent(
    async (coordinates: [number, number]) => {
      const state = await ensureMapReady();
      if (!state?.geocoder) {
        return null;
      }

      return new Promise<ResolvedLocationDetails | null>((resolve) => {
        state.geocoder?.getAddress(coordinates, (status, result) => {
          resolve(
            status === "complete"
              ? extractResolvedLocationDetails(result, city)
              : null,
          );
        });
      });
    },
  );

  const loadCityWeather = useEffectEvent(async (cityName: string) => {
    const state = await ensureMapReady();
    if (!state?.weather) {
      return null;
    }

    return new Promise<LiveWeatherSnapshot | null>((resolve) => {
      state.weather?.getLive(cityName, (_error, result) => {
        resolve(extractLiveWeatherSnapshot(result));
      });
    });
  });

  const loadCityForecast = useEffectEvent(async (cityName: string) => {
    const state = await ensureMapReady();
    if (!state?.weather) {
      return [];
    }

    return new Promise<WeatherForecastCast[]>((resolve) => {
      state.weather?.getForecast(cityName, (_error, result) => {
        resolve(extractForecastCasts(result));
      });
    });
  });

  async function requestCurrentLocation() {
    if (userLocation) {
      return userLocation;
    }

    const state = await ensureMapReady();
    if (!state?.geolocation) {
      throw new Error("定位服务暂不可用");
    }

    return new Promise<[number, number]>((resolve, reject) => {
      geolocationResolverRef.current = resolve;
      geolocationRejectRef.current = reject;
      state.geolocation?.getCurrentPosition();
    });
  }

  const syncMap = useEffectEvent(async () => {
    const runId = mapRunIdRef.current;
    const state = await ensureMapReady();
    if (!state?.AMap || !isActiveMapRun(runId, state)) {
      return;
    }

    const map = state.map!;
    const AMap = state.AMap!;

    if (state.markers.length > 0) {
      runMapCommand(() => map.remove(state.markers));
      state.markers = [];
    }

    if (state.userMarker) {
      runMapCommand(() => map.remove(state.userMarker));
      state.userMarker = null;
    }

    if (state.routeLine) {
      runMapCommand(() => map.remove(state.routeLine));
      state.routeLine = null;
    }

    const markers = visiblePlaces.map((place, index) => {
      const marker = new AMap.Marker({
        position: place.location,
        title: place.name,
        label: {
          content: `<div class="map-pin ${place.source === "guide" ? "" : "map-pin--search"} ${place.id === selectedPlace?.id ? "map-pin--active" : ""}">${getMarkerLabel(place, index)}</div>`,
          direction: "top",
        },
      });

      marker.on("click", () => handleSelectPlace(place.id));
      return marker;
    });

    runMapCommand(() => map.add(markers));
    state.markers = markers;

    if (userLocation) {
      state.userMarker = new AMap.Marker({
        position: userLocation,
        title: "我的位置",
        label: {
          content: '<div class="map-pin map-pin--me">我</div>',
          direction: "top",
        },
      });

      runMapCommand(() => map.add(state.userMarker));
    }

    if (
      scope === "guide" &&
      !liveRouteSummary &&
      routePlan &&
      routePlan.polyline.length > 1
    ) {
      state.routeLine = new AMap.Polyline({
        path: routePlan.polyline,
        showDir: true,
        strokeColor: routeMode === "driving" ? "#0f766e" : "#b91c1c",
        strokeOpacity: 0.85,
        strokeWeight: 5,
      });
      runMapCommand(() => map.add(state.routeLine));
    }

    const fitTargets: AMapOverlay[] = [...markers];
    if (state.userMarker) {
      fitTargets.push(state.userMarker);
    }
    if (state.routeLine) {
      fitTargets.push(state.routeLine);
    }

    if (
      fitTargets.length > 0 &&
      (scope !== "guide" || Boolean(state.routeLine))
    ) {
      runMapCommand(() => map.setFitView(fitTargets, true, [120, 320, 120, 320]));
    } else if (selectedPlace) {
      runMapCommand(() =>
        map.setZoomAndCenter(
          scope === "guide" ? (immersive3D ? 15.2 : 14.3) : 13.8,
          selectedPlace.location,
        ),
      );
    }

    if (selectedPlace && state.infoWindow) {
      runMapCommand(() => state.infoWindow?.setContent(
        `<div class="amap-bubble"><strong>${selectedPlace.name}</strong></div>`,
      ));
      runMapCommand(() => state.infoWindow?.open(map, selectedPlace.location));
    }

    scheduleStabilizedResize(() => {
      if (isActiveMapRun(runId, state)) {
        runMapCommand(() => map.resize());
      }
    });
  });

  const runKeywordSearch = useEffectEvent(async (keyword: string) => {
    const state = await ensureMapReady();
    if (!state?.AMap) {
      return;
    }
    const { AMap } = state;

    if (keyword.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchSuggestions([]);
      setSearchMessage("继续输入关键词以搜索高德地点");
      setScope("guide");
      return;
    }

    setSearchLoading(true);
    setSearchMessage(`正在检索“${keyword}”`);

    const placeSearch = new AMap.PlaceSearch({
      autoFitView: false,
      city,
      citylimit: true,
      extensions: "all",
      pageIndex: 1,
      pageSize: 8,
    });

    placeSearch.search(keyword, (status, result) => {
      const results =
        status === "complete"
          ? extractPlaceSearchResults(result, "amap-search", city)
          : [];
      setSearchResults(results);
      setSearchSuggestions([]);
      setSearchLoading(false);
      setSearchMessage(
        results.length > 0
          ? `已找到 ${results.length} 个高德地点`
          : "未找到匹配地点",
      );
      if (results.length > 0) {
        setSelectedPlaceId(results[0].id);
      }
    });
  });

  const runAutoCompleteSearch = useEffectEvent(async (keyword: string) => {
    const state = await ensureMapReady();
    if (!state?.AMap) {
      return;
    }

    if (keyword.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const autoComplete = new state.AMap.AutoComplete({
      city,
      citylimit: true,
    });

    autoComplete.search(keyword, (status, result) => {
      const suggestions =
        status === "complete" ? extractAutoCompleteTips(result, city) : [];
      setSearchSuggestions(suggestions);
    });
  });

  async function runNearbySearch(
    theme = activeNearbyTheme,
    keywordOverride?: string,
  ) {
    const state = await ensureMapReady();
    if (!state?.AMap) {
      return;
    }
    const { AMap } = state;

    const keyword =
      keywordOverride?.trim() ||
      query.trim() ||
      theme?.keyword ||
      nearbyKeyword;
    const searchLabel =
      keywordOverride?.trim() || query.trim() || theme?.label || "文化点位";
    const origin = userLocation ?? selectedPlace?.location ?? center;
    const originLabel = userLocation
      ? nearbyOriginLabel
      : selectedPlace
        ? `${selectedPlace.name}周边`
        : `${city}中心`;

    setActiveNearbyThemeId(theme.id);
    setNearbyOriginLabel(originLabel);
    setScope("nearby");
    setSearchLoading(true);
    setSearchSuggestions([]);
    setSearchMessage(`正在搜索${originLabel}的${searchLabel}`);

    const placeSearch = new AMap.PlaceSearch({
      autoFitView: false,
      city,
      citylimit: false,
      extensions: "all",
      pageIndex: 1,
      pageSize: 8,
    });

    placeSearch.searchNearBy(keyword, origin, 5000, (status, result) => {
      const results =
        status === "complete"
          ? extractPlaceSearchResults(result, "amap-nearby", city)
          : [];
      setSearchResults(results);
      setSearchLoading(false);
      setSearchMessage(
        results.length > 0
          ? `${originLabel}附近找到 ${results.length} 个${searchLabel}`
          : `${originLabel}附近暂无${searchLabel}`,
      );
      if (results.length > 0) {
        setSelectedPlaceId(results[0].id);
      }
    });
  }

  async function planLiveRoute(place: DiscoveryPlace, mode: RouteMode) {
    const state = await ensureMapReady();
    if (!state?.driving || !state.walking) {
      return;
    }

    onRouteModeChange(mode);
    clearLiveRoute();

    const origin =
      (await requestCurrentLocation().catch(() => center)) ?? center;
    const service = mode === "driving" ? state.driving : state.walking;

    setSearchMessage(
      mode === "driving" ? "正在生成驾车路线" : "正在生成步行路线",
    );

    service.search(origin, place.location, (status, result) => {
      if (status !== "complete") {
        setSearchMessage("路线生成失败，请稍后重试");
        return;
      }

      setLiveRouteSummary(extractRouteSummary(result, mode));
      setSearchMessage(
        mode === "driving" ? "驾车路线已生成" : "步行路线已生成",
      );
    });
  }

  useEffect(() => {
    if (scope === "keyword") {
      void runAutoCompleteSearch(deferredQuery);
      void runKeywordSearch(deferredQuery);
      return;
    }

    setSearchSuggestions([]);
  }, [deferredQuery, scope]);

  useEffect(() => {
    void syncMap();
  }, [
    center,
    liveRouteSummary,
    routeMode,
    routePlan,
    scope,
    selectedPlace?.id,
    userLocation,
    visiblePlaces,
  ]);

  const syncPerspective = useEffectEvent(async () => {
    const runId = mapRunIdRef.current;
    const state = await ensureMapReady();
    if (!isActiveMapRun(runId, state)) {
      return;
    }

    const map = state!.map!;
    if (immersive3D && state?.satelliteLayer && state.roadNetLayer) {
      const immersiveLayers: AMapLayer[] = [
        state.satelliteLayer,
        state.roadNetLayer,
      ];
      runMapCommand(() =>
        map.setLayers(immersiveLayers),
      );
    } else if (state?.standardLayer) {
      const standardLayers: AMapLayer[] = [state.standardLayer];
      runMapCommand(() => map.setLayers(standardLayers));
    }

    runMapCommand(() => map.setPitch(immersive3D ? 62 : 0));
    runMapCommand(() => map.setRotation(immersive3D ? -28 : 0));
  });

  useEffect(() => {
    void syncPerspective();
  }, [immersive3D]);

  useEffect(() => {
    return () => {
      mapRunIdRef.current += 1;
      const currentMap = mapStateRef.current.map;
      if (currentMap) {
        runMapCommand(() => currentMap.clearInfoWindow());
        if (mapStateRef.current.markers.length > 0) {
          runMapCommand(() => currentMap.remove(mapStateRef.current.markers));
        }
        if (mapStateRef.current.userMarker) {
          runMapCommand(() => currentMap.remove(mapStateRef.current.userMarker));
        }
        if (mapStateRef.current.routeLine) {
          runMapCommand(() => currentMap.remove(mapStateRef.current.routeLine));
        }
        runMapCommand(() => currentMap.destroy());
      }
      mapStateRef.current = createInitialMapState();
    };
  }, []);

  return (
    <div className="map-shell map-shell--immersive map-shell--workspace-layout">
      <div
        className="map-shell__stage"
        onMouseLeave={() => setIsInspectorVisible(false)}
        onMouseMove={handleWorkspacePointerMove}
      >
        <div ref={mapContainerRef} className="map-shell__canvas" />
        {!amapKey ? (
        <div className="map-shell__empty">
          <strong>缺少高德地图 Key</strong>
          <span>请配置 `VITE_AMAP_KEY` 后再启用实时地图、检索与路线规划。</span>
        </div>
      ) : (
        <>
          {!mapReady ? (
            <div className="map-shell__loading">
              <strong>正在加载 {city} 地图</strong>
              <span>先把高德默认底图和文字标注稳定铺开，再接入景点、路线与天气。</span>
            </div>
          ) : null}
          {resultPlaces.length > 1 ? (
            <div className="map-place-switcher">
              <div className="map-place-switcher__head">
                <strong>景点切换</strong>
                <span>点名字直接移动到对应点位</span>
              </div>
              <div className="map-place-switcher__list">
                {resultPlaces.map((place, index) => (
                  <button
                    key={place.id}
                    className={
                      place.id === selectedPlace?.id
                        ? "map-place-switcher__item active"
                        : "map-place-switcher__item"
                    }
                    onClick={() => handleSelectPlace(place.id)}
                    type="button"
                  >
                    <span className="map-place-switcher__index">
                      {getMarkerLabel(place, index)}
                    </span>
                    <span className="map-place-switcher__name">{place.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <aside className="map-shell__dock">
            <section className="map-glass-card map-toolbar-card">
              <div className="map-toolbar-card__header">
                <div>
                  <span className="map-kicker">城市导览工作台</span>
                  <h3>{city}文化地图</h3>
                </div>
              </div>
              <label className="map-toolbar-card__search">
                <Search className="icon-5 search-icon" />
                <input
                  placeholder="搜索景点、博物馆、老街或文化地标"
                  type="text"
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setQuery(nextValue);
                    setScope(nextValue.trim() ? "keyword" : "guide");
                    if (!nextValue.trim()) {
                      setSearchSuggestions([]);
                    }
                  }}
                />
              </label>
              {searchSuggestions.length > 0 ? (
                <div className="map-suggestion-list">
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="map-suggestion-item"
                      onClick={() => {
                        setQuery(suggestion.name);
                        setScope("keyword");
                        setSearchSuggestions([]);
                        setSearchMessage(`正在检索“${suggestion.name}”`);
                      }}
                      type="button"
                    >
                      <strong>{suggestion.name}</strong>
                      <span>
                        {suggestion.district} · {suggestion.address}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="map-toolbar-card__actions">
                <button
                  className="button-secondary"
                  onClick={() => void requestCurrentLocation()}
                  type="button"
                >
                  <LocateFixed className="icon-5" />
                  定位
                </button>
                <button
                  className="button-secondary"
                  onClick={() => void runNearbySearch(activeNearbyTheme)}
                  type="button"
                >
                  <MapPinned className="icon-5" />
                  附近
                </button>
                <button
                  className="button-secondary"
                  onClick={resetToGuide}
                  type="button"
                >
                  <Sparkles className="icon-5" />
                  主线
                </button>
              </div>
              <div className="map-discovery-strip">
                <span className="map-discovery-strip__label">文化线索</span>
                {nearbyThemes.map((theme) => (
                  <button
                    key={theme.id}
                    className={
                      theme.id === activeNearbyTheme?.id
                        ? "map-theme-chip active"
                        : "map-theme-chip"
                    }
                    onClick={() => {
                      setQuery(theme.keyword);
                      setActiveNearbyThemeId(theme.id);
                      setScope("theme");
                      setSearchResults([]);
                      setSearchSuggestions([]);
                      clearLiveRoute();
                      setSearchMessage(`已切换到${theme.label}精选`);
                    }}
                    title={theme.hint}
                    type="button"
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </section>
            <section className="map-glass-card map-results-card">
              {resultPlaces.length > 0 ? (
                <div className="map-results-list">
                  {resultPlaces.map((place) => (
                    <button
                      key={place.id}
                      className={
                        place.id === selectedPlace?.id
                          ? "map-result-item active"
                          : "map-result-item"
                      }
                      onClick={() => handleSelectPlace(place.id)}
                      type="button"
                    >
                      <div className="map-result-item__title">
                        <strong>{place.name}</strong>
                        <span className="map-result-badge">
                          {getPlaceSourceLabel(place.source)}
                        </span>
                      </div>
                      <p className="map-result-item__desc">
                        {place.description}
                      </p>
                      <div className="map-result-item__meta">
                        <small>{getPlaceSecondaryLabel(place)}</small>
                        <small>{place.type}</small>
                        {place.distanceMeters ? (
                          <small>{formatDistance(place.distanceMeters)}</small>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="map-empty-state">
                  <strong>暂时没有匹配结果</strong>
                  <span>
                    可以换个更短的关键词，或直接点上方文化线索发起周边检索。
                  </span>
                </div>
              )}
            </section>
          </aside>
          <aside
            className={
              isInspectorVisible
                ? "map-shell__inspector is-visible"
                : "map-shell__inspector"
            }
          >
            {selectedPlace ? (
              <section className="map-glass-card map-place-card">
                <div className="map-place-card__media">
                  <img
                    alt={resolvedSelectedMedia.alt}
                    src={resolvedSelectedMedia.src}
                  />
                </div>
                <div className="map-place-card__body">
                  <div className="map-place-card__head">
                    <div>
                      <span className="map-kicker">
                        {getPlaceSourceLabel(selectedPlace.source)}
                      </span>
                      <h3>{selectedPlace.name}</h3>
                    </div>
                    <div className="rating-pill">
                      <Star className="icon-4 rating-pill__icon" />
                      <span>{selectedRatingLabel}</span>
                    </div>
                  </div>
                  <div className="map-place-card__meta">
                    <span>{selectedPlace.type}</span>
                    <span>{selectedLocationTitle}</span>
                    <span>{getPlaceSecondaryLabel(selectedPlace)}</span>
                    {selectedPlace.openTime ? (
                      <span>{selectedPlace.openTime}</span>
                    ) : null}
                  </div>
                  <p className="map-place-card__address">{selectedLocationDescription}</p>
                  <p>{selectedDescription}</p>
                  {selectedHighlight ? (
                    <div className="map-storyline">
                      <strong>导览亮点</strong>
                      <p>{selectedHighlight}</p>
                    </div>
                  ) : null}
                  {selectedTags.length ? (
                    <div className="map-tag-list">
                      {selectedTags.map((tag) => (
                        <span key={tag} className="map-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="map-toggle-group">
                    <button
                      className={
                        routeMode === "walking"
                          ? "chip-button active"
                          : "chip-button"
                      }
                      onClick={() =>
                        void planLiveRoute(selectedPlace, "walking")
                      }
                      type="button"
                    >
                      <Footprints className="icon-4" />
                      步行
                    </button>
                    <button
                      className={
                        routeMode === "driving"
                          ? "chip-button active"
                          : "chip-button"
                      }
                      onClick={() =>
                        void planLiveRoute(selectedPlace, "driving")
                      }
                      type="button"
                    >
                      <CarFront className="icon-4" />
                      驾车
                    </button>
                    <button
                      className="chip-button"
                      onClick={() =>
                        window.open(
                          buildNavigationUrl(
                            selectedPlace,
                            routeMode,
                            userLocation,
                          ),
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      type="button"
                    >
                      <ExternalLink className="icon-4" />
                      打开高德
                    </button>
                  </div>
                  <div className="map-route-card__actions">
                    {selectedGuidePoi ? (
                      <Link
                        className="button-primary"
                        to={`/map?city=${encodeURIComponent(city)}&poi=${encodeURIComponent(selectedGuidePoi.id)}&view=immersive`}
                      >
                        沉浸导览
                      </Link>
                    ) : null}
                    {selectedGuidePoi ? (
                      <button
                        className={
                          favoritePoiIds.has(selectedGuidePoi.id)
                            ? "button-secondary active"
                            : "button-secondary"
                        }
                        disabled={favoriteBusyPoiId === selectedGuidePoi.id}
                        onClick={() =>
                          void onToggleFavorite(selectedGuidePoi.id)
                        }
                        type="button"
                      >
                        {favoriteBusyPoiId === selectedGuidePoi.id
                          ? "收藏中..."
                          : favoritePoiIds.has(selectedGuidePoi.id)
                            ? "已收藏"
                            : "收藏点位"}
                      </button>
                    ) : null}
                  </div>
                  {liveRouteSummary ? (
                    <>
                      <div className="map-quick-stats">
                        <div className="summary-tile">
                          <span>路线方式</span>
                          <strong>
                            {liveRouteSummary.mode === "driving"
                              ? "驾车"
                              : "步行"}
                          </strong>
                        </div>
                        <div className="summary-tile">
                          <span>距离</span>
                          <strong>
                            {formatDistance(liveRouteSummary.distanceMeters)}
                          </strong>
                        </div>
                        <div className="summary-tile">
                          <span>预计时长</span>
                          <strong>
                            {formatDuration(liveRouteSummary.durationSeconds)}
                          </strong>
                        </div>
                      </div>
                      {liveRouteSummary.steps.length > 0 ? (
                        <div className="map-route-steps">
                          {liveRouteSummary.steps.map((step, index) => (
                            <div
                              key={`${step}-${index}`}
                              className="map-route-step"
                            >
                              <span>{index + 1}</span>
                              <p>{step}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="map-route-placeholder">
                      从当前位置发起步行或驾车后，这里会显示距离、时长和关键路段提示。
                    </div>
                  )}
                </div>
              </section>
            ) : null}
            <section className="map-glass-card map-route-card">
              <div className="map-results-card__head">
                <h4>高德路线详情</h4>
                <button
                  className="section-action"
                  onClick={() => clearLiveRoute()}
                  type="button"
                >
                  清空
                </button>
              </div>
              <p className="map-route-card__hint">
                右上会同步展示高德原生路线面板，可直接查看分段说明与转向信息。
              </p>
              <div ref={routePanelRef} className="map-route-panel" />
            </section>
          </aside>
          </>
        )}
      </div>
    </div>
  );
}
