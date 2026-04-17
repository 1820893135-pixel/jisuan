import { getProvinceMapDiscovery } from "../services/amapPlaces.js";

export async function getCityMapDiscovery(city?: string) {
  return getProvinceMapDiscovery(city);
}
