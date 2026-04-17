import { listCities as listProvinceSummaries } from "./provinces.js";
import { getProvinceGuide } from "../services/amapPlaces.js";

export const listCities = listProvinceSummaries;

export async function getCityGuide(city?: string) {
  return getProvinceGuide(city);
}

export async function getPoiById(city: string, poiId: string) {
  const guide = await getCityGuide(city);
  return guide.pois.find((poi) => poi.id === poiId) ?? null;
}

export async function getPoisByIds(city: string, poiIds: string[]) {
  const guide = await getCityGuide(city);
  const poiLookup = new Map(guide.pois.map((poi) => [poi.id, poi]));

  return poiIds
    .map((poiId) => poiLookup.get(poiId) ?? null)
    .filter((poi): poi is NonNullable<typeof poi> => poi !== null);
}
