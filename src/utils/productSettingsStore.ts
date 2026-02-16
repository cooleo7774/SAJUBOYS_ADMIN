import type { ProductSettings, ProductType } from "../api/products";

const STORAGE_KEY = "sb_admin_product_settings_v1";

type StoreMap = Record<string, ProductSettings>;

function readStore(): StoreMap {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as StoreMap;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function writeStore(store: StoreMap): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function detectDefaultProductType(projectKey: string): ProductType {
  const lowered = projectKey.toLowerCase();
  if (lowered.includes("match") || lowered.includes("compat")) {
    return "compatibility";
  }
  if (lowered.includes("fortune") || lowered.includes("daily")) {
    return "daily_fortune";
  }
  return "full_reading";
}

function defaultPromptTemplate(type: ProductType): string {
  if (type === "compatibility") {
    return [
      "[역할] 당신은 궁합 전문 해석가입니다.",
      "[지식] {{knowledge:compatibility_principle}}",
      "[지식] {{knowledge:tongbyeon}}",
      "[입력 사주] {{saju_chart}}",
      "[지시] 단정 표현을 피하고 감정 리듬/소통 전략/실행 행동 1개를 제시하세요."
    ].join("\n");
  }

  if (type === "daily_fortune") {
    return [
      "[역할] 당신은 일일 운세 브리핑 작성자입니다.",
      "[지식] {{knowledge:fortune_principle}}",
      "[지식] {{knowledge:interpretation_guide}}",
      "[입력 사주] {{saju_chart}}",
      "[지시] 오늘의 기회/주의/실행 행동을 시간대 힌트와 함께 제시하세요."
    ].join("\n");
  }

  return [
    "[역할] 당신은 종합 사주풀이 해석가입니다.",
    "[지식] {{knowledge:cheon_gan}}",
    "[지식] {{knowledge:ji_ji}}",
    "[지식] {{knowledge:ohaeng}}",
    "[지식] {{knowledge:sibseong}}",
    "[지식] {{knowledge:tongbyeon}}",
    "[입력 사주] {{saju_chart}}",
    "[지시] 성향/강점/주의점/행동계획 순서로 균형 있게 제시하세요."
  ].join("\n");
}

export function getProductSettings(projectId: string, projectKey: string): ProductSettings {
  const store = readStore();
  const existing = store[projectId];
  if (existing) {
    return existing;
  }

  const productType = detectDefaultProductType(projectKey);
  const created: ProductSettings = {
    product_type: productType,
    prompt_template: defaultPromptTemplate(productType),
    tone_profile: {
      formality: "balanced",
      directness: "balanced",
      empathy: "medium"
    }
  };

  store[projectId] = created;
  writeStore(store);
  return created;
}

export function saveProductSettings(projectId: string, settings: ProductSettings): ProductSettings {
  const store = readStore();
  store[projectId] = settings;
  writeStore(store);
  return settings;
}

export function listProductSettings(): StoreMap {
  return readStore();
}
