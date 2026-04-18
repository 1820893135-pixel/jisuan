/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TravelAppContext, type TravelAppStore } from '../context/travelAppStore'
import { ProfilePage } from './ProfilePage'

const currentDir = dirname(fileURLToPath(import.meta.url))
const profilePageSource = readFileSync(resolve(currentDir, 'ProfilePage.tsx'), 'utf8')
const appCssSource = readFileSync(resolve(currentDir, '../App.css'), 'utf8')

Object.assign(globalThis, { React })

function createMockStore(overrides: Partial<TravelAppStore> = {}): TravelAppStore {
  return {
    amapKey: '',
    authBusy: false,
    authCaptcha: null,
    authCaptchaLoading: false,
    authDialogOpen: false,
    authForm: {
      captchaCode: '',
      captchaId: '',
      confirmPassword: '',
      password: '',
      username: '',
    },
    authMode: 'login',
    budgetOptions: [],
    cities: [],
    cityOptions: [],
    clearError: () => {},
    closeAuthDialog: () => {},
    error: '',
    favoriteBusyPoiId: null,
    favoritePoiIds: new Set(),
    favorites: [],
    form: {
      budget: '2000-3000',
      city: '杭州',
      days: 2,
      interests: ['历史古迹'],
      note: '',
      style: '沉浸文化',
    },
    guide: null,
    handleAuthSubmit: async () => {},
    handleGeneratePlan: async () => null,
    handleLogout: () => {},
    handlePlanRoute: async () => {},
    handleProfilePasswordUpdate: async () => {},
    handleProfileUsernameUpdate: async () => ({
      createdAt: '2026-04-18T08:00:00.000Z',
      id: 'user-1',
      username: 'traveler',
    }),
    handleRemoveFavorite: async () => {},
    handleToggleFavorite: async () => {},
    health: null,
    interestOptions: [],
    itinerary: null,
    itineraryHistory: [],
    loadingGuide: false,
    openAuthDialog: () => {},
    planning: false,
    planSource: 'fallback-template',
    refreshAuthCaptcha: async () => {},
    refreshGuide: async () => {},
    restoreItineraryHistory: () => {},
    routeError: '',
    routeLoading: false,
    routeMode: 'walking',
    routePlan: null,
    selectCity: async () => {},
    setAuthField: () => {},
    setAuthMode: () => {},
    setRouteMode: () => {},
    styleOptions: [],
    toggleInterest: () => {},
    updateForm: () => {},
    user: {
      createdAt: '2026-04-18T08:00:00.000Z',
      id: 'user-1',
      username: 'traveler',
    },
    ...overrides,
  }
}

test('profile page renders an account settings section for signed-in users', () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      TravelAppContext.Provider,
      { value: createMockStore() },
      React.createElement(ProfilePage),
    ),
  )

  assert.match(markup, /账号设置/)
  assert.match(markup, /修改用户名/)
  assert.match(markup, /修改密码/)
  assert.match(markup, /当前用户名/)
  assert.match(markup, /当前密码/)
})

test('profile page defines dedicated account settings layout styles', () => {
  assert.match(profilePageSource, /profile-settings-grid/)
  assert.match(profilePageSource, /profile-settings-card/)
  assert.match(appCssSource, /\.profile-settings-grid\s*\{/)
  assert.match(appCssSource, /\.profile-settings-card\s*\{/)
})
