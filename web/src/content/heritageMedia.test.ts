/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'

import { getItineraryStopMedia, getPoiMedia } from './heritageMedia'

test('getPoiMedia prefers the poi provided image when available', () => {
  const preferredImageSrc = 'https://example.com/fujian-tulou.jpg'
  const media = getPoiMedia('fj-tulou', 0, preferredImageSrc, '福建土楼')

  assert.equal(media.src, preferredImageSrc)
  assert.equal(media.alt, '福建土楼')
})

test('getItineraryStopMedia uses guide poi images before fallback pools', () => {
  const media = getItineraryStopMedia('山西古建筑博物馆', '山西省', 0, [
    {
      id: 'sx-architecture-museum',
      imageSrc: 'https://example.com/shanxi-museum.jpg',
      name: '山西古建筑博物馆',
    },
  ])

  assert.equal(media.src, 'https://example.com/shanxi-museum.jpg')
  assert.equal(media.alt, '山西古建筑博物馆')
})

test('getItineraryStopMedia matches known heritage imagery for itinerary stops', () => {
  const media = getItineraryStopMedia('云冈石窟', '山西省', 0)

  assert.equal(media.src, '/images/heritage/yungang.jpg')
  assert.equal(media.alt, '云冈石窟')
})

test('getItineraryStopMedia falls back to city-level imagery when the stop is unmatched', () => {
  const media = getItineraryStopMedia('迎泽公园', '山西省', 1)

  assert.equal(media.src, '/images/heritage/pingyao.jpg')
  assert.equal(media.alt, '山西文化遗产景致')
})
