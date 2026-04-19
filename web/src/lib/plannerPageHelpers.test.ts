/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'

import { resolvePlannerCity } from './plannerPageHelpers.ts'

test('resolvePlannerCity extracts direct destination aliases instead of keeping a stale previous city', () => {
  const resolvedCity = resolvePlannerCity('去苏州玩3天', '北京市', [
    { capital: '北京', city: '北京市' },
    { capital: '南京', city: '江苏省' },
  ])

  assert.equal(resolvedCity, '苏州')
})
