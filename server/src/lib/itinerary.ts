import { createAgent, providerStrategy, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { getCityGuide } from "../data/cities.js";
import { resolveProvinceMeta } from "../data/provinces.js";
import { planCityRoute } from "../services/amapRoutes.js";
import {
  getProvinceWeather,
  searchProvinceHighlights,
} from "../services/amapPlaces.js";
import type {
  CityGuide,
  DayPlan,
  PlannerInput,
  TravelItinerary,
} from "../types.js";

const itinerarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  routeReason: z.string(),
  dailyPlan: z.array(
    z.object({
      day: z.number(),
      theme: z.string(),
      summary: z.string(),
      stops: z.array(
        z.object({
          time: z.string(),
          name: z.string(),
          activity: z.string(),
          transport: z.string(),
          cost: z.string(),
        }),
      ),
    }),
  ),
  tips: z.array(z.string()),
});

const searchHighlightsTool = tool(
  async ({ keywords, limit, province }) => {
    const results = await searchProvinceHighlights(province, keywords, limit);
    return {
      province: resolveProvinceMeta(province).city,
      results,
    };
  },
  {
    name: "amap_search_highlights",
    description:
      "调用高德 Web 服务搜索省域内的代表性景点、博物馆、老街与文化场所，返回真实 POI。",
    schema: z.object({
      keywords: z
        .string()
        .optional()
        .describe("可选关键词，例如博物馆、历史古迹、老街、非遗。"),
      limit: z
        .number()
        .int()
        .min(2)
        .max(8)
        .default(6)
        .describe("返回 POI 数量，建议 4-6 个。"),
      province: z.string().describe("省份或地区名称，例如浙江省、陕西省、四川省。"),
    }),
  },
);

const routeBriefTool = tool(
  async ({ mode, poiIds, province }) => {
    const routePlan = await planCityRoute(province, poiIds, mode);
    return {
      city: routePlan.city,
      distanceMeters: routePlan.distanceMeters,
      durationSeconds: routePlan.durationSeconds,
      mode: routePlan.mode,
      source: routePlan.source,
      warnings: routePlan.warnings,
      waypoints: routePlan.waypoints,
    };
  },
  {
    name: "amap_route_brief",
    description:
      "基于当前省域候选 POI 生成路线距离与时长摘要，用于帮助确定顺序和节奏。",
    schema: z.object({
      mode: z.enum(["walking", "driving"]).default("driving"),
      poiIds: z
        .array(z.string().min(1))
        .min(2)
        .max(4)
        .describe("需要规划的高德 POI id 列表。"),
      province: z.string().describe("省份或地区名称。"),
    }),
  },
);

const weatherTool = tool(
  async ({ province }) => {
    const meta = resolveProvinceMeta(province);
    const weather = await getProvinceWeather(province);

    return {
      capital: meta.capital,
      province: meta.city,
      weather,
    };
  },
  {
    name: "amap_weather_snapshot",
    description:
      "查询当前省域首府的高德实时天气，用于补充行程建议和出行提示。",
    schema: z.object({
      province: z.string().describe("省份或地区名称。"),
    }),
  },
);

function chunkPois(guide: CityGuide, days: number) {
  const minimumStopsPerDay = 2;
  const pool = [...guide.pois];

  while (pool.length < days * minimumStopsPerDay) {
    pool.push(...guide.pois);
  }

  const chunkSize = Math.ceil(pool.length / days);
  return Array.from({ length: days }, (_, index) =>
    pool.slice(index * chunkSize, index * chunkSize + chunkSize).slice(0, 3),
  );
}

