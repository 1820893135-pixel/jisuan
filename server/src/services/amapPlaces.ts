import { config } from "../config.js";
import { resolveProvinceMeta } from "../data/provinces.js";
import type {
  CityGuide,
  CityMapDiscovery,
  Coordinates,
  DiscoveryThemeId,
  MapDiscoveryItem,
  MapDiscoveryTheme,
  Poi,
} from "../types.js";

interface AmapBizExt {
  opentime?: string;
  opentime_today?: string;
  rating?: string;
}

interface AmapPhoto {
  url?: string;
}

interface AmapPlaceRecord {
  address?: string;
  adname?: string;
  biz_ext?: AmapBizExt;
  business_area?: string | { location?: string; name?: string }[];
  cityname?: string;
  id?: string;
  location?: string;
  name?: string;
  photos?: AmapPhoto[];
  pname?: string;
  tel?: string;
  type?: string;
}

interface AmapPlaceTextPayload {
  info?: string;
  pois?: AmapPlaceRecord[];
  status?: string;
}

interface AmapWeatherLive {
  city?: string;
  humidity?: string;
  province?: string;
  reporttime?: string;
  temperature?: string;
  weather?: string;
  winddirection?: string;
  windpower?: string;
}

interface AmapWeatherPayload {
  info?: string;
  lives?: AmapWeatherLive[];
  status?: string;
}

interface AmapResponseEnvelope {
  info?: string;
  infocode?: string;
  status?: string;
}

interface ProvinceQueryDefinition {
  keyword: string;
  theme: DiscoveryThemeId;
  weight: number;
}

interface ScoredProvincePlace {
  raw: AmapPlaceRecord;
  score: number;
  tags: Set<string>;
  themes: Set<DiscoveryThemeId>;
}

interface ProvinceWeatherSnapshot {
  humidity: string;
  reportTime: string;
  temperature: string;
  weather: string;
  windDirection: string;
  windPower: string;
}

const provinceGuideCache = new Map<string, Promise<CityGuide>>();
const provinceDiscoveryCache = new Map<string, Promise<CityMapDiscovery>>();
const amapRequestGapMs = 220;
const amapRetryDelayMs = 750;
let amapRequestQueue = Promise.resolve();

const provinceQueryPlan: ProvinceQueryDefinition[] = [
  { keyword: "旅游景点", theme: "heritage", weight: 100 },
  { keyword: "博物馆", theme: "museum", weight: 92 },
  { keyword: "历史古迹", theme: "heritage", weight: 88 },
  { keyword: "老街", theme: "food", weight: 80 },
  { keyword: "非遗", theme: "intangible", weight: 78 },
];

const themePresets: Array<{
  hint: string;
  id: DiscoveryThemeId;
  keyword: string;
  label: string;
}> = [
  {
    hint: "优先看省域里最容易形成主线的遗产与代表性景观。",
    id: "heritage",
    keyword: "旅游景点",
    label: "遗产主线",
  },
  {
    hint: "先进入博物馆或纪念空间，更容易建立地区文化背景。",
    id: "museum",
    keyword: "博物馆",
    label: "博物馆",
  },
  {
    hint: "补足地方工艺、庙宇与生活性文化场景，让路线更有层次。",
    id: "intangible",
    keyword: "非遗",
    label: "非遗体验",
  },
  {
    hint: "适合把节奏放慢，切入更平静的风景或城市日常空间。",
    id: "tea",
    keyword: "公园",
    label: "慢游线索",
  },
  {
    hint: "更适合傍晚到夜间切入，观察街区灯光、夜景与城市活力。",
    id: "night",
    keyword: "夜游",
    label: "夜游线索",
  },
  {
    hint: "把老街、风味空间与生活场景也纳入路线，而不是只看地标。",
    id: "food",
    keyword: "老街",
    label: "街区风味",
  },
];

