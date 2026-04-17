import AMapLoader from '@amap/amap-jsapi-loader'

const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE?.trim() ?? ''

export async function loadAMap(key: string): Promise<AMapNamespace> {
  if (window.AMap) {
    return window.AMap
  }

  if (!key) {
    throw new Error('缺少高德地图 Key')
  }

  if (!securityJsCode) {
    throw new Error('缺少高德地图安全密钥 `VITE_AMAP_SECURITY_JS_CODE`')
  }

  if (!window.__amapPromise) {
    window._AMapSecurityConfig = {
      securityJsCode,
    }

    window.__amapPromise = AMapLoader.load({
      key,
      version: '2.0',
      plugins: [
        'AMap.Scale',
        'AMap.ToolBar',
        'AMap.MapType',
        'AMap.ControlBar',
        'AMap.Geolocation',
        'AMap.PlaceSearch',
        'AMap.AutoComplete',
        'AMap.Geocoder',
        'AMap.DistrictSearch',
        'AMap.Walking',
        'AMap.Driving',
        'AMap.Weather',
      ],
    }).then((AMap) => {
      if (!AMap) {
        throw new Error('高德地图加载失败，未返回 AMap 对象')
      }

      return AMap as AMapNamespace
    })
  }

  return window.__amapPromise
}
