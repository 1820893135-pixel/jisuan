import { db } from "../db/client.js";
import type { FavoriteRecord, Poi } from "../types.js";

interface FavoriteRow {
  user_id: string;
  poi_id: string;
  city: string;
  poi_name: string;
  poi_type: string;
  poi_description: string;
  location_lng: number;
  location_lat: number;
  created_at: string;
}

const listFavoritesStatement = db.prepare(`
  SELECT user_id, poi_id, city, poi_name, poi_type, poi_description, location_lng, location_lat, created_at
  FROM favorites
  WHERE user_id = ?
  ORDER BY created_at DESC
`);

const findFavoriteStatement = db.prepare(`
  SELECT user_id, poi_id, city, poi_name, poi_type, poi_description, location_lng, location_lat, created_at
  FROM favorites
  WHERE user_id = ? AND poi_id = ?
`);

const upsertFavoriteStatement = db.prepare(`
  INSERT INTO favorites (
    user_id, poi_id, city, poi_name, poi_type, poi_description, location_lng, location_lat, created_at
  ) VALUES (
    @userId, @poiId, @city, @poiName, @poiType, @poiDescription, @locationLng, @locationLat, @createdAt
  )
  ON CONFLICT(user_id, poi_id) DO UPDATE SET
    city = excluded.city,
    poi_name = excluded.poi_name,
    poi_type = excluded.poi_type,
    poi_description = excluded.poi_description,
    location_lng = excluded.location_lng,
    location_lat = excluded.location_lat
`);

const removeFavoriteStatement = db.prepare(
  "DELETE FROM favorites WHERE user_id = ? AND poi_id = ?",
);

function mapFavorite(row: FavoriteRow): FavoriteRecord {
  return {
    userId: row.user_id,
    poiId: row.poi_id,
    city: row.city,
    poiName: row.poi_name,
    poiType: row.poi_type,
    poiDescription: row.poi_description,
    location: [row.location_lng, row.location_lat],
    createdAt: row.created_at,
  };
}

export function listFavoritesByUser(userId: string) {
  const rows = listFavoritesStatement.all(userId) as FavoriteRow[];
  return rows.map(mapFavorite);
}

export function upsertFavorite(userId: string, city: string, poi: Poi) {
  const existing = findFavoriteStatement.get(userId, poi.id) as
    | FavoriteRow
    | undefined;

  upsertFavoriteStatement.run({
    userId,
    poiId: poi.id,
    city,
    poiName: poi.name,
    poiType: poi.type,
    poiDescription: poi.description,
    locationLng: poi.location[0],
    locationLat: poi.location[1],
    createdAt: existing?.created_at ?? new Date().toISOString(),
  });

  const row = findFavoriteStatement.get(userId, poi.id) as FavoriteRow;
  return mapFavorite(row);
}

export function removeFavorite(userId: string, poiId: string) {
  const result = removeFavoriteStatement.run(userId, poiId);
  return result.changes > 0;
}
