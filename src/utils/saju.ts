import { Solar } from "lunar-javascript";
import type { SajuChart } from "../api";

type Element = "wood" | "fire" | "earth" | "metal" | "water";
type KoreanStem = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";
type KoreanBranch = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";

const STEM_TO_KOREAN: Record<string, KoreanStem> = {
  甲: "갑",
  乙: "을",
  丙: "병",
  丁: "정",
  戊: "무",
  己: "기",
  庚: "경",
  辛: "신",
  壬: "임",
  癸: "계",
  갑: "갑",
  을: "을",
  병: "병",
  정: "정",
  무: "무",
  기: "기",
  경: "경",
  신: "신",
  임: "임",
  계: "계"
};

const BRANCH_TO_KOREAN: Record<string, KoreanBranch> = {
  子: "자",
  丑: "축",
  寅: "인",
  卯: "묘",
  辰: "진",
  巳: "사",
  午: "오",
  未: "미",
  申: "신",
  酉: "유",
  戌: "술",
  亥: "해",
  자: "자",
  축: "축",
  인: "인",
  묘: "묘",
  진: "진",
  사: "사",
  오: "오",
  미: "미",
  신: "신",
  유: "유",
  술: "술",
  해: "해"
};

const STEM_ELEMENT: Record<KoreanStem, Element> = {
  갑: "wood",
  을: "wood",
  병: "fire",
  정: "fire",
  무: "earth",
  기: "earth",
  경: "metal",
  신: "metal",
  임: "water",
  계: "water"
};

const BRANCH_ELEMENT: Record<KoreanBranch, Element> = {
  자: "water",
  축: "earth",
  인: "wood",
  묘: "wood",
  진: "earth",
  사: "fire",
  오: "fire",
  미: "earth",
  신: "metal",
  유: "metal",
  술: "earth",
  해: "water"
};

function elementCountTemplate(): Record<Element, number> {
  return {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0
  };
}

function normalizeStem(value: string): KoreanStem {
  const normalized = STEM_TO_KOREAN[value];
  if (!normalized) {
    throw new Error(`unknown_stem:${value}`);
  }
  return normalized;
}

function normalizeBranch(value: string): KoreanBranch {
  const normalized = BRANCH_TO_KOREAN[value];
  if (!normalized) {
    throw new Error(`unknown_branch:${value}`);
  }
  return normalized;
}

function buildChartFromPillars(input: {
  year: { stem: KoreanStem; branch: KoreanBranch };
  month: { stem: KoreanStem; branch: KoreanBranch };
  day: { stem: KoreanStem; branch: KoreanBranch };
  hour: { stem: KoreanStem; branch: KoreanBranch };
  tenGods: string[];
}): SajuChart {
  const chart: SajuChart = {
    year: {
      stem: input.year.stem,
      branch: input.year.branch,
      element: STEM_ELEMENT[input.year.stem]
    },
    month: {
      stem: input.month.stem,
      branch: input.month.branch,
      element: STEM_ELEMENT[input.month.stem]
    },
    day: {
      stem: input.day.stem,
      branch: input.day.branch,
      element: STEM_ELEMENT[input.day.stem]
    },
    hour: {
      stem: input.hour.stem,
      branch: input.hour.branch,
      element: STEM_ELEMENT[input.hour.stem]
    },
    five_elements: elementCountTemplate(),
    ten_gods: input.tenGods
  };

  const addElement = (element: Element) => {
    chart.five_elements[element] += 1;
  };

  [chart.year, chart.month, chart.day, chart.hour].forEach((pillar) => {
    addElement(pillar.element);
    addElement(BRANCH_ELEMENT[pillar.branch as KoreanBranch]);
  });

  return chart;
}