function requireAmapKey() {
  if (!config.amapWebServiceKey) {
    throw new Error("AMAP_WEB_SERVICE_KEY 未配置，无法调用高德 Web 服务。");
  }
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function queueAmapRequest<T>(task: () => Promise<T>) {
  const run = amapRequestQueue.then(task, task);
  amapRequestQueue = run.then(
    () => delay(amapRequestGapMs),
    () => delay(amapRequestGapMs),
  ) as Promise<void>;
  return run;
}

function isQpsLimited(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const info = "info" in payload ? String(payload.info ?? "") : "";
  return info.includes("CUQPS_HAS_EXCEEDED_THE_LIMIT");
}

function toError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(`${fallback}: ${String(error)}`);
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function parseCoordinates(location?: string): Coordinates | null {
  if (!location) {
    return null;
  }

  const [lngText, latText] = location.split(",");
  const lng = Number(lngText);
  const lat = Number(latText);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return [lng, lat];
}

function getPrimaryType(type?: string) {
  if (!type) {
    return "文化景点";
  }

  return (
    type
      .split(/[;|]/)
      .map((part) => part.trim())
      .find(Boolean) ?? "文化景点"
  );
}

function getBusinessArea(
  businessArea?: string | { location?: string; name?: string }[],
) {
  if (typeof businessArea === "string") {
    return businessArea.trim();
  }

  if (Array.isArray(businessArea)) {
    return businessArea
      .map((item) => item?.name?.trim())
      .find(Boolean);
  }

  return "";
}

function inferDuration(type: string) {
  if (/(博物馆|纪念馆|展览馆)/.test(type)) {
    return "1.5-2.5小时";
  }

  if (/(古镇|老街|步行街)/.test(type)) {
    return "1-2小时";
  }

  if (/(寺|宫|祠|庙|石窟)/.test(type)) {
    return "1.5-2小时";
  }

  if (/(公园|湖|山|景区|风景)/.test(type)) {
    return "2-4小时";
  }

  return "2-3小时";
}

function inferThemeFromPlace(record: AmapPlaceRecord): DiscoveryThemeId[] {
  const type = getPrimaryType(record.type);
  const name = record.name ?? "";
  const text = `${name}${type}`;
  const themes = new Set<DiscoveryThemeId>();

  if (/(博物馆|纪念馆|展览馆)/.test(text)) {
    themes.add("museum");
  }
  if (/(非遗|民俗|工艺|祠|庙|寺|宫|戏曲|会馆)/.test(text)) {
    themes.add("intangible");
  }
  if (/(老街|夜市|步行街|古镇|小吃|坊)/.test(text)) {
    themes.add("food");
    themes.add("night");
  }
  if (/(公园|湖|山|湿地|园林|古城|风景|景区|遗址|宫|塔|桥)/.test(text)) {
    themes.add("heritage");
  }
  if (/(公园|湖|山|园林|湿地|茶|古镇)/.test(text)) {
    themes.add("tea");
  }

  if (themes.size === 0) {
    themes.add("heritage");
  }

  return [...themes];
}

function buildDescription(
  provinceName: string,
  record: AmapPlaceRecord,
  primaryTheme: DiscoveryThemeId,
) {
  const address = uniqueStrings([
    record.adname,
    getBusinessArea(record.business_area),
    record.address,
  ]).join(" · ");

  const themeDescriptionMap: Record<DiscoveryThemeId, string> = {
    food: "适合放在路线后半程，补足地方街区、风味和生活感。",
    heritage: "适合作为省域导览里最核心的代表性地标。",
    intangible: "更适合放在深度讲解段，补足地方手艺和文化传承。",
    museum: "适合放在路线前半程，先建立地区文化与历史背景。",
    night: "适合作为傍晚到夜间的切换点，让路线更有城市节奏。",
    tea: "更适合作为慢游停留点，让整条路线的节奏舒展开。",
  };

  return address
    ? `${address}，${themeDescriptionMap[primaryTheme]}`
    : `${provinceName}的代表性文化点位，${themeDescriptionMap[primaryTheme]}`;
}

function buildHighlight(primaryTheme: DiscoveryThemeId, name: string) {
  const themeHighlightMap: Record<DiscoveryThemeId, string> = {
    food: `${name}更像一段可以慢慢走的生活场景，适合承接夜游或风味收尾。`,
    heritage: `${name}很适合放在省域主线里当作识别度最高的地标节点。`,
    intangible: `${name}适合补足“看景”之外的体验感，让导览内容更像真实旅行。`,
    museum: `${name}适合先建立认知，再带着背景去看街区和景观。`,
    night: `${name}在傍晚到夜间更容易进入状态，适合做路线氛围的转场点。`,
    tea: `${name}更适合放慢节奏停留，给整条主线留出呼吸感。`,
  };

  return themeHighlightMap[primaryTheme];
}

async function requestAmapJson<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  requireAmapKey();

  const search = new URLSearchParams({
    ...params,
    key: config.amapWebServiceKey,
  });
  const response = await fetch(`https://restapi.amap.com${path}?${search.toString()}`);

  if (!response.ok) {
    throw new Error(`高德请求失败，状态码 ${response.status}`);
  }

  return (await response.json()) as T;
}

