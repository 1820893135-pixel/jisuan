import { sanitizePlannerCopy } from './plannerCopy.ts'
import type { PlannerGenerationResult, PlannerSummaryCard } from '../types'

function getLeadStops(result: PlannerGenerationResult) {
  return result.itinerary.dailyPlan
    .flatMap((day) => day.stops.map((stop) => sanitizePlannerCopy(stop.name)))
    .filter(Boolean)
    .filter((name, index, list) => list.indexOf(name) === index)
    .slice(0, 4)
}

export function buildPlannerThinkingPrelude(result: PlannerGenerationResult) {
  const interestLabel =
    result.form.interests.length > 0
      ? `${result.form.interests.slice(0, 3).join('、')}这些偏好`
      : '你的旅行偏好'

  return sanitizePlannerCopy(
    `先按${result.form.city}${result.form.days}天的节奏收束需求，重点保留${interestLabel}，再把路线密度压到舒适范围里。`,
  )
}

export function buildPlannerThinkingStream(result: PlannerGenerationResult) {
  const leadStops = getLeadStops(result)
  const stopLabel =
    leadStops.length > 0
      ? `第一段主线先放入${leadStops.join('、')}，尽量减少来回折返。`
      : '先把每天的停留顺序理顺，保证节奏不会太赶。'
  const noteLabel = result.form.note
    ? `你补充的“${sanitizePlannerCopy(result.form.note)}”我也一起纳入了安排。`
    : ''

  return sanitizePlannerCopy(
    `${buildPlannerThinkingPrelude(result)}${stopLabel}${noteLabel}`,
  )
}

export function buildPlannerReplyMessage(result: PlannerGenerationResult) {
  const firstDay = result.itinerary.dailyPlan[0]
  const firstStops =
    firstDay?.stops
      .map((stop) => sanitizePlannerCopy(stop.name))
      .filter(Boolean)
      .slice(0, 4)
      .join('、') ?? '我已经先把主线顺序压好了'

  return sanitizePlannerCopy(
    [
      buildPlannerThinkingStream(result),
      `行程建议：${sanitizePlannerCopy(result.itinerary.overview)}`,
      `落地安排：第1天先走${sanitizePlannerCopy(firstDay?.theme ?? '城市主线')}，重点看${firstStops}。点下面这张行程卡，就能直接跳到下方正文查看完整路线。`,
    ].join('\n\n'),
  )
}

export function buildPlannerSummaryCard(
  result: PlannerGenerationResult,
  targetId: string,
): PlannerSummaryCard {
  const requestParts = [
    result.form.city,
    `${result.form.days}天`,
    result.form.style,
    result.form.budget,
    ...result.form.interests.slice(0, 2),
  ].filter(Boolean)

  return {
    budget: sanitizePlannerCopy(result.form.budget),
    city: sanitizePlannerCopy(result.form.city),
    days: result.form.days,
    interests: result.form.interests.map((interest) =>
      sanitizePlannerCopy(interest),
    ),
    note: sanitizePlannerCopy(result.form.note),
    requestSummary: sanitizePlannerCopy(requestParts.join(' · ')),
    stops: getLeadStops(result),
    style: sanitizePlannerCopy(result.form.style),
    targetId,
    title: sanitizePlannerCopy(`${result.form.city}${result.form.days}天行程概览`),
  }
}
