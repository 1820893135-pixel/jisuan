/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const appSource = readFileSync(resolve(currentDir, 'App.tsx'), 'utf8')
const appLayoutSource = readFileSync(resolve(currentDir, 'components/AppLayout.tsx'), 'utf8')

test('app routes include dedicated auth pages instead of modal-only auth', () => {
  assert.match(appSource, /path="\/auth\/:mode"/)
  assert.doesNotMatch(appLayoutSource, /<AuthDialog\s*\/>/)
})

test('top navigation auth entry points link to standalone auth routes', () => {
  assert.match(appLayoutSource, /to="\/auth\/login"/)
  assert.match(appLayoutSource, /to="\/auth\/register"/)
  assert.doesNotMatch(appLayoutSource, /openAuthDialog\('login'\)/)
  assert.doesNotMatch(appLayoutSource, /openAuthDialog\('register'\)/)
})
