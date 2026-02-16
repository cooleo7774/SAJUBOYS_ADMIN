import type { AdminKnowledgeBlock } from "../api";

export function assemblePromptTemplate(input: {
  template: string;
  blocks: AdminKnowledgeBlock[];
  sajuChartText?: string;
  userPrompt?: string;
}): string {
  const categoryMap = new Map<string, AdminKnowledgeBlock[]>();
  for (const block of input.blocks) {
    if (!categoryMap.has(block.category)) {
      categoryMap.set(block.category, []);
    }
    categoryMap.get(block.category)!.push(block);
  }

  for (const list of categoryMap.values()) {
    list.sort((a, b) => b.priority - a.priority);
  }

  let assembled = input.template;

  assembled = assembled.replace(/\{\{knowledge:([a-z_]+)\}\}/g, (_, category: string) => {
    const items = categoryMap.get(category) ?? [];
    if (items.length === 0) {
      return `[${category}] 관련 지식 블록이 아직 연결되지 않았습니다.`;
    }
    return items.map((item) => `- (${item.title}) ${item.content}`).join("\n");
  });

  assembled = assembled.replace(/\{\{saju_chart\}\}/g, input.sajuChartText?.trim() || "사주 차트 정보 없음");
  assembled = assembled.replace(/\{\{user_prompt\}\}/g, input.userPrompt?.trim() || "사용자 질문 없음");

  return assembled;
}
