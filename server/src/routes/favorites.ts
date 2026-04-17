import { Router } from "express";
import { z } from "zod";
import { getPoiById } from "../data/cities.js";
import { asyncRoute, HttpError } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import {
  listFavoritesByUser,
  removeFavorite,
  upsertFavorite,
} from "../repositories/favorites.js";

const favoriteInputSchema = z.object({
  city: z.string().min(1),
  poiId: z.string().min(1),
});

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get(
  "/favorites",
  asyncRoute(async (request, response) => {
    response.json({
      favorites: listFavoritesByUser(request.authUser!.id),
    });
  }),
);

favoritesRouter.post(
  "/favorites",
  asyncRoute(async (request, response) => {
    const result = favoriteInputSchema.safeParse(request.body);

    if (!result.success) {
      throw new HttpError(400, "收藏参数不合法", result.error.flatten());
    }

    const poi = await getPoiById(result.data.city, result.data.poiId);

    if (!poi) {
      throw new HttpError(404, "未找到要收藏的景点");
    }

    const favorite = upsertFavorite(request.authUser!.id, result.data.city, poi);

    response.status(201).json({ favorite });
  }),
);

favoritesRouter.delete(
  "/favorites/:poiId",
  asyncRoute(async (request, response) => {
    const poiId =
      typeof request.params.poiId === "string" ? request.params.poiId : "";

    if (!poiId) {
      throw new HttpError(400, "缺少景点 ID");
    }

    response.json({
      deleted: removeFavorite(request.authUser!.id, poiId),
    });
  }),
);
