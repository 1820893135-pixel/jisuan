/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const appSource = readFileSync(resolve(currentDir, 'App.tsx'), 'utf8')
const appLayoutSource = readFileSync(resolve(currentDir, 'components/AppLayout.tsx'), 'utf8')
const authPageSource = readFileSync(resolve(currentDir, 'pages/AuthPage.tsx'), 'utf8')
const appCssSource = readFileSync(resolve(currentDir, 'App.css'), 'utf8')

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

test('top navigation uses the warm unified gold palette', () => {
  assert.match(appCssSource, /\.top-nav\s*\{/)
  assert.match(appCssSource, /background:\s*linear-gradient\(135deg,\s*#fffcf0 0%,\s*#fff8e7 100%\)/)
})

test('register page removes the long persistence subtitle copy', () => {
  assert.doesNotMatch(authPageSource, /注册后就能把路线、收藏和个人偏好长期保留在自己的账号里。/)
})
