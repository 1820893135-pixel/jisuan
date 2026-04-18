import type { CitySummary } from '../types'

const provinceSuffixPattern = /省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g

function getPlannerCityAliases(cityOption: Pick<CitySummary, 'capital' | 'city'>) {
  return [
    cityOption.city.trim(),
    cityOption.capital?.trim() ?? '',
    cityOption.city.trim().replace(provinceSuffixPattern, ''),
  ].filter(Boolean)
}

export function resolvePlannerCity(
  message: string,
  currentCity: string,
  cityOptions: Array<Pick<CitySummary, 'capital' | 'city'>>,
) {
  const normalizedMessage = message.trim().toLowerCase()

  if (!normalizedMessage) {
    return currentCity
  }

  const matches = cityOptions
    .flatMap((cityOption) =>
      getPlannerCityAliases(cityOption).map((alias) => ({
        alias: alias.toLowerCase(),
        city: cityOption.city,
        index: normalizedMessage.lastIndexOf(alias.toLowerCase()),
      })),
    )
    .filter((entry) => entry.index >= 0)
    .sort((left, right) => right.index - left.index || right.alias.length - left.alias.length)

  return matches[0]?.city ?? currentCity
}
