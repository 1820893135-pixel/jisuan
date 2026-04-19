import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const amapPlacesSource = readFileSync(new URL('./amapPlaces.ts', import.meta.url), 'utf8')

test('guide and discovery queries preserve a requested prefecture-level city scope', () => {
  assert.match(amapPlacesSource, /const scopeName = cityOrProvince\?\.trim\(\) \|\| meta\.city;/)
  assert.match(amapPlacesSource, /collectProvincePlaces\(scopeName\)/)
  assert.match(amapPlacesSource, /city:\s*scopeName/)
})
