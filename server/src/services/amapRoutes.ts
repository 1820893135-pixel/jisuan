import { config } from "../config.js";
import { getCityGuide, getPoisByIds } from "../data/cities.js";
import type {
  Coordinates,
  Poi,
  RouteMode,
  RoutePlan,
  RouteSegment,
  RouteWaypoint,
} from "../types.js";

const speedMetersPerSecond: Record<RouteMode, number> = {
  walking: 1.35,
  driving: 9.72,
};

function coordinateToText([lng, lat]: Coordinates) {
  return `${lng},${lat}`;
}

function parsePolyline(polylineText?: string): Coordinates[] {
  if (!polylineText) {
    return [];
  }

  return polylineText
    .split(";")
    .map((item) => item.split(",").map(Number))
    .filter((item): item is number[] => item.length === 2)
    .map(([lng, lat]) => [lng, lat] as Coordinates);
}

function dedupePolyline(points: Coordinates[]) {
  return points.filter((point, index, source) => {
    if (index === 0) {
      return true;
    }

    const previous = source[index - 1];
    return point[0] !== previous[0] || point[1] !== previous[1];
  });
}

function haversineDistanceMeters(origin: Coordinates, destination: Coordinates) {
  const radius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const [lng1, lat1] = origin;
  const [lng2, lat2] = destination;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildManualSegment(
  origin: Poi,
  destination: Poi,
  mode: RouteMode,
): RouteSegment {
  const distanceMeters = Math.round(
    haversineDistanceMeters(origin.location, destination.location),
  );

  return {
    fromPoiId: origin.id,
    toPoiId: destination.id,
    fromName: origin.name,
    toName: destination.name,
    distanceMeters,
    durationSeconds: Math.round(distanceMeters / speedMetersPerSecond[mode]),
    instructions: [`从 ${origin.name} 前往 ${destination.name}`],
    polyline: [origin.location, destination.location],
  };
}

function buildManualPlan(
  city: string,
  pois: Poi[],
  mode: RouteMode,
  warning: string,
): RoutePlan {
  const segments = pois.slice(0, -1).map((poi, index) =>
    buildManualSegment(poi, pois[index + 1], mode),
  );

  return {
    city,
    mode,
    source: "manual-estimate",
    distanceMeters: segments.reduce(
      (total, segment) => total + segment.distanceMeters,
      0,
    ),
    durationSeconds: segments.reduce(
      (total, segment) => total + segment.durationSeconds,
      0,
    ),
    waypoints: pois.map<RouteWaypoint>((poi) => ({
      poiId: poi.id,
      name: poi.name,
      location: poi.location,
    })),
    polyline: dedupePolyline(
      segments.flatMap((segment, index) =>
        index === 0 ? segment.polyline : segment.polyline.slice(1),
      ),
    ),
    segments,
    warnings: [warning],
  };
}

function formatRouteFailureWarning(message: string) {
  if (message.includes("fetch failed")) {
    return "高德 Web 服务请求失败，请确认后端服务正在运行、当前网络可访问高德接口，且 AMAP_WEB_SERVICE_KEY 使用的是 Web 服务 Key。";
  }

  if (message.includes("INVALID_USER_KEY")) {
    return "高德 Web 服务 Key 无效，请检查 AMAP_WEB_SERVICE_KEY 是否填写正确。";
  }

  if (message.includes("CUQPS_HAS_EXCEEDED_THE_LIMIT")) {
    return "高德路径服务当前配额已达上限。";
  }

  return `高德路径规划失败：${message}`;
}

async function fetchAmapSegment(
  origin: Poi,
  destination: Poi,
  mode: RouteMode,
): Promise<RouteSegment> {
  const endpoint =
    mode === "walking"
      ? "https://restapi.amap.com/v3/direction/walking"
      : "https://restapi.amap.com/v3/direction/driving";

  const params = new URLSearchParams({
    key: config.amapWebServiceKey,
    origin: coordinateToText(origin.location),
    destination: coordinateToText(destination.location),
    output: "JSON",
  });

  if (mode === "driving") {
    params.set("extensions", "all");
    params.set("strategy", "0");
  }

  const response = await fetch(`${endpoint}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`AMap route request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as any;

  if (payload.status !== "1") {
    throw new Error(payload.info || "AMap route request returned an error");
  }

  const path = payload.route?.paths?.[0];

  if (!path) {
    throw new Error("AMap route response did not include a path");
  }

  const polyline = dedupePolyline(
    (Array.isArray(path.steps) ? path.steps : [])
      .flatMap((step: { polyline?: string }) => parsePolyline(step.polyline)),
  );

  return {
    fromPoiId: origin.id,
    toPoiId: destination.id,
    fromName: origin.name,
    toName: destination.name,
    distanceMeters: Number(path.distance) || 0,
    durationSeconds: Number(path.duration) || 0,
    instructions: (Array.isArray(path.steps) ? path.steps : [])
      .map((step: { instruction?: string }) => step.instruction)
      .filter((instruction: string | undefined): instruction is string =>
        Boolean(instruction),
      )
      .slice(0, 4),
    polyline:
      polyline.length > 1 ? polyline : [origin.location, destination.location],
  };
}

export async function planCityRoute(
  city: string,
  poiIds: string[],
  mode: RouteMode,
) {
  const guide = await getCityGuide(city);
  const uniquePoiIds = [...new Set(poiIds)];
  const pois = await getPoisByIds(city, uniquePoiIds);

  if (pois.length < 2) {
    throw new Error("至少需要 2 个景点才能规划路线");
  }

  if (!config.amapWebServiceKey) {
    return buildManualPlan(
      guide.city,
      pois,
      mode,
      "未配置 AMAP_WEB_SERVICE_KEY，当前展示为直线估算路线。",
    );
  }

  try {
    const segments: RouteSegment[] = [];

    for (let index = 0; index < pois.length - 1; index += 1) {
      segments.push(await fetchAmapSegment(pois[index], pois[index + 1], mode));
    }

    return {
      city: guide.city,
      mode,
      source: "amap-webservice",
      distanceMeters: segments.reduce(
        (total, segment) => total + segment.distanceMeters,
        0,
      ),
      durationSeconds: segments.reduce(
        (total, segment) => total + segment.durationSeconds,
        0,
      ),
      waypoints: pois.map<RouteWaypoint>((poi) => ({
        poiId: poi.id,
        name: poi.name,
        location: poi.location,
      })),
      polyline: dedupePolyline(
        segments.flatMap((segment, index) =>
          index === 0 ? segment.polyline : segment.polyline.slice(1),
        ),
      ),
      segments,
      warnings: [],
    } satisfies RoutePlan;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return buildManualPlan(
      guide.city,
      pois,
      mode,
      `${formatRouteFailureWarning(message)} 已回退为直线估算路线。`,
    );
  }
}
