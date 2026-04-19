/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'

test('planner conversation helpers build typed thinking copy and summary cards', async () => {
  const plannerConversation = await import('./plannerConversation.ts')

  const result = {
    form: {
      budget: '2000-3000',
      city: '云南',
      days: 3,
      interests: ['古迹', '非遗'],
      note: '想慢一点',
      style: '沉浸文化',
    },
    guide: {
      center: [102.7123, 25.0406] as [number, number],
      city: '云南',
      pois: [],
      slogan: '风物相逢',
      story: '测试故事',
      tags: ['文化'],
      travelSeasons: ['春'],
    },
    itinerary: {
      dailyPlan: [
        {
          day: 1,
          summary: '首日摘要',
          theme: '古城线',
          stops: [
            { activity: '看古城', cost: '0', name: '大理古城', time: '09:00', transport: '步行' },
            { activity: '看三塔', cost: '0', name: '崇圣寺三塔', time: '13:00', transport: '驾车' },
          ],
        },
      ],
      overview: '概览',
      routeReason: '原因',
      tips: [],
      title: '云南三日导览',
    },
    source: 'langchain-openai-tools',
  }

  const thinking = plannerConversation.buildPlannerThinkingStream(result)
  const reply = plannerConversation.buildPlannerReplyMessage(result)
  const card = plannerConversation.buildPlannerSummaryCard(result, 'planner-itinerary-anchor')

  assert.match(thinking, /云南/)
  assert.match(thinking, /3天/)
  assert.match(thinking, /大理古城/)
  assert.match(reply, /行程建议：/)
  assert.match(reply, /点下面这张行程卡/)
  assert.equal(card.targetId, 'planner-itinerary-anchor')
  assert.equal(card.city, '云南')
  assert.equal(card.days, 3)
  assert.deepEqual(card.stops, ['大理古城', '崇圣寺三塔'])
})
