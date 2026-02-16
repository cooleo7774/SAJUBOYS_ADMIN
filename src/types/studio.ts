export type StudioRouteKey = "context" | "tone" | "training" | "examples" | "playground" | "publish";

export type ToneMannerProfile = {
  formality: "casual" | "balanced" | "formal";
  directness: "soft" | "balanced" | "direct";
  empathy: "low" | "medium" | "high";
  detail_level: "brief" | "standard" | "deep";
  fortune_frame: "probabilistic" | "balanced" | "intuitive";
  cta_style: "single_action" | "two_options" | "timeline";
  emoji_policy: "none" | "minimal" | "contextual";
  preferred_phrases: string[];
  banned_phrases: string[];
};

export type TrainingCategory = "base_principle" | "compatibility" | "timing" | "communication" | "custom";

export type TrainingCorpusItem = {
  id: string;
  category: TrainingCategory;
  title: string;
  content: string;
  source: string;
  tags: string[];
  priority: number;
};

export type ProjectContextMetadata = {
  tone_profile?: ToneMannerProfile;
  training_corpus?: TrainingCorpusItem[];
};

export type ParsedContextPayload = {
  plainContext: string;
  metadata: ProjectContextMetadata;
};

export const CONTEXT_META_START = "<!-- SAJUBOYS_ADMIN_META_V1_START -->";
export const CONTEXT_META_END = "<!-- SAJUBOYS_ADMIN_META_V1_END -->";

export const DEFAULT_TONE_PROFILE: ToneMannerProfile = {
  formality: "balanced",
  directness: "soft",
  empathy: "high",
  detail_level: "standard",
  fortune_frame: "probabilistic",
  cta_style: "single_action",
  emoji_policy: "none",
  preferred_phrases: ["가능성이 높아요", "이런 조건이면 더 좋아요"],
  banned_phrases: ["무조건", "100% 확실", "운명이 정해져 있어요"]
};

export const TONE_PRESETS: Record<"soft_guide" | "expert_brief" | "direct_coach", ToneMannerProfile> = {
  soft_guide: {
    formality: "balanced",
    directness: "soft",
    empathy: "high",
    detail_level: "standard",
    fortune_frame: "probabilistic",
    cta_style: "single_action",
    emoji_policy: "none",
    preferred_phrases: ["천천히 확인해보세요", "지금은 이렇게 시도해보세요"],
    banned_phrases: ["절대 안 돼요", "무조건 이렇게 하세요"]
  },
  expert_brief: {
    formality: "formal",
    directness: "balanced",
    empathy: "medium",
    detail_level: "deep",
    fortune_frame: "balanced",
    cta_style: "timeline",
    emoji_policy: "none",
    preferred_phrases: ["근거를 기준으로 보면", "우선순위는 다음과 같아요"],
    banned_phrases: ["신비한 힘", "기적처럼"]
  },
  direct_coach: {
    formality: "casual",
    directness: "direct",
    empathy: "medium",
    detail_level: "brief",
    fortune_frame: "balanced",
    cta_style: "two_options",
    emoji_policy: "minimal",
    preferred_phrases: ["지금 바로 할 수 있는 건", "선택지는 두 가지예요"],
    banned_phrases: ["너무 장황한 설명", "애매한 결론만 제시"]
  }
};