async function requestAmapJsonQueued<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  return queueAmapRequest(async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const payload = await requestAmapJson<T & AmapResponseEnvelope>(path, params);

      if (!isQpsLimited(payload) || attempt === 2) {
        return payload as T;
      }

      await delay(amapRetryDelayMs * (attempt + 1));
    }

    throw new Error("高德请求失败，未拿到有效响应");
  });
}

async function searchProvinceKeyword(
  provinceName: string,
  keyword: string,
  offset = 12,
) {
  const payload = await requestAmapJsonQueued<AmapPlaceTextPayload>("/v3/place/text", {
    city: provinceName,
    citylimit: "true",
    extensions: "all",
    keywords: keyword,
    offset: String(offset),
    page: "1",
    output: "JSON",
  });

  if (payload.status !== "1") {
    throw new Error(payload.info || "高德 POI 搜索失败");
  }

  return payload.pois ?? [];
}

async function collectProvincePlaces(provinceName: string) {
  const batches: Array<{
    query: ProvinceQueryDefinition;
    records: AmapPlaceRecord[];
  }> = [];
  let lastError: Error | null = null;

  for (const query of provinceQueryPlan) {
    try {
      const records = await searchProvinceKeyword(provinceName, query.keyword);

      if (records.length > 0) {
        batches.push({
          query,
          records,
        });
      }
    } catch (error) {
      lastError = toError(error, `加载 ${provinceName} 省域点位失败`);
    }
  }

  if (batches.length === 0) {
    throw lastError ?? new Error(`未能加载 ${provinceName} 的省域景点数据`);
  }

  const scored = new Map<string, ScoredProvincePlace>();

  for (const batch of batches) {
    batch.records.forEach((record, index) => {
      const placeId = record.id;
      const location = parseCoordinates(record.location);

      if (!placeId || !record.name || !location) {
        return;
      }

      const current =
        scored.get(placeId) ??
        {
          raw: record,
          score: 0,
          tags: new Set<string>(),
          themes: new Set<DiscoveryThemeId>(),
        };

      current.score += batch.query.weight - index * 3;
      current.tags.add(batch.query.keyword);
      current.themes.add(batch.query.theme);

      for (const theme of inferThemeFromPlace(record)) {
        current.themes.add(theme);
      }

      scored.set(placeId, current);
    });
  }

  return [...scored.values()].sort((left, right) => right.score - left.score);
}

function toProvincePoi(provinceName: string, place: ScoredProvincePlace): Poi {
  const location = parseCoordinates(place.raw.location) ?? resolveProvinceMeta(provinceName).center;
  const type = getPrimaryType(place.raw.type);
  const primaryTheme = [...place.themes][0] ?? "heritage";
  const businessArea = getBusinessArea(place.raw.business_area);
  const subtitle = uniqueStrings([place.raw.adname, businessArea]).join(" · ");

  return {
    amapPoiId: place.raw.id,
    description: buildDescription(provinceName, place.raw, primaryTheme),
    duration: inferDuration(type),
    highlight: buildHighlight(primaryTheme, place.raw.name ?? "该点位"),
    id: `poi-${place.raw.id}`,
    imageSrc: place.raw.photos?.[0]?.url,
    location,
    name: place.raw.name ?? "文化点位",
    openTime:
      place.raw.biz_ext?.opentime_today ||
      place.raw.biz_ext?.opentime ||
      undefined,
    rating: place.raw.biz_ext?.rating
      ? Number(place.raw.biz_ext.rating)
      : undefined,
    subtitle: subtitle || place.raw.cityname || provinceName,
    tags: uniqueStrings([
      type,
      place.raw.adname,
      businessArea,
      ...[...place.tags],
    ]),
    type,
  };
}

function pickThemeItems(
  items: MapDiscoveryItem[],
  themeId: DiscoveryThemeId,
  fallbackIds: string[],
) {
  const matched = items
    .filter((item) => {
      const text = `${item.name}${item.type}${item.tags.join("")}`;

      if (themeId === "museum") {
        return /(博物馆|纪念馆|展览馆)/.test(text);
      }
      if (themeId === "intangible") {
        return /(非遗|民俗|会馆|祠|寺|庙|宫|戏曲|工艺)/.test(text);
      }
      if (themeId === "food") {
        return /(老街|步行街|夜市|坊|风味|小吃|古镇)/.test(text);
      }
      if (themeId === "night") {
        return /(夜|灯|老街|步行街|广场|城市景观)/.test(text);
      }
      if (themeId === "tea") {
        return /(公园|湖|山|湿地|园林|茶)/.test(text);
      }

      return /(景区|景点|古城|古镇|遗址|塔|桥|山|湖|宫|寺|公园)/.test(text);
    })
    .slice(0, 3)
    .map((item) => item.id);

  return matched.length > 0 ? matched : fallbackIds.slice(0, 2);
}

