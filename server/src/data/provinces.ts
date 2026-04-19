import type { CitySummary, Coordinates } from "../types.js";

export interface ProvinceMeta {
  adcode: string;
  capital: string;
  center: Coordinates;
  city: string;
  narrative: string;
  region: string;
  slogan: string;
  tags: string[];
  travelSeasons: string[];
}

function coordinates(lng: number, lat: number): Coordinates {
  return [lng, lat];
}

const provinceCatalog: ProvinceMeta[] = [
  {
    adcode: "110000",
    capital: "北京",
    center: coordinates(116.4074, 39.9042),
    city: "北京市",
    narrative: "以中轴线、皇家建筑群和当代博物馆带为主，适合从国家叙事切入文化遗产导览。",
    region: "华北",
    slogan: "皇城轴线与国家博物馆群交织，是全国文化地标最集中的入口之一。",
    tags: ["世界遗产", "博物馆", "中轴线"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "120000",
    capital: "天津",
    center: coordinates(117.2000, 39.0842),
    city: "天津市",
    narrative: "近代租界、海河夜景与曲艺茶馆可以自然串成一条城市文化观察线。",
    region: "华北",
    slogan: "海河、租界和曲艺空间，让天津更适合做近代城市文化导览。",
    tags: ["近代建筑", "海河", "曲艺"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "130000",
    capital: "石家庄",
    center: coordinates(114.5149, 38.0428),
    city: "河北省",
    narrative: "长城、古城与燕赵遗迹分布广，适合先从省会文化节点进入，再向区域经典扩展。",
    region: "华北",
    slogan: "燕赵大地兼具长城、古城和皇家园林，是北方文化遗产的重要拼图。",
    tags: ["长城", "古城", "皇家园林"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "140000",
    capital: "太原",
    center: coordinates(112.5492, 37.8570),
    city: "山西省",
    narrative: "古建密度极高，适合把寺观、壁画、晋商遗迹和城镇肌理做成深度路线。",
    region: "华北",
    slogan: "古建、壁画与晋商大院高度集中，很适合做厚重的历史导览。",
    tags: ["古建筑", "壁画", "晋商"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "150000",
    capital: "呼和浩特",
    center: coordinates(111.7492, 40.8426),
    city: "内蒙古自治区",
    narrative: "草原、博物馆和民族文化场所并置，更适合做空间尺度更大的省域导览。",
    region: "华北",
    slogan: "草原地貌和北疆民族文化并行，导览视角更强调区域气质与地理尺度。",
    tags: ["草原", "民族文化", "博物馆"],
    travelSeasons: ["夏季", "秋季"],
  },
  {
    adcode: "210000",
    capital: "沈阳",
    center: coordinates(123.4315, 41.8057),
    city: "辽宁省",
    narrative: "清代盛京遗迹、工业记忆和滨海城市文化可以构成更有层次的东北导览入口。",
    region: "东北",
    slogan: "盛京旧迹与工业城市记忆并存，适合做东北历史转场式导览。",
    tags: ["盛京", "工业遗产", "滨海"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "220000",
    capital: "长春",
    center: coordinates(125.3245, 43.8868),
    city: "吉林省",
    narrative: "近代城市街区、电影文化与山水风景组合后，能形成更鲜明的东北城市叙事。",
    region: "东北",
    slogan: "电影、近代街区与长白山系让吉林兼具城市和自然两种导览节奏。",
    tags: ["长白山", "电影", "近代街区"],
    travelSeasons: ["夏季", "秋季"],
  },
  {
    adcode: "230000",
    capital: "哈尔滨",
    center: coordinates(126.6424, 45.7560),
    city: "黑龙江省",
    narrative: "欧陆风貌、边境城市文化与冰雪场景并置，适合做风格感很强的地图导览。",
    region: "东北",
    slogan: "欧陆街区、边境风情和冰雪城市气质，让黑龙江更有识别度。",
    tags: ["欧陆建筑", "冰雪", "边境文化"],
    travelSeasons: ["冬季", "夏季"],
  },
  {
    adcode: "310000",
    capital: "上海",
    center: coordinates(121.4737, 31.2304),
    city: "上海市",
    narrative: "近代城市更新、海派文化和博物馆网络适合构成密度很高的都会导览。",
    region: "华东",
    slogan: "海派街区、工业更新与高密度博物馆网络构成上海式城市导览。",
    tags: ["海派文化", "近代建筑", "都会更新"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "320000",
    capital: "南京",
    center: coordinates(118.7969, 32.0603),
    city: "江苏省",
    narrative: "江南园林、运河古镇和近代城市记忆都很强，适合做多支线组合导览。",
    region: "华东",
    slogan: "园林、古镇和近代城市遗迹并重，江苏适合做层次丰富的省域线路。",
    tags: ["园林", "运河", "近代建筑"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "330000",
    capital: "杭州",
    center: coordinates(120.1536, 30.2655),
    city: "浙江省",
    narrative: "西湖、运河、茶山与古镇组合自然，适合做文化体验和地图导览兼顾的省域入口。",
    region: "华东",
    slogan: "从西湖到古镇再到茶山，浙江很适合做轻盈却完整的文化导览。",
    tags: ["湖山", "古镇", "茶文化"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "340000",
    capital: "合肥",
    center: coordinates(117.2272, 31.8206),
    city: "安徽省",
    narrative: "徽州古村落、书院和山岳景观足以串起一条辨识度很高的文化遗产线。",
    region: "华东",
    slogan: "徽派村落和名山古迹密集，是最适合做古村落主题导览的地区之一。",
    tags: ["徽州", "古村", "名山"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "350000",
    capital: "福州",
    center: coordinates(119.2965, 26.0745),
    city: "福建省",
    narrative: "海洋文化、闽南古厝和世界遗产土楼并置，适合做海陆交织的省域导览。",
    region: "华东",
    slogan: "土楼、古厝与海港文化共同构成福建的空间层次。",
    tags: ["土楼", "海洋文化", "古厝"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "360000",
    capital: "南昌",
    center: coordinates(115.8582, 28.6829),
    city: "江西省",
    narrative: "书院传统、红色遗址与山水名胜结合后，更适合做文化深度与公共叙事并行的导览。",
    region: "华东",
    slogan: "书院、名山和红色遗址并行，是兼具古典与近现代叙事的省份。",
    tags: ["书院", "名山", "红色文化"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "370000",
    capital: "济南",
    center: coordinates(117.1201, 36.6512),
    city: "山东省",
    narrative: "齐鲁文化、海岱名胜和儒家遗迹适合做主题非常明确的文化主线。",
    region: "华东",
    slogan: "儒家遗址与海岱风景并重，山东很适合做传统文化主轴导览。",
    tags: ["齐鲁文化", "孔孟", "海滨"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "410000",
    capital: "郑州",
    center: coordinates(113.6254, 34.7466),
    city: "河南省",
    narrative: "中原古都群、博物馆和佛教石窟资源丰富，适合做历史时间轴式导览。",
    region: "华中",
    slogan: "中原文明厚度极强，古都、石窟和博物馆可以自然连成一线。",
    tags: ["中原文明", "石窟", "古都"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "420000",
    capital: "武汉",
    center: coordinates(114.3054, 30.5931),
    city: "湖北省",
    narrative: "长江文化、楚地历史和近代城市记忆都很适合放进地图叙事里。",
    region: "华中",
    slogan: "楚文化与江城空间并置，湖北适合做大水系文化导览。",
    tags: ["楚文化", "长江", "近代城市"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "430000",
    capital: "长沙",
    center: coordinates(112.9388, 28.2282),
    city: "湖南省",
    narrative: "岳麓书院、近代革命遗址与山水风景可以构成更有情绪起伏的路线。",
    region: "华中",
    slogan: "书院传统、红色记忆和山水名胜结合后，很适合做叙事型导览。",
    tags: ["书院", "山水", "近代史"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "440000",
    capital: "广州",
    center: coordinates(113.2644, 23.1291),
    city: "广东省",
    narrative: "岭南古建、骑楼街区和海上贸易遗迹适合做生活感与文化感并重的路线。",
    region: "华南",
    slogan: "骑楼、粤剧和海贸记忆叠在一起，广东更像可日常进入的文化地图。",
    tags: ["岭南", "骑楼", "海贸"],
    travelSeasons: ["秋季", "冬季"],
  },
  {
    adcode: "450000",
    capital: "南宁",
    center: coordinates(108.3669, 22.8170),
    city: "广西壮族自治区",
    narrative: "喀斯特山水、边关文化和民族风情并置，适合做更强调自然地貌的省域导览。",
    region: "华南",
    slogan: "山水格局和民族风情很强，更适合做观景与文化混合路线。",
    tags: ["喀斯特", "民族文化", "边关"],
    travelSeasons: ["秋季", "冬季"],
  },
  {
    adcode: "460000",
    capital: "海口",
    center: coordinates(110.3492, 20.0174),
    city: "海南省",
    narrative: "海岛景观与海洋文化相结合，适合做轻度休闲但带有地方文化识别的地图导览。",
    region: "华南",
    slogan: "海岛城市与海洋文化并置，海南更适合做节奏轻一点的文化旅行图。",
    tags: ["海岛", "海洋文化", "热带风景"],
    travelSeasons: ["冬季", "春季"],
  },
  {
    adcode: "500000",
    capital: "重庆",
    center: coordinates(106.5516, 29.5630),
    city: "重庆市",
    narrative: "山城地形、工业遗产和夜景空间感都很强，适合做层叠式城市导览。",
    region: "西南",
    slogan: "山城、江岸和工业旧址叠在一起，重庆的地图表达很有立体感。",
    tags: ["山城", "工业遗产", "夜景"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "510000",
    capital: "成都",
    center: coordinates(104.0665, 30.5728),
    city: "四川省",
    narrative: "古蜀遗址、茶馆生活和山川景观都很强，适合做慢节奏却内容丰富的省域导览。",
    region: "西南",
    slogan: "古蜀文明、茶馆文化和名山大川并置，四川导览层次非常丰富。",
    tags: ["古蜀", "茶馆", "山川"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "520000",
    capital: "贵阳",
    center: coordinates(106.6302, 26.6470),
    city: "贵州省",
    narrative: "山地地貌、民族村寨和非遗工艺并置，更适合做体验感强的省域路线。",
    region: "西南",
    slogan: "村寨、山地和非遗手艺都很鲜明，贵州适合做沉浸式文化旅行。",
    tags: ["民族村寨", "山地", "非遗"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "530000",
    capital: "昆明",
    center: coordinates(102.7123, 25.0406),
    city: "云南省",
    narrative: "多民族文化、古城与高原湖山组合自然，适合做色彩和气候都更鲜明的地图导览。",
    region: "西南",
    slogan: "古城、高原湖山和民族文化共存，是最适合做风格化导览的地区之一。",
    tags: ["古城", "高原", "民族文化"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "540000",
    capital: "拉萨",
    center: coordinates(91.1322, 29.6604),
    city: "西藏自治区",
    narrative: "寺院、宫殿和高原景观高度统一，适合做精神性与地理感都非常强的省域导览。",
    region: "西南",
    slogan: "高原寺院与宫殿群构成极强的文化辨识度，导览节奏更适合放慢。",
    tags: ["高原", "寺院", "宫殿"],
    travelSeasons: ["夏季", "秋季"],
  },
  {
    adcode: "610000",
    capital: "西安",
    center: coordinates(108.9398, 34.3416),
    city: "陕西省",
    narrative: "古都遗迹、博物馆和黄土高原文化线索都很强，适合做历史纵深型导览。",
    region: "西北",
    slogan: "古都、博物馆和遗址密度极高，陕西非常适合做故事化主线。",
    tags: ["古都", "博物馆", "遗址"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "620000",
    capital: "兰州",
    center: coordinates(103.8343, 36.0611),
    city: "甘肃省",
    narrative: "丝路石窟、黄河文化和西北地貌共同构成更具纵深感的导览骨架。",
    region: "西北",
    slogan: "丝路、石窟和黄河空间在甘肃交汇，是西北导览的关键区域。",
    tags: ["丝绸之路", "石窟", "黄河"],
    travelSeasons: ["夏季", "秋季"],
  },
  {
    adcode: "630000",
    capital: "西宁",
    center: coordinates(101.7782, 36.6171),
    city: "青海省",
    narrative: "高原湖泊、藏传佛教空间和民族文化适合做更开阔、节奏更缓的省域导览。",
    region: "西北",
    slogan: "高原湖泊与宗教文化并置，青海适合做强调地理感的路线。",
    tags: ["高原", "湖泊", "宗教文化"],
    travelSeasons: ["夏季", "秋季"],
  },
  {
    adcode: "640000",
    capital: "银川",
    center: coordinates(106.2782, 38.4664),
    city: "宁夏回族自治区",
    narrative: "西夏遗迹、贺兰山岩画与黄河灌区文明可以形成更聚焦的西北导览。",
    region: "西北",
    slogan: "西夏遗迹与黄河文明交织，宁夏适合做主题明确的小而精导览。",
    tags: ["西夏", "黄河", "岩画"],
    travelSeasons: ["春季", "秋季"],
  },
  {
    adcode: "650000",
    capital: "乌鲁木齐",
    center: coordinates(87.6177, 43.7928),
    city: "新疆维吾尔自治区",
    narrative: "丝路遗迹、民族街区和雪山草原空间跨度都很大，适合做区域气质非常强的导览。",
    region: "西北",
    slogan: "丝路、民族街区与辽阔地貌并行，新疆导览更强调空间尺度与文化多样性。",
    tags: ["丝绸之路", "民族文化", "雪山草原"],
    travelSeasons: ["夏季", "秋季"],
  },
  {
    adcode: "810000",
    capital: "香港",
    center: coordinates(114.1694, 22.3193),
    city: "香港特别行政区",
    narrative: "中西交汇的街区、港口记忆和山海景观适合做密度很高的城市导览。",
    region: "华南",
    slogan: "港口城市肌理和中西文化叠加，让香港更适合做街区型文化地图。",
    tags: ["港口城市", "中西文化", "山海"],
    travelSeasons: ["秋季", "冬季"],
  },
  {
    adcode: "820000",
    capital: "澳门",
    center: coordinates(113.5439, 22.1987),
    city: "澳门特别行政区",
    narrative: "世界遗产街区、教堂广场和城市步行尺度都很适合做紧凑型导览。",
    region: "华南",
    slogan: "世界遗产街区和步行尺度都很集中，澳门适合做完整的一日导览。",
    tags: ["世界遗产", "步行街区", "中西融合"],
    travelSeasons: ["秋季", "冬季"],
  },
  {
    adcode: "710000",
    capital: "台北",
    center: coordinates(121.5654, 25.0330),
    city: "台湾省",
    narrative: "山海景观、老街和近代城市文化并置，适合做更生活化的区域导览。",
    region: "华东",
    slogan: "老街、山海与当代城市文化并存，更适合做轻盈但完整的区域导览。",
    tags: ["山海", "老街", "当代城市"],
    travelSeasons: ["春季", "秋季"],
  },
];

const provinceByName = new Map(
  provinceCatalog.map((province) => [province.city.toLowerCase(), province]),
);

const representativeProvinceAliases = new Map<string, string[]>([
  [
    "江苏省",
    [
      "苏州",
      "苏州市",
      "江苏苏州",
      "江苏苏州市",
      "无锡",
      "无锡市",
      "扬州",
      "扬州市",
      "周庄",
      "同里",
    ],
  ],
  [
    "浙江省",
    [
      "杭州",
      "杭州市",
      "绍兴",
      "绍兴市",
      "乌镇",
      "西塘",
      "宁波",
      "宁波市",
      "嘉兴",
      "嘉兴市",
    ],
  ],
  [
    "福建省",
    ["厦门", "厦门市", "泉州", "泉州市", "福州", "福州市", "武夷山"],
  ],
  [
    "江西省",
    ["景德镇", "景德镇市", "婺源", "上饶", "上饶市"],
  ],
  [
    "河南省",
    ["洛阳", "洛阳市", "开封", "开封市", "安阳", "安阳市", "登封"],
  ],
  [
    "山东省",
    ["青岛", "青岛市", "曲阜", "泰安", "泰安市", "济宁", "济宁市"],
  ],
  ["山西省", ["平遥", "大同", "大同市"]],
  ["陕西省", ["西安", "西安市", "咸阳", "咸阳市"]],
  [
    "四川省",
    ["成都", "成都市", "乐山", "乐山市", "峨眉山", "都江堰"],
  ],
  [
    "云南省",
    ["昆明", "昆明市", "大理", "大理市", "丽江", "丽江市", "香格里拉", "西双版纳"],
  ],
]);

const provinceAliases = new Map<string, string>(
  provinceCatalog.flatMap((province) => {
    const aliases = new Set<string>([
      province.city,
      province.capital,
      province.city.replace(/省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g, ""),
    ]);

    if (province.city === "浙江省") {
      aliases.add("杭州");
    }
    if (province.city === "陕西省") {
      aliases.add("西安");
    }
    if (province.city === "四川省") {
      aliases.add("成都");
    }

    return [...aliases].map((alias) => [alias.toLowerCase(), province.city]);
  }),
);

export function listProvinceCatalog() {
  return provinceCatalog;
}

export function resolveProvinceMeta(query?: string) {
  if (!query) {
    return provinceCatalog[0];
  }

  const normalized = query.trim().toLowerCase();
  const compactQuery = normalized.replace(/\s+/g, "");
  const representativeProvinceName = [...representativeProvinceAliases.entries()].find(
    ([, aliases]) =>
      aliases.some((alias) => {
        const normalizedAlias = alias.toLowerCase();
        return compactQuery === normalizedAlias || compactQuery.includes(normalizedAlias);
      }),
  )?.[0];
  const provinceName =
    provinceAliases.get(compactQuery) ??
    provinceAliases.get(compactQuery.replace(/省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g, "")) ??
    representativeProvinceName ??
    compactQuery;
  return provinceByName.get(provinceName) ?? provinceCatalog[0];
}

export function listCities(): CitySummary[] {
  return provinceCatalog.map((province) => ({
    capital: province.capital,
    center: province.center,
    city: province.city,
    narrative: province.narrative,
    poiCount: 6,
    slogan: province.slogan,
    tags: province.tags,
  }));
}