function buildFallbackPlan(input: PlannerInput, guide: CityGuide): TravelItinerary {
  const groupedPois = chunkPois(guide, input.days);
  const dailyPlan: DayPlan[] = groupedPois.map((pois, index) => ({
    day: index + 1,
    theme:
      index === 0
        ? `初见 ${guide.city} · ${input.style}`
        : `${guide.city} 深入体验 Day ${index + 1}`,
    summary: `围绕${input.interests.join("、")}展开，兼顾${input.budget}预算与可执行性。`,
    stops: pois.map((poi, poiIndex) => ({
      activity: `${poi.highlight}，建议停留 ${poi.duration}。`,
      cost: /(老街|步行街|公园|风景|景区)/.test(poi.type)
        ? "以现场消费或轻门票为主"
        : "建议提前查看门票与预约信息",
      name: poi.name,
      time: ["09:00", "13:30", "18:00"][poiIndex] ?? "20:00",
      transport:
        poiIndex === 0 ? "从住宿点或交通枢纽出发" : "建议车程 + 步行衔接",
    })),
  }));

  return {
    dailyPlan,
    overview: `${guide.city}这条路线以${input.style}为主线，覆盖${input.interests.join(
      "、",
    )}相关的核心点位，适合放进真实地图导览产品里直接展示。`,
    routeReason:
      "优先保留辨识度高、叙事关系清晰、适合在地图上形成主线的点位，再补充生活感和主题体验。",
    tips: [
      "热门景点更适合放在上午或开馆后尽早进入，减少排队影响。",
      "如果需要更舒适的节奏，可以把博物馆和街区分到不同半天。",
      "地图页里看到的导航时间和景点建议停留时长是两类信息，查看时要分开理解。",
    ],
    title: `${guide.city}${input.days}天文化遗产路线`,
  };
}

async function buildLangChainPlan(
  input: PlannerInput,
  guide: CityGuide,
): Promise<TravelItinerary> {
  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    configuration: process.env.OPENAI_BASE_URL
      ? { baseURL: process.env.OPENAI_BASE_URL }
      : undefined,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.6,
  });

  const agent = createAgent({
    model,
    systemPrompt:
      "你是一名中国文化遗产导览产品的行程设计师。回答前优先调用高德工具，先确认真实 POI、天气和路线节奏，再输出适合 Web 应用直接展示的结构化行程。文案要像产品里的说明文字，不要写成攻略长文。",
    responseFormat: providerStrategy(itinerarySchema),
    tools: [searchHighlightsTool, routeBriefTool, weatherTool],
  });

  const candidatePois = guide.pois
    .map(
      (poi, index) =>
        `${index + 1}. ${poi.name} | id: ${poi.id} | 类型: ${poi.type} | 区域: ${
          poi.subtitle ?? guide.city
        } | 亮点: ${poi.highlight}`,
    )
    .join("\n");

  const result = await agent.invoke({
    messages: [
      {
        content: `请为用户生成结构化旅行方案。
目标地区：${guide.city}
出行天数：${input.days}
预算区间：${input.budget}
旅行风格：${input.style}
兴趣标签：${input.interests.join("、")}
补充说明：${input.note || "无"}

当前候选点位：
${candidatePois}

要求：
1. 先用高德工具补强真实 POI、天气和路线判断，再决定每天安排。
2. 每天安排 2-3 个点位，顺序要合理，尽量避免来回折返。
3. 输出适合地图应用展示的简洁中文，不要写成长篇游记。
4. tips 需要是真正能放进产品界面的短句。`,
        role: "user",
      },
    ],
  });

  if (!result.structuredResponse) {
    throw new Error("LangChain agent 未返回结构化行程。");
  }

  return result.structuredResponse as TravelItinerary;
}

export async function generateTravelPlan(input: PlannerInput) {
  const guide = await getCityGuide(input.city);

  if (!process.env.OPENAI_API_KEY) {
    return {
      guide,
      source: "fallback-template",
      itinerary: buildFallbackPlan(input, guide),
    };
  }

  try {
    const itinerary = await buildLangChainPlan(input, guide);
    return {
      guide,
      source: "langchain-openai-tools",
      itinerary,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown LangChain error";
    console.error(
      `LangChain itinerary generation failed, falling back to template. ${message}`,
    );

    return {
      guide,
      source: "fallback-template",
      itinerary: buildFallbackPlan(input, guide),
    };
  }
}
