import type { CitySummary } from '../types'

const provinceSuffixPattern = /省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g

interface PlannerAliasEntry {
  matchText: string
  value: string
}

const plannerRepresentativeAliasMap: Record<string, PlannerAliasEntry[]> = {
  江苏省: [
    { matchText: '苏州', value: '苏州' },
    { matchText: '苏州市', value: '苏州' },
    { matchText: '江苏苏州', value: '苏州' },
    { matchText: '江苏苏州市', value: '苏州' },
    { matchText: '无锡', value: '无锡' },
    { matchText: '无锡市', value: '无锡' },
    { matchText: '扬州', value: '扬州' },
    { matchText: '扬州市', value: '扬州' },
    { matchText: '周庄', value: '周庄' },
    { matchText: '同里', value: '同里' },
  ],
  浙江省: [
    { matchText: '杭州', value: '杭州' },
    { matchText: '杭州市', value: '杭州' },
    { matchText: '绍兴', value: '绍兴' },
    { matchText: '绍兴市', value: '绍兴' },
    { matchText: '乌镇', value: '乌镇' },
    { matchText: '西塘', value: '西塘' },
    { matchText: '宁波', value: '宁波' },
    { matchText: '宁波市', value: '宁波' },
    { matchText: '嘉兴', value: '嘉兴' },
    { matchText: '嘉兴市', value: '嘉兴' },
  ],
  福建省: [
    { matchText: '厦门', value: '厦门' },
    { matchText: '厦门市', value: '厦门' },
    { matchText: '泉州', value: '泉州' },
    { matchText: '泉州市', value: '泉州' },
    { matchText: '福州', value: '福州' },
    { matchText: '福州市', value: '福州' },
    { matchText: '武夷山', value: '武夷山' },
  ],
  江西省: [
    { matchText: '景德镇', value: '景德镇' },
    { matchText: '景德镇市', value: '景德镇' },
    { matchText: '婺源', value: '婺源' },
    { matchText: '上饶', value: '上饶' },
    { matchText: '上饶市', value: '上饶' },
  ],
  河南省: [
    { matchText: '洛阳', value: '洛阳' },
    { matchText: '洛阳市', value: '洛阳' },
    { matchText: '开封', value: '开封' },
    { matchText: '开封市', value: '开封' },
    { matchText: '安阳', value: '安阳' },
    { matchText: '安阳市', value: '安阳' },
    { matchText: '登封', value: '登封' },
  ],
  山东省: [
    { matchText: '青岛', value: '青岛' },
    { matchText: '青岛市', value: '青岛' },
    { matchText: '曲阜', value: '曲阜' },
    { matchText: '泰安', value: '泰安' },
    { matchText: '泰安市', value: '泰安' },
    { matchText: '济宁', value: '济宁' },
    { matchText: '济宁市', value: '济宁' },
  ],
  山西省: [
    { matchText: '平遥', value: '平遥' },
    { matchText: '大同', value: '大同' },
    { matchText: '大同市', value: '大同' },
  ],
  陕西省: [
    { matchText: '西安', value: '西安' },
    { matchText: '西安市', value: '西安' },
    { matchText: '咸阳', value: '咸阳' },
    { matchText: '咸阳市', value: '咸阳' },
  ],
  四川省: [
    { matchText: '成都', value: '成都' },
    { matchText: '成都市', value: '成都' },
    { matchText: '乐山', value: '乐山' },
    { matchText: '乐山市', value: '乐山' },
    { matchText: '峨眉山', value: '峨眉山' },
    { matchText: '都江堰', value: '都江堰' },
  ],
  云南省: [
    { matchText: '昆明', value: '昆明' },
    { matchText: '昆明市', value: '昆明' },
    { matchText: '大理', value: '大理' },
    { matchText: '大理市', value: '大理' },
    { matchText: '丽江', value: '丽江' },
    { matchText: '丽江市', value: '丽江' },
    { matchText: '香格里拉', value: '香格里拉' },
    { matchText: '西双版纳', value: '西双版纳' },
  ],
}

function normalizePlannerText(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, '')
}

function getPlannerCityAliases(cityOption: Pick<CitySummary, 'capital' | 'city'>) {
  const city = cityOption.city.trim()
  const aliases: PlannerAliasEntry[] = [
    { matchText: city, value: city },
    { matchText: city.replace(provinceSuffixPattern, ''), value: city },
    ...(cityOption.capital?.trim()
      ? [{ matchText: cityOption.capital.trim(), value: city }]
      : []),
    ...(plannerRepresentativeAliasMap[city] ?? []),
  ]

  return aliases.filter(
    (entry, index, list) =>
      entry.matchText.length > 0 &&
      list.findIndex(
        (candidate) =>
          candidate.matchText === entry.matchText && candidate.value === entry.value,
      ) === index,
  )
}

export function resolvePlannerCity(
  message: string,
  currentCity: string,
  cityOptions: Array<Pick<CitySummary, 'capital' | 'city'>>,
) {
  const normalizedMessage = normalizePlannerText(message)

  if (!normalizedMessage) {
    return currentCity
  }

  const matches = cityOptions
    .flatMap((cityOption) =>
      getPlannerCityAliases(cityOption).map((entry) => ({
        index: normalizedMessage.lastIndexOf(normalizePlannerText(entry.matchText)),
        matchText: entry.matchText,
        value: entry.value,
      })),
    )
    .filter((entry) => entry.index >= 0)
    .sort(
      (left, right) =>
        right.index - left.index || right.matchText.length - left.matchText.length,
    )

  return matches[0]?.value ?? currentCity
}
