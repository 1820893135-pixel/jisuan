import type { PlannerForm } from '../types'

export function getCompactPlannerGreeting(form: PlannerForm, historyCount: number) {
  if (historyCount > 0) {
    return `先按 ${form.city} ${form.days} 天、${form.budget}、${form.style} 继续。告诉我想去哪、玩几天、预算和重点，我来整理路线。`
  }

  return '告诉我目的地、天数、预算和重点，我来整理路线。'
}

export function isLegacyPlannerGreeting(text: string) {
  return /我记得你最近在看|想去哪、玩几天、预算多少、重点想看什么/.test(text)
}

export function sanitizePlannerCopy(text: string) {
  return text
    .replace(/高德路线摘要/g, '路线摘要')
    .replace(/高德地图/g, '地图')
    .replace(/高德路线/g, '路线')
    .replace(/高德导航/g, '导航')
    .replace(/高德/g, '')
    .replace(/AMap/gi, '')
    .replace(/\bPOI\b/gi, '景点')
    .replace(/地图节奏/g, '路线节奏')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
