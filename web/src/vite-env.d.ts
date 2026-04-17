/// <reference types="vite/client" />

type AMapCoordinates = [number, number]

declare global {
  interface AMapLayer {
    readonly __kind?: 'AMapLayer'
  }

  interface AMapLngLatLike {
    getLng(): number
    getLat(): number
  }

  interface AMapMarker {
    on(eventName: 'click' | 'mouseout' | 'mouseover', handler: () => void): void
  }

  interface AMapPolygon {
    readonly __kind?: 'AMapPolygon'
    on(eventName: 'click', handler: () => void): void
  }

  interface AMapPolyline {
    readonly __kind?: 'AMapPolyline'
  }

  type AMapOverlay = AMapMarker | AMapPolygon | AMapPolyline

  interface AMapInfoWindow {
    close(): void
    setContent(content: string): void
    open(map: AMapMap, position: AMapCoordinates): void
  }

  interface AMapScale {
    getLanguageCode?(): string
    setPosition(position: string): void
    setLanguageCode?(languageCode: string): void
  }

  interface AMapMap {
    add(items: unknown[] | unknown): void
    addControl(control: unknown): void
    clearInfoWindow(): void
    destroy(): void
    off?(eventName: 'complete', handler: () => void): void
    on(eventName: 'complete', handler: () => void): void
    remove(items: unknown[] | unknown): void
    setCenter(center: AMapCoordinates): void
    setFitView(
      overlays?: unknown[],
      immediately?: boolean,
      paddings?: [number, number, number, number],
    ): void
    setLayers(layers: AMapLayer[]): void
    resize(): void
    setPitch(pitch: number): void
    setRotation(rotation: number): void
    setZoom(zoom: number): void
    setZoomAndCenter(zoom: number, center: AMapCoordinates): void
  }

  interface AMapPlaceSearch {
    search(
      keyword: string,
      callback: (status: string, result: unknown) => void,
    ): void
    searchNearBy(
      keyword: string,
      center: AMapCoordinates,
      radius: number,
      callback: (status: string, result: unknown) => void,
    ): void
  }

  interface AMapAutoComplete {
    search(
      keyword: string,
      callback: (status: string, result: unknown) => void,
    ): void
  }

  interface AMapGeocoder {
    getAddress(
      location: AMapCoordinates,
      callback: (status: string, result: unknown) => void,
    ): void
  }

  interface AMapDistrictSearch {
    search(
      keyword: string,
      callback: (status: string, result: unknown) => void,
    ): void
  }

  interface AMapGeolocation {
    getCurrentPosition(): void
    on(
      eventName: 'complete' | 'error',
      handler: (result: unknown) => void,
    ): void
  }

  interface AMapRouteService {
    clear(): void
    search(
      origin: AMapCoordinates,
      destination: AMapCoordinates,
      callback: (status: string, result: unknown) => void,
    ): void
  }

  interface AMapWeather {
    getForecast(
      city: string,
      callback: (error: unknown, result: unknown) => void,
    ): void
    getLive(
      city: string,
      callback: (error: unknown, result: unknown) => void,
    ): void
  }

  interface AMapNamespace {
    AutoComplete: new (options?: {
      city?: string
      citylimit?: boolean
    }) => AMapAutoComplete
    ControlBar: new (options?: {
      position?: string
    }) => unknown
    DistrictSearch: new (options?: {
      extensions?: 'base' | 'all'
      level?: 'country' | 'province' | 'city' | 'district' | 'biz_area'
      subdistrict?: 0 | 1 | 2 | 3
    }) => AMapDistrictSearch
    Driving: new (options?: {
      autoFitView?: boolean
      map?: AMapMap | null
      panel?: HTMLElement | null
      showTraffic?: boolean
    }) => AMapRouteService
    Geocoder: new (options?: {
      extensions?: 'base' | 'all'
      radius?: number
    }) => AMapGeocoder
    Geolocation: new (options?: {
      enableHighAccuracy?: boolean
      position?: string
      showButton?: boolean
      timeout?: number
      zoomToAccuracy?: boolean
    }) => AMapGeolocation
    InfoWindow: new (options?: { offset?: unknown }) => AMapInfoWindow
    Map: new (
      container: HTMLElement,
      options: {
        animateEnable?: boolean
        center: AMapCoordinates
        doubleClickZoom?: boolean
        dragEnable?: boolean
        jogEnable?: boolean
        lang?: 'zh_cn' | 'en' | 'zh_en'
        languageCode?: 'zh' | 'en'
        layers?: AMapLayer[]
        logoLanguage?: 'zh' | 'en'
        mapStyle?: string
        pitch?: number
        pitchEnable?: boolean
        resizeEnable?: boolean
        rotation?: number
        rotateEnable?: boolean
        scrollWheel?: boolean
        showBuildingBlock?: boolean
        skyColor?: string
        viewMode?: '2D' | '3D'
        zoom: number
        zoomEnable?: boolean
      },
    ) => AMapMap
    MapType: new (options?: {
      defaultType?: number
      position?: string
      showRoad?: boolean
      showTraffic?: boolean
    }) => unknown
    Marker: new (options: {
      label?: {
        content: string
        direction: string
      }
      position: AMapCoordinates
      title?: string
    }) => AMapMarker
    Pixel: new (x: number, y: number) => unknown
    PlaceSearch: new (options?: {
      autoFitView?: boolean
      city?: string
      citylimit?: boolean
      extensions?: 'base' | 'all'
      pageIndex?: number
      pageSize?: number
    }) => AMapPlaceSearch
    Polygon: new (options: {
      bubble?: boolean
      fillColor?: string
      fillOpacity?: number
      path: AMapCoordinates[] | AMapCoordinates[][]
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
    }) => AMapPolygon
    Polyline: new (options: {
      path: AMapCoordinates[]
      showDir?: boolean
      strokeColor: string
      strokeOpacity: number
      strokeWeight: number
    }) => AMapPolyline
    Scale: new (options?: {
      languageCode?: 'zh' | 'en'
      position?: string
    }) => AMapScale
    TileLayer: {
      new (): AMapLayer
      RoadNet: new () => AMapLayer
      Satellite: new () => AMapLayer
    }
    ToolBar: new (options?: { position?: string }) => unknown
    Walking: new (options?: {
      autoFitView?: boolean
      map?: AMapMap | null
      panel?: HTMLElement | null
    }) => AMapRouteService
    Weather: new () => AMapWeather
  }

  interface Window {
    AMap?: AMapNamespace
    _AMapSecurityConfig?: {
      securityJsCode?: string
      serviceHost?: string
    }
    __amapPromise?: Promise<AMapNamespace>
  }
}

export {}
