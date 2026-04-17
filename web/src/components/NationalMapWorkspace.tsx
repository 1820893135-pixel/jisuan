import { Compass, LoaderCircle } from 'lucide-react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import {
  observeElementResize,
  scheduleStabilizedResize,
  waitForElementToHaveSize,
  waitForMapComplete,
} from '../lib/amapCanvas'
import { loadAMap } from '../lib/loadAMap'

export interface ProvinceOverviewEntry {
  capital: string
  center: [number, number]
  narrative: string
  poiCount: number
  province: string
  slogan: string
  tags: string[]
}

interface NationalMapWorkspaceProps {
  amapKey: string
  enteringProvince: string | null
  entries: ProvinceOverviewEntry[]
  mapLanguage: 'zh_cn' | 'en'
  onEnterProvince: (province: string) => Promise<void>
}

interface NationalMapState {
  AMap: AMapNamespace | null
  districtSearch: AMapDistrictSearch | null
  map: AMapMap | null
  markers: AMapMarker[]
  provincePolygons: AMapPolygon[]
  scale: AMapScale | null
}

const chinaCenter: [number, number] = [104.195397, 35.86166]

function createInitialMapState(): NationalMapState {
  return {
    AMap: null,
    districtSearch: null,
    map: null,
    markers: [],
    provincePolygons: [],
    scale: null,
  }
}

function getProvinceShortLabel(name: string) {
  return (
    name.replace(
      /省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g,
      '',
    ) || name
  )
}

function normalizeCoordinates(input: unknown): [number, number] | null {
  if (Array.isArray(input) && input.length >= 2) {
    const [lng, lat] = input.map(Number)
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat]
    }
  }

  if (typeof input === 'string') {
    const [lngText, latText] = input.split(',')
    const lng = Number(lngText)
    const lat = Number(latText)
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat]
    }
  }

  if (
    typeof input === 'object' &&
    input !== null &&
    'getLng' in input &&
    'getLat' in input
  ) {
    const lngLat = input as AMapLngLatLike
    return [lngLat.getLng(), lngLat.getLat()]
  }

  return null
}

function normalizeBoundaryPath(path: unknown): [number, number][] | null {
  if (typeof path === 'string') {
    const points = path
      .split(';')
      .map((item) => normalizeCoordinates(item))
      .filter((item): item is [number, number] => item !== null)

    return points.length > 2 ? points : null
  }

  if (Array.isArray(path)) {
    const points = path
      .map((item) => normalizeCoordinates(item))
      .filter((item): item is [number, number] => item !== null)

    return points.length > 2 ? points : null
  }

  return null
}

function extractDistrictBoundaries(result: unknown) {
  const districtList =
    typeof result === 'object' &&
    result !== null &&
    'districtList' in result &&
    Array.isArray(result.districtList)
      ? result.districtList
      : []

  const district =
    districtList.length > 0 &&
    typeof districtList[0] === 'object' &&
    districtList[0] !== null
      ? districtList[0]
      : null

  if (!district) {
    return [] as [number, number][][]
  }

  const boundaries =
    'boundaries' in district && Array.isArray(district.boundaries)
      ? district.boundaries
      : []

  return boundaries
    .map((boundary: unknown) => normalizeBoundaryPath(boundary))
    .filter((path: [number, number][] | null): path is [number, number][] => path !== null)
}

