/// <reference types="node" />

import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const appSource = readFileSync(resolve(currentDir, 'App.tsx'), 'utf8')
const appLayoutSource = readFileSync(resolve(currentDir, 'components/AppLayout.tsx'), 'utf8')
const authPageSource = readFileSync(resolve(currentDir, 'pages/AuthPage.tsx'), 'utf8')
const travelAppContextSource = readFileSync(resolve(currentDir, 'context/TravelAppContext.tsx'), 'utf8')
const appCssSource = readFileSync(resolve(currentDir, 'App.css'), 'utf8')
const mainSource = readFileSync(resolve(currentDir, 'main.tsx'), 'utf8')
const indexHtmlSource = readFileSync(resolve(currentDir, '..', 'index.html'), 'utf8')
const faviconSource = readFileSync(resolve(currentDir, '..', 'public', 'favicon.svg'), 'utf8')
const manifestPath = resolve(currentDir, '..', 'public', 'manifest.webmanifest')
const manifestSource = existsSync(manifestPath)
  ? readFileSync(manifestPath, 'utf8')
  : ''
const serviceWorkerPath = resolve(currentDir, '..', 'public', 'sw.js')
const serviceWorkerSource = existsSync(serviceWorkerPath)
  ? readFileSync(serviceWorkerPath, 'utf8')
  : ''
const installPromptHookPath = resolve(currentDir, 'hooks', 'usePwaInstallPrompt.ts')
const installPromptHookSource = existsSync(installPromptHookPath)
  ? readFileSync(installPromptHookPath, 'utf8')
  : ''
const faviconIcoPath = resolve(currentDir, '..', 'public', 'favicon.ico')
const pwa44IconPath = resolve(currentDir, '..', 'public', 'pwa-44.png')
const pwa71IconPath = resolve(currentDir, '..', 'public', 'pwa-71.png')
const pwa150IconPath = resolve(currentDir, '..', 'public', 'pwa-150.png')
const pwa192IconPath = resolve(currentDir, '..', 'public', 'pwa-192.png')
const pwa256IconPath = resolve(currentDir, '..', 'public', 'pwa-256.png')
const pwa310IconPath = resolve(currentDir, '..', 'public', 'pwa-310.png')
const pwa512IconPath = resolve(currentDir, '..', 'public', 'pwa-512.png')
const appleTouchIconPath = resolve(currentDir, '..', 'public', 'apple-touch-icon.png')

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

test('top navigation brand mark uses a forbidden city icon instead of the old cloud symbol', () => {
  assert.match(appLayoutSource, /forbiddenCityGrad/)
  assert.doesNotMatch(appLayoutSource, /cloudGrad/)
})

test('browser tab branding uses the new long-form heritage platform title', () => {
  assert.match(indexHtmlSource, /<title>游迹—AI赋能的中国文化遗产导览与智能规划平台<\/title>/)
  assert.match(faviconSource, /aria-label="游迹—AI赋能的中国文化遗产导览与智能规划平台"/)
})

