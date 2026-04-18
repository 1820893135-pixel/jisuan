import { CarFront, CloudSun, Footprints, Globe2, Layers3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapWorkspace } from '../components/MapWorkspace'
import {
  NationalMapWorkspace,
  type ProvinceOverviewEntry,
} from '../components/NationalMapWorkspace'
import { useTravelApp } from '../context/useTravelApp'
import { readLastCity } from '../lib/appPreferences'
import type { CitySummary } from '../types'

function buildProvinceEntries(cities: CitySummary[]): ProvinceOverviewEntry[] {
  return cities
    .filter(
      (
        city,
      ): city is CitySummary & {
        capital: string
        center: [number, number]
        narrative: string
      } => Boolean(city.capital && city.center && city.narrative),
    )
    .map((city) => ({
      capital: city.capital,
      center: city.center,
      narrative: city.narrative,
      poiCount: city.poiCount ?? 6,
      province: city.city,
      slogan: city.slogan,
      tags: city.tags,
    }))
}

export function ExplorePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    amapKey,
    cities,
    favoriteBusyPoiId,
    favoritePoiIds,
    guide,
    handleToggleFavorite,
    loadingGuide,
    routeMode,
    routePlan,
    selectCity,
    setRouteMode,
  } = useTravelApp()
  const requestedCity = searchParams.get('city')?.trim() ?? ''
  const requestedPoiId = searchParams.get('poi')?.trim() ?? ''
  const requestedView = searchParams.get('view') === 'immersive' ? 'immersive' : 'standard'
  const requestedScope = searchParams.get('scope')
  const [showNationalOverview, setShowNationalOverview] = useState(
    () => requestedScope === 'national' || !readLastCity(),
  )
  const [enteringProvince, setEnteringProvince] = useState<string | null>(null)
  const [immersive3D, setImmersive3D] = useState(() => requestedView === 'immersive')
  const [weatherLine, setWeatherLine] = useState('')

  const provinceEntries = useMemo(() => buildProvinceEntries(cities), [cities])

  useEffect(() => {
    if (requestedScope === 'national') {
      setShowNationalOverview(true)
      return
    }

    if (requestedCity) {
      setShowNationalOverview(false)
      return
    }

    if (!guide && !loadingGuide) {
      setShowNationalOverview(!readLastCity())
    }
  }, [guide, loadingGuide, requestedCity, requestedScope])

  useEffect(() => {
    if (!requestedCity || guide?.city === requestedCity || loadingGuide) {
      return
    }

    void selectCity(requestedCity)
  }, [guide?.city, loadingGuide, requestedCity, selectCity])

  useEffect(() => {
    setImmersive3D(requestedView === 'immersive')
  }, [requestedView])

  useEffect(() => {
    if (showNationalOverview) {
      setWeatherLine('')
    }
  }, [showNationalOverview])

  async function handleEnterProvince(province: string) {
    setEnteringProvince(province)

    try {
      await selectCity(province)
      setShowNationalOverview(false)
      navigate(`/map?city=${encodeURIComponent(province)}`, { replace: true })
    } finally {
      setEnteringProvince(null)
    }
  }

  function handleBackToNational() {
    setShowNationalOverview(true)
    navigate('/map?scope=national')
  }

  const weatherSummary = weatherLine || `${guide?.city ?? '当前城市'} · 天气加载中`

  return (
    <div className="screen-page map-page">
      <header className="page-header page-header--map page-header--map-minimal">
        <div className="page-header__compact">
          <div>
            <span className="map-kicker">{showNationalOverview ? '全国总览' : '省域导览'}</span>
            <h1>{showNationalOverview ? '中国文化遗产地图' : guide?.city ?? '省域文化地图'}</h1>
          </div>

          <div
            className={
              showNationalOverview ? 'map-mode-switch' : 'map-mode-switch map-mode-switch--workspace'
            }
          >
            {showNationalOverview ? (
              <button className="chip-button active" type="button">
                <Globe2 className="icon-4" />
                全国总览
              </button>
            ) : (
              <>
                <button className="chip-button" onClick={handleBackToNational} type="button">
                  <Globe2 className="icon-4" />
                  返回全国
                </button>
                <button
                  className={routeMode === 'walking' ? 'chip-button active' : 'chip-button'}
                  onClick={() => setRouteMode('walking')}
                  type="button"
                >
                  <Footprints className="icon-4" />
                  步行优先
                </button>
                <button
                  className={routeMode === 'driving' ? 'chip-button active' : 'chip-button'}
                  onClick={() => setRouteMode('driving')}
                  type="button"
                >
                  <CarFront className="icon-4" />
                  驾车优先
                </button>
                <div className="map-view-switch-inline">
                  <button
                    className={immersive3D ? 'chip-button' : 'chip-button active'}
                    onClick={() => setImmersive3D(false)}
                    type="button"
                  >
                    标准地图
                  </button>
                  <button
                    className={immersive3D ? 'chip-button active' : 'chip-button'}
                    onClick={() => setImmersive3D(true)}
                    type="button"
                  >
                    <Layers3 className="icon-4" />
                    沉浸 3D
                  </button>
                </div>
                <div className="map-weather-inline" title={weatherSummary}>
                  <CloudSun className="icon-4" />
                  <span>{weatherSummary}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="map-stage-section map-stage-section--workspace">
        {showNationalOverview ? (
          <NationalMapWorkspace
            amapKey={amapKey}
            enteringProvince={enteringProvince}
            entries={provinceEntries}
            key="national-overview"
            mapLanguage="zh_cn"
            onEnterProvince={handleEnterProvince}
          />
        ) : guide ? (
          <MapWorkspace
            amapKey={amapKey}
            center={guide.center}
            city={guide.city}
            favoriteBusyPoiId={favoriteBusyPoiId}
            favoritePoiIds={favoritePoiIds}
            immersive3D={immersive3D}
            initialPoiId={requestedPoiId || null}
            key={`${guide.city}-workspace`}
            mapLanguage="zh_cn"
            onRouteModeChange={setRouteMode}
            onToggleFavorite={handleToggleFavorite}
            onWeatherLineChange={setWeatherLine}
            pois={guide.pois}
            routeMode={routeMode}
            routePlan={routePlan}
          />
        ) : (
          <div className="map-shell map-shell--immersive">
            <div className="map-shell__loading map-shell__loading--page">
              <strong>{loadingGuide ? '正在进入省域地图' : '正在准备地图页面'}</strong>
              <span>先同步景点数据和默认底图，再切到对应省份的真实高德地图。</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
