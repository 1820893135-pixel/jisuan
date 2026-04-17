export interface HomeHeroSlide {
  alt: string
  caption: string
  id: string
  kicker: string
  sourceLabel: string
  sourceUrl: string
  src: string
  summary: string
  title: string
}

const homeHeroSlides: HomeHeroSlide[] = [
  {
    id: 'west-lake',
    title: '西湖暮色',
    kicker: '江南水岸',
    summary:
      '从湖山、园林到古街灯火，把中国文化遗产的城市气质先铺开，再一站一站慢慢进入。',
    caption: '杭州西湖的湖面层次和远山线条，很适合作为导览首页的开场画面。',
    alt: '杭州西湖傍晚湖景',
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/West%20Lake%2062995-Hangzhou%20%2849152804977%29.jpg?width=2200',
    sourceLabel: 'Wikimedia Commons',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:West_Lake_62995-Hangzhou_(49152804977).jpg',
  },
  {
    id: 'potala',
    title: '布达拉宫',
    kicker: '高原遗产',
    summary:
      '高原遗产、宗教建筑和城市天际线交织在一起，适合承接全国视角下更开阔的文化导览。',
    caption: '把高原空间感拉进首页，能让整站不只停留在单一城市的印象里。',
    alt: '西藏布达拉宫',
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Potala%20Palace,%20Tibet%20%2838938132080%29.jpg?width=2200',
    sourceLabel: 'Wikimedia Commons',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Potala_Palace,_Tibet_(38938132080).jpg',
  },
  {
    id: 'great-wall',
    title: '慕田峪长城',
    kicker: '山脊古迹',
    summary:
      '长城适合做文化遗产入口页的第二层气质，让用户一眼就知道这不是普通旅游站，而是导览站。',
    caption: '用横向山脊和城墙线条做轮播图，滑动时视觉节奏会更强。',
    alt: '慕田峪长城全景',
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pano%20mutianyu%20great%20wall.jpg?width=2200',
    sourceLabel: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pano_mutianyu_great_wall.jpg',
  },
  {
    id: 'temple-of-heaven',
    title: '天坛',
    kicker: '礼制建筑',
    summary:
      '礼制建筑、城市轴线和花园前景组合起来，会让首页既有文化感，也不会过分沉重。',
    caption: '适合放在轮播尾帧，收住前面几张更强烈的风景和高原画面。',
    alt: '北京天坛',
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Temple%20of%20Heaven%20%2854391733019%29.jpg?width=2200',
    sourceLabel: 'Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Temple_of_Heaven_(54391733019).jpg',
  },
]

const cityHeroMedia: Record<string, { alt: string; src: string }> = {
  杭州: {
    alt: '杭州西湖与远山',
    src: 'https://images.unsplash.com/photo-1743038946652-8d85828291f1?auto=format&fit=crop&w=1600&q=80',
  },
  西安: {
    alt: '西安古城建筑与遗产氛围',
    src: 'https://images.unsplash.com/photo-1648726444582-6d108b5d13dc?auto=format&fit=crop&w=1600&q=80',
  },
  成都: {
    alt: '成都传统街区与灯影',
    src: 'https://images.unsplash.com/photo-1739538752106-1d46747504a7?auto=format&fit=crop&w=1600&q=80',
  },
}

const poiMedia: Record<string, { alt: string; src: string }> = {
  'hz-west-lake': {
    alt: '杭州西湖',
    src: 'https://images.unsplash.com/photo-1743038946652-8d85828291f1?auto=format&fit=crop&w=1200&q=80',
  },
  'hz-linyin': {
    alt: '传统寺院屋檐',
    src: 'https://images.unsplash.com/photo-1743577828378-e39fa7f2c1ef?auto=format&fit=crop&w=1200&q=80',
  },
  'hz-hefang': {
    alt: '传统街巷',
    src: 'https://images.unsplash.com/photo-1739538752106-1d46747504a7?auto=format&fit=crop&w=1200&q=80',
  },
  'hz-liangzhu': {
    alt: '良渚遗址风貌',
    src: 'https://images.unsplash.com/photo-1761160781452-77b984fe94e0?auto=format&fit=crop&w=1200&q=80',
  },
  'xa-terra-cotta': {
    alt: '兵马俑',
    src: 'https://images.unsplash.com/photo-1648726444582-6d108b5d13dc?auto=format&fit=crop&w=1200&q=80',
  },
  'xa-wall': {
    alt: '中国古城墙',
    src: 'https://images.unsplash.com/photo-1555085634-265dff003dc5?auto=format&fit=crop&w=1200&q=80',
  },
  'xa-muslim': {
    alt: '传统街区',
    src: 'https://images.unsplash.com/photo-1739538752106-1d46747504a7?auto=format&fit=crop&w=1200&q=80',
  },
  'xa-dayanta': {
    alt: '大雁塔与寺院建筑',
    src: 'https://images.unsplash.com/photo-1674637966612-6c05d18e7bab?auto=format&fit=crop&w=1200&q=80',
  },
  'cd-panda': {
    alt: '成都园林景观',
    src: 'https://images.unsplash.com/photo-1610712836144-e855545f6bef?auto=format&fit=crop&w=1200&q=80',
  },
  'cd-kuanzhai': {
    alt: '宽窄巷子街景',
    src: 'https://images.unsplash.com/photo-1739538752106-1d46747504a7?auto=format&fit=crop&w=1200&q=80',
  },
  'cd-jinli': {
    alt: '传统商业街',
    src: 'https://images.unsplash.com/photo-1739538752106-1d46747504a7?auto=format&fit=crop&w=1200&q=80',
  },
  'cd-wuhou': {
    alt: '中国古建红墙',
    src: 'https://images.unsplash.com/photo-1743577828378-e39fa7f2c1ef?auto=format&fit=crop&w=1200&q=80',
  },
}

const fallbackPool = [
  'https://images.unsplash.com/photo-1761160781452-77b984fe94e0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555085634-265dff003dc5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1743577828378-e39fa7f2c1ef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1739538752106-1d46747504a7?auto=format&fit=crop&w=1200&q=80',
]

export function getHomeHeroSlides() {
  return homeHeroSlides
}

export function getCityHero(city?: string) {
  if (!city) {
    return cityHeroMedia.杭州
  }

  return cityHeroMedia[city] ?? cityHeroMedia.杭州
}

export function getPoiMedia(poiId: string, index = 0) {
  return (
    poiMedia[poiId] ?? {
      alt: '中国文化遗产景点',
      src: fallbackPool[index % fallbackPool.length],
    }
  )
}
