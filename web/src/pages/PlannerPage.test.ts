/// <reference types="node" />

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { TravelAppContext, type TravelAppStore } from '../context/travelAppStore.ts'
import { getCompactPlannerGreeting, sanitizePlannerCopy } from '../lib/plannerCopy.ts'
import { PlannerPage } from './PlannerPage.tsx'

const currentDir = dirname(fileURLToPath(import.meta.url))
const plannerPageSource = readFileSync(resolve(currentDir, 'PlannerPage.tsx'), 'utf8')
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
    guide: {
      center: [120.1551, 30.2741],
      city: '杭州',
      pois: [],
      slogan: '烟雨入城',
      story: '测试导览故事',
      tags: ['文化'],
      travelSeasons: ['春'],
    },
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

test('planner page uses planning-focused assistant copy', () => {
  assert.match(plannerPageSource, /文脉行程师/)
  assert.match(plannerPageSource, /当前规划/)
  assert.match(plannerPageSource, /历史规划/)
  assert.doesNotMatch(plannerPageSource, /智能行程/)
  assert.doesNotMatch(plannerPageSource, /智能规划助手/)

  assert.doesNotMatch(plannerPageSource, /我帮你规划/)
  assert.doesNotMatch(plannerPageSource, /像聊天一样把需求告诉我/)
  assert.doesNotMatch(plannerPageSource, /越像真实聊天越好/)
  assert.doesNotMatch(plannerPageSource, /带记忆的路线助手/)
  assert.doesNotMatch(plannerPageSource, /当前记忆/)
  assert.doesNotMatch(plannerPageSource, /历史记忆/)
})

test('planner page styles define a warm about-inspired surface', () => {
  assert.match(appCssSource, /\.planner-chat-page\s*\{/)
  assert.match(appCssSource, /\.planner-page__hero\s*\{/)
  assert.match(appCssSource, /radial-gradient\(circle at 50% 18%/)
  assert.match(appCssSource, /\.planner-chat-card,\s*\n\.planner-memory-card/)
})

test('planner day badge is large enough to fit full Day labels', () => {
  const dayBadgeBlock = appCssSource.match(/\.planner-route-node span\s*\{[\s\S]*?\n\}/)

  assert.ok(dayBadgeBlock, 'expected planner route node badge styles to exist')
  assert.match(dayBadgeBlock[0], /min-width:\s*3\.2rem/)
  assert.match(dayBadgeBlock[0], /min-height:\s*3\.2rem/)
  assert.match(dayBadgeBlock[0], /padding:\s*0\.35rem/)
})

test('planner page removes the route metrics summary tiles', () => {
  assert.doesNotMatch(plannerPageSource, /planner-route-summary/)
  assert.doesNotMatch(plannerPageSource, /路线长度/)
  assert.doesNotMatch(plannerPageSource, /预计时长/)
  assert.doesNotMatch(plannerPageSource, /路线节点/)
})

test('planner timeline keeps scenic images inside each stop card', () => {
  assert.match(plannerPageSource, /planner-timeline__media/)
  assert.match(plannerPageSource, /planner-timeline__body/)
  assert.match(appCssSource, /\.planner-timeline__media\s*\{/)
  assert.match(appCssSource, /\.planner-timeline__body\s*\{/)
  assert.match(appCssSource, /overflow:\s*hidden/)
})

test('planner timeline omits per-stop cost labels', () => {
  assert.doesNotMatch(plannerPageSource, /stop\.cost/)
  assert.doesNotMatch(plannerPageSource, /Sparkles/)
})

test('planner history panel hides the auto-save status copy', () => {
  assert.doesNotMatch(plannerPageSource, /最近\s*8\s*次/)
  assert.doesNotMatch(plannerPageSource, /不限保存次数/)
  assert.doesNotMatch(plannerPageSource, /自动保存/)
})

test('planner city resolution recognizes province aliases from user input', async () => {
  const plannerPageHelpersModule = await import('../lib/plannerPageHelpers.ts')

  assert.equal(typeof plannerPageHelpersModule.resolvePlannerCity, 'function')

  const resolvedCity = plannerPageHelpersModule.resolvePlannerCity('去山西玩三天', '辽宁省', [
    { capital: '沈阳', city: '辽宁省' },
    { capital: '太原', city: '山西省' },
    { capital: '北京', city: '北京市' },
  ])

  assert.equal(resolvedCity, '山西省')
})

test('planner greeting stays compact and planner copy hides map vendor mentions', () => {
  const greeting = getCompactPlannerGreeting(
    {
      budget: '2000-3000',
      city: '北京市',
      days: 2,
      interests: ['历史古迹'],
      note: '',
      style: '沉浸文化',
    },
    3,
  )

  assert.match(greeting, /先按 北京市 2 天、2000-3000、沉浸文化 继续/)
  assert.doesNotMatch(greeting, /我记得你最近在看/)
  assert.ok(greeting.length < 60)

  const sanitized = sanitizePlannerCopy(
    '高德路线摘要显示所选核心点位驾车串联约17.7公里、约59分钟；因此将行程拆成两天完成，并参考高德地图节奏减少折返。',
  )

  assert.equal(
    sanitized,
    '路线摘要显示所选核心点位驾车串联约17.7公里、约59分钟；因此将行程拆成两天完成，并参考路线节奏减少折返。',
  )
})

test('planner page asks guests to log in before showing saved itinerary data', () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      TravelAppContext.Provider,
      {
        value: createMockStore({
          itinerary: {
            dailyPlan: [
              {
                day: 1,
                stops: [
                  {
                    activity: '旧数据里的行程安排',
                    cost: '0',
                    name: '旧数据景点',
                    time: '09:00',
                    transport: '步行',
                  },
                ],
                summary: '旧数据摘要',
                theme: '旧数据主题',
              },
            ],
            overview: '旧数据概览',
            routeReason: '旧数据路线原因',
            tips: [],
            title: '旧数据行程标题',
          },
          itineraryHistory: [
            {
              createdAt: '2026-04-18T08:00:00.000Z',
              form: {
                budget: '2000-3000',
                city: '杭州',
                days: 2,
                interests: ['历史古迹'],
                note: '',
                style: '沉浸文化',
              },
              guide: {
                center: [120.1551, 30.2741],
                city: '杭州',
                pois: [],
                slogan: '烟雨入城',
                story: '测试导览故事',
                tags: ['文化'],
                travelSeasons: ['春'],
              },
              id: 'history-1',
              itinerary: {
                dailyPlan: [],
                overview: '旧历史概览',
                routeReason: '旧历史路线原因',
                tips: [],
                title: '旧历史方案',
              },
            },
          ],
          user: null,
        }),
      },
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(PlannerPage),
      ),
    ),
  )

  assert.match(markup, /请先登录或注册/)
  assert.doesNotMatch(markup, /旧数据行程标题/)
  assert.doesNotMatch(markup, /旧历史方案/)
})
