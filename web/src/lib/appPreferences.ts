const lastCityStorageKey = 'lvyou-last-city'
const mapLanguageStorageKey = 'lvyou-map-language'

export type MapLanguage = 'zh_cn' | 'en'

export function readLastCity() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(lastCityStorageKey) ?? ''
}

export function writeLastCity(city: string) {
  if (typeof window === 'undefined') {
    return
  }

  if (!city.trim()) {
    window.localStorage.removeItem(lastCityStorageKey)
    return
  }

  window.localStorage.setItem(lastCityStorageKey, city)
}

export function readMapLanguage(): MapLanguage {
  if (typeof window === 'undefined') {
    return 'zh_cn'
  }

  window.localStorage.removeItem(mapLanguageStorageKey)
  return 'zh_cn'
}