test('app shell declares installable PWA metadata and icon assets', () => {
  assert.match(indexHtmlSource, /rel="icon"\s+href="\/favicon\.ico"\s+sizes="any"/)
  assert.match(indexHtmlSource, /rel="manifest"\s+href="\/manifest\.webmanifest"/)
  assert.match(indexHtmlSource, /name="theme-color"\s+content="#7f1d1d"/)
  assert.match(indexHtmlSource, /rel="apple-touch-icon"\s+href="\/apple-touch-icon\.png"/)

  assert.ok(existsSync(faviconIcoPath), 'expected a Windows favicon.ico asset')
  assert.ok(existsSync(pwa44IconPath), 'expected a 44px Windows app icon asset')
  assert.ok(existsSync(pwa71IconPath), 'expected a 71px small tile icon asset')
  assert.ok(existsSync(pwa150IconPath), 'expected a 150px medium tile icon asset')
  assert.ok(existsSync(pwa192IconPath), 'expected a 192px app icon asset')
  assert.ok(existsSync(pwa256IconPath), 'expected a 256px target-size icon asset')
  assert.ok(existsSync(pwa310IconPath), 'expected a 310px large tile icon asset')
  assert.ok(existsSync(pwa512IconPath), 'expected a 512px app icon asset')
  assert.ok(existsSync(appleTouchIconPath), 'expected an Apple touch icon asset')

  assert.ok(statSync(faviconIcoPath).size > 0, 'Windows favicon.ico should not be empty')
  assert.ok(statSync(pwa44IconPath).size > 0, '44px app icon should not be empty')
  assert.ok(statSync(pwa71IconPath).size > 0, '71px small tile icon should not be empty')
  assert.ok(statSync(pwa150IconPath).size > 0, '150px medium tile icon should not be empty')
  assert.ok(statSync(pwa192IconPath).size > 0, '192px app icon should not be empty')
  assert.ok(statSync(pwa256IconPath).size > 0, '256px target-size icon should not be empty')
  assert.ok(statSync(pwa310IconPath).size > 0, '310px large tile icon should not be empty')
  assert.ok(statSync(pwa512IconPath).size > 0, '512px app icon should not be empty')
  assert.ok(statSync(appleTouchIconPath).size > 0, 'Apple touch icon should not be empty')
})

test('public PWA assets define an installable heritage manifest and offline shell worker', () => {
  assert.match(manifestSource, /"short_name"\s*:\s*"游迹导览"/)
  assert.match(manifestSource, /"start_url"\s*:\s*"\/"/)
  assert.match(manifestSource, /"display"\s*:\s*"standalone"/)
  assert.match(manifestSource, /"theme_color"\s*:\s*"#7f1d1d"/)
  assert.match(manifestSource, /"src"\s*:\s*"\/pwa-44\.png"/)
  assert.match(manifestSource, /"src"\s*:\s*"\/pwa-71\.png"/)
  assert.match(manifestSource, /"src"\s*:\s*"\/pwa-150\.png"/)
  assert.match(manifestSource, /"src"\s*:\s*"\/pwa-256\.png"/)
  assert.match(manifestSource, /"src"\s*:\s*"\/pwa-310\.png"/)
  assert.match(serviceWorkerSource, /self\.addEventListener\('install'/)
  assert.match(serviceWorkerSource, /self\.addEventListener\('fetch'/)
  assert.match(serviceWorkerSource, /manifest\.webmanifest/)
})

test('app shell registers the service worker and exposes an install entry point', () => {
  assert.match(mainSource, /navigator\.serviceWorker\.register\('\/sw\.js'/)
  assert.match(appLayoutSource, /安装应用/)
  assert.match(installPromptHookSource, /beforeinstallprompt/)
  assert.match(installPromptHookSource, /prompt\(\)/)
})

test('register page removes the long persistence subtitle copy', () => {
  assert.doesNotMatch(
    authPageSource,
    /注册后就能把路线、收藏和个人偏好长期保留在自己的账号里。/,
  )
})

test('auth page keeps intro and form inside one shared frame and removes login subtitle copy', () => {
  assert.match(authPageSource, /className="auth-page__frame"/)
  assert.match(appCssSource, /\.auth-page__frame\s*\{/)
  assert.doesNotMatch(
    authPageSource,
    /登录后可同步收藏点位、保存行程偏好，并继续使用文化遗产导览工作台。/,
  )
})

test('travel app context keeps auth effect actions stable', () => {
  assert.match(travelAppContextSource, /const clearError = useCallback\(\(\) => setError\(''\), \[]\)/)
  assert.match(travelAppContextSource, /const refreshAuthCaptcha = useCallback\(async \(\) =>/)
  assert.match(
    travelAppContextSource,
    /const setAuthMode = useCallback\(\(mode: 'login' \| 'register'\) =>/,
  )
})
