/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const mapWorkspaceSource = readFileSync(resolve(currentDir, '../components/MapWorkspace.tsx'), 'utf8')

test('map workspace uses a detail toggle instead of hover-only inspector reveal', () => {
  assert.match(mapWorkspaceSource, /map-inspector-toggle/)
  assert.match(mapWorkspaceSource, /点击查看详情/)
  assert.doesNotMatch(mapWorkspaceSource, /handleWorkspacePointerMove/)
  assert.doesNotMatch(mapWorkspaceSource, /onMouseMove=\{handleWorkspacePointerMove\}/)
})

test('guide markers render numbers directly inside the pin instead of standalone circles', () => {
  assert.match(mapWorkspaceSource, /map-scene-marker__label/)
  assert.match(mapWorkspaceSource, /map-scene-marker__drop/)
  assert.doesNotMatch(mapWorkspaceSource, /map-scene-marker__badge/)
  assert.doesNotMatch(mapWorkspaceSource, /class="map-pin/)
})