export function calculateSajuLocal(input: {
  birthDate: string;
  birthTime?: string;
  gender: "male" | "female" | "other";
}): SajuChart {
  try {
    const [year, month, day] = input.birthDate.split("-").map((item) => Number(item));
    const [hour, minute] = (input.birthTime || "12:00").split(":").map((item) => Number(item));

    const solar = Solar.fromYmdHms(year, month, day, hour || 12, minute || 0, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();

    const yearStem = normalizeStem(eightChar.getYearGan());
    const yearBranch = normalizeBranch(eightChar.getYearZhi());
    const monthStem = normalizeStem(eightChar.getMonthGan());
    const monthBranch = normalizeBranch(eightChar.getMonthZhi());
    const dayStem = normalizeStem(eightChar.getDayGan());
    const dayBranch = normalizeBranch(eightChar.getDayZhi());
    const hourStem = normalizeStem(eightChar.getTimeGan());
    const hourBranch = normalizeBranch(eightChar.getTimeZhi());

    const tenGods = collectTenGods(eightChar, dayStem, input.gender);

    return buildChartFromPillars({
      year: { stem: yearStem, branch: yearBranch },
      month: { stem: monthStem, branch: monthBranch },
      day: { stem: dayStem, branch: dayBranch },
      hour: { stem: hourStem, branch: hourBranch },
      tenGods
    });
  } catch {
    return calculateSajuLegacy(input);
  }
}

function collectTenGods(
  eightChar: {
    getYearShiShenGan?: () => string;
    getMonthShiShenGan?: () => string;
    getDayShiShenGan?: () => string;
    getTimeShiShenGan?: () => string;
  },
  dayStem: KoreanStem,
  gender: "male" | "female" | "other"
): string[] {
  const fromLib = [
    eightChar.getYearShiShenGan?.(),
    eightChar.getMonthShiShenGan?.(),
    eightChar.getDayShiShenGan?.(),
    eightChar.getTimeShiShenGan?.()
  ]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);

  if (fromLib.length > 0) {
    return [`일간:${dayStem}`, ...fromLib];
  }

  const base =
    gender === "male"
      ? ["정관", "편재", "식신", "편인"]
      : gender === "female"
        ? ["정인", "정재", "상관", "편관"]
        : ["비견", "겁재", "식신", "정인"];

  return [`일간:${dayStem}`, ...base];
}

function calculateSajuLegacy(input: {
  birthDate: string;
  birthTime?: string;
  gender: "male" | "female" | "other";
}): SajuChart {
  const STEMS: KoreanStem[] = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const BRANCHES: KoreanBranch[] = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

  const [year, month, day] = input.birthDate.split("-").map((item) => Number(item));
  const [hh, mm] = (input.birthTime || "12:00").split(":").map((item) => Number(item));
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hh || 12, mm || 0));

  const epoch = Date.UTC(1900, 0, 31);
  const diffDays = Math.floor((date.getTime() - epoch) / 86400000);

  const yearStem = STEMS[((date.getUTCFullYear() - 4) % 10 + 10) % 10];
  const yearBranch = BRANCHES[((date.getUTCFullYear() - 4) % 12 + 12) % 12];

  const monthStem = STEMS[(((date.getUTCFullYear() - 4) * 2 + date.getUTCMonth()) % 10 + 10) % 10];
  const monthBranch = BRANCHES[((date.getUTCMonth() + 1) % 12 + 12) % 12];

  const dayStem = STEMS[((diffDays % 10) + 10) % 10];
  const dayBranch = BRANCHES[((diffDays % 12) + 12) % 12];

  const hourBranch = BRANCHES[(Math.floor((((hh || 12) + 1) % 24) / 2) + 12) % 12];
  const hourStem = STEMS[(((diffDays % 10) * 2 + Math.floor((((hh || 12) + 1) % 24) / 2)) % 10 + 10) % 10];

  return buildChartFromPillars({
    year: { stem: yearStem, branch: yearBranch },
    month: { stem: monthStem, branch: monthBranch },
    day: { stem: dayStem, branch: dayBranch },
    hour: { stem: hourStem, branch: hourBranch },
    tenGods: [`일간:${dayStem}`]
  });
}

export function formatSajuChartForPrompt(chart: SajuChart): string {
  const pillars = [
    `연주: ${chart.year.stem}${chart.year.branch}`,
    `월주: ${chart.month.stem}${chart.month.branch}`,
    `일주: ${chart.day.stem}${chart.day.branch}`,
    `시주: ${chart.hour.stem}${chart.hour.branch}`
  ];

  const elements = `오행 분포(목/화/토/금/수): ${chart.five_elements.wood}/${chart.five_elements.fire}/${chart.five_elements.earth}/${chart.five_elements.metal}/${chart.five_elements.water}`;
  const tenGods = `십성 요약: ${chart.ten_gods.join(", ")}`;

  return [...pillars, elements, tenGods].join("\n");
}

export function elementToKorean(element: Element): string {
  const map: Record<Element, string> = {
    wood: "목",
    fire: "화",
    earth: "토",
    metal: "금",
    water: "수"
  };
  return map[element];
}
