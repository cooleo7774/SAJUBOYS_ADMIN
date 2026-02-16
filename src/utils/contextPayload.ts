import {
  CONTEXT_META_END,
  CONTEXT_META_START,
  DEFAULT_TONE_PROFILE,
  type ParsedContextPayload,
  type ProjectContextMetadata,
  type ToneMannerProfile,
  type TrainingCorpusItem
} from "../types/studio";

export function normalizeToneProfile(input?: Partial<ToneMannerProfile>): ToneMannerProfile {
  if (!input) {
    return DEFAULT_TONE_PROFILE;
  }

  return {
    ...DEFAULT_TONE_PROFILE,
    ...input,
    preferred_phrases: Array.isArray(input.preferred_phrases)
      ? input.preferred_phrases.filter((item) => typeof item === "string")
      : DEFAULT_TONE_PROFILE.preferred_phrases,
    banned_phrases: Array.isArray(input.banned_phrases)
      ? input.banned_phrases.filter((item) => typeof item === "string")
      : DEFAULT_TONE_PROFILE.banned_phrases
  };
}

export function normalizeTrainingCorpus(input: unknown): TrainingCorpusItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const value = item as Partial<TrainingCorpusItem>;
      if (!value.id || !value.title || !value.content || !value.category) {
        return null;
      }
      return {
        id: value.id,
        category: value.category,
        title: value.title,
        content: value.content,
        source: value.source ?? "",
        tags: Array.isArray(value.tags) ? value.tags.filter((tag) => typeof tag === "string") : [],
        priority: typeof value.priority === "number" ? value.priority : 100
      };
    })
    .filter((item): item is TrainingCorpusItem => item !== null);
}

export function extractContextPayload(contextText: string): ParsedContextPayload {
  const startIndex = contextText.indexOf(CONTEXT_META_START);
  const endIndex = contextText.indexOf(CONTEXT_META_END);

  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    return {
      plainContext: contextText,
      metadata: {}
    };
  }

  const rawJson = contextText.slice(startIndex + CONTEXT_META_START.length, endIndex).trim();
  const before = contextText.slice(0, startIndex).trim();
  const after = contextText.slice(endIndex + CONTEXT_META_END.length).trim();
  const plainContext = [before, after].filter((item) => item.length > 0).join("\n\n");

  try {
    const parsed = JSON.parse(rawJson) as ProjectContextMetadata;
    return {
      plainContext,
      metadata: {
        tone_profile: parsed.tone_profile,
        training_corpus: normalizeTrainingCorpus(parsed.training_corpus)
      }
    };
  } catch {
    return {
      plainContext: contextText,
      metadata: {}
    };
  }
}

export function buildContextPayload(plainContext: string, metadata: ProjectContextMetadata): string {
  const normalized: ProjectContextMetadata = {
    tone_profile: normalizeToneProfile(metadata.tone_profile),
    training_corpus: normalizeTrainingCorpus(metadata.training_corpus)
  };

  const cleanedContext = plainContext.trim();
  const metaBlock = [CONTEXT_META_START, JSON.stringify(normalized, null, 2), CONTEXT_META_END].join("\n");
  return cleanedContext.length > 0 ? `${cleanedContext}\n\n${metaBlock}` : metaBlock;
}

export function buildToneGuide(profile: ToneMannerProfile): string {
  const detailByLevel: Record<ToneMannerProfile["detail_level"], string> = {
    brief: "핵심 3~4문장 이내",
    standard: "요약 + 근거 + 행동 1개",
    deep: "근거/예외/행동을 분리해서 설명"
  };

  const formalityMap: Record<ToneMannerProfile["formality"], string> = {
    casual: "친근한 반말/짧은 문장",
    balanced: "존댓말 기반의 자연스러운 문장",
    formal: "보고서형 존댓말 문체"
  };

  const directnessMap: Record<ToneMannerProfile["directness"], string> = {
    soft: "부드러운 제안형",
    balanced: "명확하되 단정은 피함",
    direct: "핵심 권고를 직접 제시"
  };

  return [
    `문체: ${formalityMap[profile.formality]}`,
    `전달 강도: ${directnessMap[profile.directness]}`,
    `공감 수준: ${profile.empathy}`,
    `설명 깊이: ${detailByLevel[profile.detail_level]}`,
    `해석 프레임: ${profile.fortune_frame}`,
    `행동 제안 방식: ${profile.cta_style}`,
    `이모지 정책: ${profile.emoji_policy}`,
    profile.preferred_phrases.length > 0 ? `권장 표현: ${profile.preferred_phrases.join(", ")}` : "",
    profile.banned_phrases.length > 0 ? `금지 표현: ${profile.banned_phrases.join(", ")}` : ""
  ]
    .filter((item) => item.length > 0)
    .join("\n");
}

export function summarizeTrainingCorpus(items: TrainingCorpusItem[]): string {
  if (items.length === 0) {
    return "등록된 사전학습 데이터가 없습니다.";
  }

  const topItems = [...items]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((item) => `- [${item.category}] ${item.title}: ${item.content}`);

  return [`총 ${items.length}개 데이터`, ...topItems].join("\n");
}
