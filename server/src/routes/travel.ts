import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { getCityMapDiscovery } from "../data/amapDiscovery.js";
import { getCityGuide, listCities } from "../data/cities.js";
import { asyncRoute, HttpError } from "../lib/http.js";
import { generateTravelPlan } from "../lib/itinerary.js";
import { planCityRoute } from "../services/amapRoutes.js";

const plannerInputSchema = z.object({
  city: z.string().min(1),
  days: z.number().int().min(1).max(5),
  budget: z.string().min(1),
  style: z.string().min(1),
  interests: z.array(z.string()).min(1),
  note: z.string().optional(),
});

const routePlanSchema = z.object({
  city: z.string().min(1),
  poiIds: z.array(z.string().min(1)).min(2).max(8),
  mode: z.enum(["walking", "driving"]).default("walking"),
});

export const travelRouter = Router();

travelRouter.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "lvyou-server",
    time: new Date().toISOString(),
    features: {
      aiItinerary: Boolean(process.env.OPENAI_API_KEY),
      amapRoutePlanning: Boolean(config.amapWebServiceKey),
      auth: true,
      favorites: true,
      sqlite: true,
    },
  });
});

travelRouter.get("/cities", (_request, response) => {
  response.json({
    cities: listCities(),
  });
});

travelRouter.get(
  "/guide",
  asyncRoute(async (request, response) => {
    const city =
      typeof request.query.city === "string" ? request.query.city : undefined;

    response.json({
      guide: await getCityGuide(city),
    });
  }),
);

travelRouter.get(
  "/map/discovery",
  asyncRoute(async (request, response) => {
    const city =
      typeof request.query.city === "string" ? request.query.city : undefined;

    response.json({
      discovery: await getCityMapDiscovery(city),
    });
  }),
);

travelRouter.post(
  "/itinerary",
  asyncRoute(async (request, response) => {
    const result = plannerInputSchema.safeParse(request.body);

    if (!result.success) {
      throw new HttpError(400, "请求参数不合法", result.error.flatten());
    }

    response.json(await generateTravelPlan(result.data));
  }),
);

travelRouter.post(
  "/routes/plan",
  asyncRoute(async (request, response) => {
    const result = routePlanSchema.safeParse(request.body);

    if (!result.success) {
      throw new HttpError(400, "路线规划参数不合法", result.error.flatten());
    }

    response.json({
      routePlan: await planCityRoute(
        result.data.city,
        result.data.poiIds,
        result.data.mode,
      ),
    });
  }),
);
