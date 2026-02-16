export type StudioExample = {
  id: string;
  label: string;
  userPrompt: string;
  expectedOutput: string;
  kind: "good" | "bad";
};

export type StudioProject = {
  id: string;
  name: string;
  status: "draft" | "published";
  goal: string;
  tone: string;
  context: string;
  guardrailsMust: string[];
  guardrailsAvoid: string[];
  examples: StudioExample[];
  updatedAt: string;
};

export const sampleProjects: StudioProject[] = [
  {
    id: "match-soft-v1",
    name: "Match Reading - Soft Expert",
    status: "published",
    goal: "두 사람의 감정 리듬과 관계 타이밍을 현실적으로 해석",
    tone: "정확하지만 단정하지 않음. 행동 가능한 한 줄 제안 포함.",
    context:
      "사주 해석은 운명 단정이 아니라 패턴 해석이다. 불확실성은 숨기지 않는다. 24시간 내 행동 가이드를 반드시 포함한다.",
    guardrailsMust: [
      "각 섹션 끝에 실천 가능한 한 문장",
      "확신도 낮을 때 조건부 표현 사용",
      "감정 안전성과 소통 리듬 중심으로 설명"
    ],
    guardrailsAvoid: [
      "100% 단정 표현",
      "상대방 비난 유도",
      "불필요한 공포 자극"
    ],
    examples: [
      {
        id: "ex-1",
        label: "좋은 예시 A",
        kind: "good",
        userPrompt: "내가 먼저 연락해도 될까?",
        expectedOutput:
          "지금은 상대의 반응 속도를 관찰하며 짧은 확인 메시지를 먼저 보내는 편이 유리합니다. 감정 리듬이 느린 편이라 장문보다 한 줄 메시지가 부담을 줄이고, 오늘 저녁 7~9시 사이처럼 명확한 타이밍 제안이 관계 흐름을 부드럽게 만듭니다."
      },
      {
        id: "ex-2",
        label: "나쁜 예시",
        kind: "bad",
        userPrompt: "이번 주에 고백하면 성공해?",
        expectedOutput: "무조건 성공합니다. 지금 당장 고백하세요."
      }
    ],
    updatedAt: "2026-02-15"
  },
  {
    id: "fortune-daily-v1",
    name: "Daily Fortune - Action Brief",
    status: "draft",
    goal: "하루 운세를 한눈에 이해하고 바로 행동할 수 있게 제시",
    tone: "짧고 명료한 브리핑, 과장 없이 현실적인 문장",
    context:
      "운세는 실행 프롬프트다. 좋은 운/주의 포인트/타이밍 신호를 3단 블록으로 표현한다.",
    guardrailsMust: ["오늘 실행할 1개 행동 제시", "시간대 힌트 포함"],
    guardrailsAvoid: ["신비주의 과장", "무의미한 일반론"],
    examples: [
      {
        id: "ex-3",
        label: "좋은 예시 B",
        kind: "good",
        userPrompt: "오늘 대인운 어때?",
        expectedOutput:
          "오늘은 관계 운이 나쁘지 않지만 말의 속도 차이로 오해가 생기기 쉽습니다. 오전에는 정보 정리, 오후 3시 이후에는 먼저 질문하고 확인받는 방식이 안정적입니다. 핵심 행동: 중요한 대화 전에 한 문장으로 의도를 먼저 밝히세요."
      }
    ],
    updatedAt: "2026-02-15"
  }
];
