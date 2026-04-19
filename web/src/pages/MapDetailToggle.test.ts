/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const mapWorkspaceSource = readFileSync(resolve(currentDir, '../components/MapWorkspace.tsx'), 'utf8')
const appCssSource = readFileSync(resolve(currentDir, '../App.css'), 'utf8')

test('map workspace uses a detail toggle instead of hover-only inspector reveal', () => {
  assert.match(mapWorkspaceSource, /map-inspector-toggle/)
  assert.match(mapWorkspaceSource, /点击查看详情/)
  assert.doesNotMatch(mapWorkspaceSource, /handleWorkspacePointerMove/)
  assert.doesNotMatch(mapWorkspaceSource, /onMouseMove=\{handleWorkspacePointerMove\}/)
})

test('guide markers render numbers directly inside the pin instead of standalone circles', () => {
  assert.match(mapWorkspaceSource, /map-scene-marker__label/)
  assert.match(mapWorkspaceSource, /map-scene-marker__drop/)
  assert.match(mapWorkspaceSource, /content:\s*buildMarkerContent\(/)
  assert.doesNotMatch(mapWorkspaceSource, /map-scene-marker__badge/)
  assert.doesNotMatch(mapWorkspaceSource, /label:\s*\{/)
  assert.doesNotMatch(mapWorkspaceSource, /class="map-pin/)
})

test('guide markers use the blue droplet style for numbered points', () => {
  assert.match(appCssSource, /\.map-scene-marker--guide\s*\{/)
  assert.match(appCssSource, /color:\s*#3b82f6/)
})

test('place detail actions remove the amap jump button and simplify route copy', () => {
  assert.doesNotMatch(mapWorkspaceSource, /打开高德/)
  assert.match(mapWorkspaceSource, /路线详情/)
  assert.doesNotMatch(mapWorkspaceSource, /高德路线详情/)
  assert.doesNotMatch(mapWorkspaceSource, /高德原生路线面板/)
})

test('walking route planning falls back to the city center when the live location is too far away', () => {
  assert.match(mapWorkspaceSource, /function getStraightLineDistanceMeters\(/)
  assert.match(mapWorkspaceSource, /function resolveLiveRouteOrigin\(/)
  assert.match(mapWorkspaceSource, /mode === "walking"/)
  assert.match(mapWorkspaceSource, /distanceToCenter > MAX_WALKING_ROUTE_ORIGIN_DISTANCE_METERS/)
})
