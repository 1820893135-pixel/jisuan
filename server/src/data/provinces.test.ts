import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveProvinceMeta } from './provinces.js'

test('resolveProvinceMeta maps suzhou aliases back to jiangsu province', () => {
  assert.equal(resolveProvinceMeta('苏州').city, '江苏省')
  assert.equal(resolveProvinceMeta('苏州市').city, '江苏省')
  assert.equal(resolveProvinceMeta('江苏苏州').city, '江苏省')
  assert.equal(resolveProvinceMeta('江苏苏州市').city, '江苏省')
})
