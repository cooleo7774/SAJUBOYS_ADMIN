export function generateDraft(input: {
  prompt: string;
  goal: string;
  tone: string;
  must: string[];
  avoid: string[];
  referenceOutput: string;
  toneGuide: string;
  trainingHint: string;
}): string {
  const mustText = input.must[0] ?? "실행 가능한 행동 한 줄";
  const avoidText = input.avoid[0] ?? "단정 표현";
  const guide =
    input.referenceOutput.length > 0
      ? input.referenceOutput
      : "관계 리듬과 실행 타이밍을 함께 제시하고, 단정 대신 조건부 문장을 사용하세요.";

  return [
    `요청 해석: ${input.prompt.trim() || "사용자 의도 입력 필요"}`,
    "",
    `목표: ${input.goal || "명시되지 않음"}`,
    `기본 톤: ${input.tone || "명시되지 않음"}`,
    "",
    "[톤앤매너 가이드]",
    input.toneGuide,
    "",
    "[사전학습 반영 포인트]",
    input.trainingHint,
    "",
    "[응답 초안]",
    guide,
    "",
    `오늘의 실행 포인트: ${mustText}`,
    `주의 표현: ${avoidText}는 피하고 조건부 문장으로 안내합니다.`
  ].join("\n");
}
