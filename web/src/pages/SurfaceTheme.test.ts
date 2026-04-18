/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const profilePageSource = readFileSync(resolve(currentDir, 'ProfilePage.tsx'), 'utf8')
const explorePageSource = readFileSync(resolve(currentDir, 'ExplorePage.tsx'), 'utf8')
const homePageSource = readFileSync(resolve(currentDir, 'HomePage.tsx'), 'utf8')
const mapWorkspaceSource = readFileSync(resolve(currentDir, '../components/MapWorkspace.tsx'), 'utf8')
const appCssSource = readFileSync(resolve(currentDir, '../App.css'), 'utf8')

test('profile page removes the old memory-entry summary copy', () => {
  assert.doesNotMatch(profilePageSource, /璁板繂寮忓瑙?/)
})

test('profile page removes the top summary stat cards from the hero section', () => {
  assert.doesNotMatch(profilePageSource, /profile-overview/)
  assert.doesNotMatch(profilePageSource, /profile-stat-card/)
  assert.doesNotMatch(profilePageSource, /账号状态/)
})

test('map workspace removes the place switcher from the visible surface', () => {
  assert.match(appCssSource, /\.map-place-switcher\s*\{\s*display:\s*none;/)
})

test('explore page keeps route controls, view toggles, and weather in one header rail', () => {
  assert.match(explorePageSource, /map-mode-switch--workspace/)
  assert.match(explorePageSource, /map-view-switch-inline/)
  assert.match(explorePageSource, /map-weather-inline/)
  assert.match(appCssSource, /\.map-weather-inline\s*\{/)
  assert.match(appCssSource, /\.map-view-switch-inline\s*\{/)
})

test('map workspace no longer renders a separate stage weather row', () => {
  assert.doesNotMatch(mapWorkspaceSource, /map-weather-card__line/)
  assert.doesNotMatch(mapWorkspaceSource, /map-weather-card map-weather-card--inline/)
})

test('map workspace removes verbose gaode helper copy and the city featured header', () => {
  assert.doesNotMatch(
    mapWorkspaceSource,
    /鍦ㄧ湡瀹為珮寰峰湴鍥句笂妫€绱㈠湴鏍囥€佽ˉ鍏呭懆杈圭嚎绱紝骞朵粠褰撳墠瑙嗚鐩存帴鍙戣捣瀵艰埅銆?/
  )
  assert.doesNotMatch(mapWorkspaceSource, /楂樺痉鍦板浘宸茶繛鎺?/)
  assert.doesNotMatch(mapWorkspaceSource, /楂樺痉宸茶ˉ鍏?/)
  assert.doesNotMatch(mapWorkspaceSource, /鍩庡競绮鹃€?/)
  assert.doesNotMatch(mapWorkspaceSource, /map-results-card__context/)
})

test('map workspace keeps the floating map bubble compact with only the place name', () => {
  assert.match(
    mapWorkspaceSource,
    /<div class="amap-bubble"><strong>\$\{selectedPlace\.name\}<\/strong><\/div>/
  )
  assert.doesNotMatch(
    mapWorkspaceSource,
    /<div class="amap-bubble"><strong>\$\{selectedPlace\.name\}<\/strong><span>/
  )
  assert.match(appCssSource, /\.amap-bubble\s*\{/)
  assert.match(appCssSource, /\.amap-bubble strong\s*\{/)
})

test('warm surface theme styles are defined for profile, home hot spots, and map workspace', () => {
  assert.match(appCssSource, /\.profile-page\s*\{/)
  assert.match(appCssSource, /\.profile-hero\s*\{/)
  assert.match(appCssSource, /\.home-page\s+\.heritage-card\s*\{/)
  assert.match(appCssSource, /\.map-shell--workspace-layout\s+\.map-shell__dock\s*\{/)
  assert.match(appCssSource, /\.map-mode-switch--workspace\s*\{/)
  assert.match(appCssSource, /\.map-weather-inline\s*\{/)
})

test('home page still renders the hot attractions section', () => {
  assert.match(homePageSource, /热门景点/)
})