export async function getProvinceWeather(cityOrProvince: string) {
  const meta = resolveProvinceMeta(cityOrProvince);
  const payload = await requestAmapJsonQueued<AmapWeatherPayload>(
    "/v3/weather/weatherInfo",
    {
      city: meta.adcode,
      extensions: "base",
      output: "JSON",
    },
  );

  if (payload.status !== "1") {
    throw new Error(payload.info || "高德天气查询失败");
  }

  const live = payload.lives?.[0];
  if (!live) {
    return null;
  }

  return {
    humidity: live.humidity ?? "",
    reportTime: live.reporttime ?? "",
    temperature: live.temperature ?? "",
    weather: live.weather ?? "",
    windDirection: live.winddirection ?? "",
    windPower: live.windpower ?? "",
  } satisfies ProvinceWeatherSnapshot;
}

export async function searchProvinceHighlights(
  provinceName: string,
  keywords?: string,
  limit = 6,
) {
  const meta = resolveProvinceMeta(provinceName);
  const keyword = keywords?.trim();
  const records = keyword
    ? await searchProvinceKeyword(meta.city, keyword, Math.max(limit, 6))
    : (await collectProvincePlaces(meta.city)).map((item) => item.raw);

  return records
    .map((record) => {
      const location = parseCoordinates(record.location);
      if (!record.id || !record.name || !location) {
        return null;
      }

      const type = getPrimaryType(record.type);
      return {
        address: uniqueStrings([record.adname, record.address]).join(" · "),
        amapPoiId: record.id,
        duration: inferDuration(type),
        location,
        name: record.name,
        type,
      };
    })
    .filter(
      (
        item,
      ): item is {
        address: string;
        amapPoiId: string;
        duration: string;
        location: Coordinates;
        name: string;
        type: string;
      } => item !== null,
    )
    .slice(0, limit);
}

export async function getProvinceGuide(cityOrProvince?: string): Promise<CityGuide> {
  const meta = resolveProvinceMeta(cityOrProvince);
  const cacheKey = meta.city;

  if (!provinceGuideCache.has(cacheKey)) {
    const promise = collectProvincePlaces(meta.city)
      .then((places) => {
        const pois = places.slice(0, 6).map((place) => toProvincePoi(meta.city, place));

        return {
          center: meta.center,
          city: meta.city,
          pois,
          slogan: meta.slogan,
          story: meta.narrative,
          tags: meta.tags,
          travelSeasons: meta.travelSeasons,
        } satisfies CityGuide;
      })
      .catch((error) => {
        provinceGuideCache.delete(cacheKey);
        throw error;
      });

    provinceGuideCache.set(cacheKey, promise);
  }

  return provinceGuideCache.get(cacheKey)!;
}

export async function getProvinceMapDiscovery(
  cityOrProvince?: string,
): Promise<CityMapDiscovery> {
  const meta = resolveProvinceMeta(cityOrProvince);
  const cacheKey = meta.city;

  if (!provinceDiscoveryCache.has(cacheKey)) {
    const promise = getProvinceGuide(meta.city)
      .then((guide) => {
        const items = guide.pois.map<MapDiscoveryItem>((poi) => ({
          amapPoiId: poi.amapPoiId ?? poi.id,
          description: poi.description,
          highlight: poi.highlight,
          id: poi.id,
          imageSrc: poi.imageSrc,
          location: poi.location,
          name: poi.name,
          openTime: poi.openTime,
          rating: poi.rating,
          subtitle: poi.subtitle ?? `${meta.capital} · ${poi.duration}`,
          tags: poi.tags,
          type: poi.type,
        }));

        const fallbackIds = items.map((item) => item.id);
        const themes = themePresets.map<MapDiscoveryTheme>((preset) => ({
          hint: preset.hint,
          id: preset.id,
          itemIds: pickThemeItems(items, preset.id, fallbackIds),
          keyword: preset.keyword,
          label: preset.label,
        }));

        return {
          city: meta.city,
          headline: `高德已补全 ${meta.city} 的代表性景点、博物馆和街区线索，可直接切换主题观察省域景点分布。`,
          items,
          themes,
        } satisfies CityMapDiscovery;
      })
      .catch((error) => {
        provinceDiscoveryCache.delete(cacheKey);
        throw error;
      });

    provinceDiscoveryCache.set(cacheKey, promise);
  }

  return provinceDiscoveryCache.get(cacheKey)!;
}