export function NationalMapWorkspace({
  amapKey,
  enteringProvince,
  entries,
  mapLanguage,
  onEnterProvince,
}: NationalMapWorkspaceProps) {
  const [previewProvince, setPreviewProvince] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapStateRef = useRef<NationalMapState>(createInitialMapState())
  const mapRunIdRef = useRef(0)
  const previewEntry = useMemo(
    () => entries.find((entry) => entry.province === previewProvince) ?? null,
    [entries, previewProvince],
  )

  function isActiveMapRun(runId: number, state: NationalMapState | null | undefined) {
    return Boolean(
      state?.map &&
        runId === mapRunIdRef.current &&
        mapStateRef.current.map === state.map,
    )
  }

  function runMapCommand(command: () => void) {
    try {
      command()
    } catch {
      // 高德实例切换期间会出现瞬时不可操作状态，这里避免把内部异常暴露成页面抖动。
    }
  }

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) {
      return
    }

    return observeElementResize(container, () => {
      const map = mapStateRef.current.map
      if (map) {
        runMapCommand(() => map.resize())
      }
    })
  }, [])

  async function ensureMapReady() {
    const container = mapContainerRef.current
    if (!container || !amapKey) {
      return null
    }

    const AMap = await loadAMap(amapKey)
    const containerReady = await waitForElementToHaveSize(container)
    if (!containerReady || mapContainerRef.current !== container) {
      return null
    }

    const state = mapStateRef.current

    if (!state.map) {
      setMapReady(false)
      const scale = new AMap.Scale({
        languageCode: mapLanguage === 'en' ? 'en' : 'zh',
        position: 'LB',
      })
      const map = new AMap.Map(container, {
        animateEnable: true,
        center: chinaCenter,
        doubleClickZoom: true,
        dragEnable: true,
        jogEnable: true,
        lang: mapLanguage === 'en' ? 'en' : 'zh_cn',
        mapStyle: 'amap://styles/normal',
        pitch: 0,
        resizeEnable: true,
        rotation: 0,
        scrollWheel: true,
        showBuildingBlock: false,
        viewMode: '2D',
        zoom: 4.4,
        zoomEnable: true,
      })

      map.addControl(scale)
      map.addControl(new AMap.ToolBar({ position: 'RB' }))
      map.addControl(
        new AMap.MapType({
          position: 'RT',
          showRoad: true,
          showTraffic: true,
        }),
      )
      map.addControl(new AMap.ControlBar({ position: 'RB' }))

      state.AMap = AMap
      state.districtSearch = new AMap.DistrictSearch({
        extensions: 'all',
        level: 'province',
        subdistrict: 1,
      })
      state.map = map
      state.scale = scale
      const activeMap = map
      scheduleStabilizedResize(() => {
        if (
          mapStateRef.current.map === activeMap &&
          mapContainerRef.current === container
        ) {
          runMapCommand(() => activeMap.resize())
        }
      })

      await waitForMapComplete(map)
      if (mapStateRef.current.map !== activeMap) {
        return null
      }
      setMapReady(true)
    } else {
      setMapReady(true)
    }

    return state
  }

  const loadProvinceBoundary = useEffectEvent(
    async (entry: ProvinceOverviewEntry, state: NationalMapState) => {
      if (!state.AMap || !state.districtSearch) {
        return [] as AMapPolygon[]
      }

      return new Promise<AMapPolygon[]>((resolve) => {
        state.districtSearch?.search(entry.province, (status, result) => {
          if (status !== 'complete') {
            resolve([])
            return
          }

          const paths = extractDistrictBoundaries(result)
          const polygons = paths.map(
            (path: [number, number][]) =>
              new state.AMap!.Polygon({
                bubble: true,
                fillColor: '#dc2626',
                fillOpacity: 0.05,
                path,
                strokeColor: '#dc2626',
                strokeOpacity: 0.65,
                strokeWeight: 2,
              }),
          )

          polygons.forEach((polygon: AMapPolygon) => {
            polygon.on('click', () => {
              setPreviewProvince(entry.province)
              void onEnterProvince(entry.province)
            })
          })

          resolve(polygons)
        })
      })
    },
  )

  const syncMap = useEffectEvent(async () => {
    const runId = mapRunIdRef.current
    const state = await ensureMapReady()
    if (!state?.AMap || !isActiveMapRun(runId, state)) {
      return
    }

    const map = state.map!
    const AMap = state.AMap!

    if (state.markers.length > 0) {
      runMapCommand(() => map.remove(state.markers))
      state.markers = []
    }

    if (state.provincePolygons.length > 0) {
      runMapCommand(() => map.remove(state.provincePolygons))
      state.provincePolygons = []
    }

    const markers = entries.map((entry) => {
      const marker = new AMap.Marker({
        position: entry.center,
        title: entry.province,
        label: {
          content: `<div class="map-province-pin ${
            entry.province === previewEntry?.province ? 'map-province-pin--active' : ''
          }">${getProvinceShortLabel(entry.province)}</div>`,
          direction: 'top',
        },
      })

      marker.on('click', () => {
        setPreviewProvince(entry.province)
        void onEnterProvince(entry.province)
      })

      return marker
    })

    runMapCommand(() => map.add(markers))
    state.markers = markers

    if (!previewEntry) {
      runMapCommand(() => map.setZoomAndCenter(4.4, chinaCenter))
      scheduleStabilizedResize(() => {
        if (isActiveMapRun(runId, state)) {
          runMapCommand(() => map.resize())
        }
      })
      return
    }

    const polygons = await loadProvinceBoundary(previewEntry, state)
    if (!isActiveMapRun(runId, state)) {
      return
    }

    if (polygons.length > 0) {
      runMapCommand(() => map.add(polygons))
      state.provincePolygons = polygons
      runMapCommand(() => map.setFitView(polygons, true, [72, 72, 72, 72]))
      scheduleStabilizedResize(() => {
        if (isActiveMapRun(runId, state)) {
          runMapCommand(() => map.resize())
        }
      })
      return
    }

    runMapCommand(() => map.setZoomAndCenter(5.2, previewEntry.center))
    scheduleStabilizedResize(() => {
      if (isActiveMapRun(runId, state)) {
        runMapCommand(() => map.resize())
      }
    })
  })

  useEffect(() => {
    void syncMap()
  }, [entries, mapLanguage, previewEntry?.province])

  useEffect(() => {
    return () => {
      mapRunIdRef.current += 1
      const currentMap = mapStateRef.current.map
      if (currentMap) {
        runMapCommand(() => currentMap.clearInfoWindow())
        if (mapStateRef.current.markers.length > 0) {
          runMapCommand(() => currentMap.remove(mapStateRef.current.markers))
        }
        if (mapStateRef.current.provincePolygons.length > 0) {
          runMapCommand(() => currentMap.remove(mapStateRef.current.provincePolygons))
        }
        runMapCommand(() => currentMap.destroy())
      }
      mapStateRef.current.markers = []
      mapStateRef.current.provincePolygons = []
      mapStateRef.current = createInitialMapState()
    }
  }, [])

  return (
    <div className="map-shell map-shell--immersive map-shell--national">
      <div ref={mapContainerRef} className="map-shell__canvas" />
      {!amapKey ? (
        <div className="map-shell__empty">
          <strong>缺少高德地图 Key</strong>
          <span>请配置 `VITE_AMAP_KEY` 后再启用全国总览地图。</span>
        </div>
      ) : (
        <>
          {!mapReady ? (
            <div className="map-shell__loading">
              <strong>正在加载全国地图</strong>
              <span>先把默认底图和省域文字标注铺开，再进入对应省份。</span>
            </div>
          ) : null}
          <div className="national-map-hud national-map-hud--left">
            <span className="national-map-hud__badge">
              <Compass className="icon-4" />
              点击省份直接进入导览
            </span>
            {previewEntry ? (
              <span className="national-map-hud__subtle">
                {previewEntry.province} · {previewEntry.capital}
              </span>
            ) : null}
          </div>

          {enteringProvince ? (
            <div className="national-map-hud national-map-hud--right">
              <span className="national-map-hud__badge national-map-hud__badge--loading">
                <LoaderCircle className="icon-4 icon-spin" />
                正在进入 {enteringProvince}
              </span>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
