import {
  KNOWLEDGE_CATEGORIES,
  type AdminKnowledgeBlock,
  type KnowledgeBlockStatus,
  type KnowledgeCategory
} from "../api/knowledge";

const BLOCKS_STORAGE_KEY = "sb_admin_knowledge_blocks";
const LINKS_STORAGE_KEY = "sb_admin_project_knowledge";

type FallbackLinkMap = Record<string, string[]>;

function createFallbackId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const FALLBACK_SEED_BLOCKS: AdminKnowledgeBlock[] = [
  {
    id: "kb-cheon-gan-basic",
    title: "천간 기본 해석 원칙",
    category: "cheon_gan",
    content: "천간은 외부로 드러나는 성향과 에너지 표현을 설명할 때 우선 참조한다.",
    tags: ["기본", "해석원칙"],
    status: "published",
    priority: 200,
    source: "internal-seed",
    created_at: "2026-02-16T00:00:00.000Z",
    updated_at: "2026-02-16T00:00:00.000Z"
  },
  {
    id: "kb-ohaeng-balance",
    title: "오행 분포 해석 기준",
    category: "ohaeng",
    content: "오행 분포는 과다/결핍을 단정이 아닌 경향성으로 제시하고 행동 가이드로 연결한다.",
    tags: ["오행", "균형"],
    status: "draft",
    priority: 180,
    source: "internal-seed",
    created_at: "2026-02-16T00:00:00.000Z",
    updated_at: "2026-02-16T00:00:00.000Z"
  },
  {
    id: "kb-compatibility-frame",
    title: "궁합 해석 프레임",
    category: "compatibility_principle",
    content: "궁합은 감정 리듬, 의사결정 속도, 갈등 복구 패턴의 3축으로 제시한다.",
    tags: ["궁합", "프레임"],
    status: "published",
    priority: 210,
    source: "internal-seed",
    created_at: "2026-02-16T00:00:00.000Z",
    updated_at: "2026-02-16T00:00:00.000Z"
  }
];

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readFallbackKnowledgeBlocks(): AdminKnowledgeBlock[] {
  const stored = readJson<AdminKnowledgeBlock[]>(BLOCKS_STORAGE_KEY);
  if (Array.isArray(stored)) {
    return stored;
  }
  writeJson(BLOCKS_STORAGE_KEY, FALLBACK_SEED_BLOCKS);
  return FALLBACK_SEED_BLOCKS;
}

export function findFallbackKnowledgeBlock(blockId: string): AdminKnowledgeBlock | null {
  return readFallbackKnowledgeBlocks().find((item) => item.id === blockId) ?? null;
}

export function createFallbackKnowledgeBlock(input: {
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  status: KnowledgeBlockStatus;
  priority: number;
  source?: string | null;
}): AdminKnowledgeBlock {
  const now = new Date().toISOString();
  const created: AdminKnowledgeBlock = {
    id: createFallbackId("kb"),
    title: input.title,
    category: KNOWLEDGE_CATEGORIES.includes(input.category) ? input.category : "custom",
    content: input.content,
    tags: input.tags,
    status: input.status,
    priority: input.priority,
    source: input.source ?? null,
    created_at: now,
    updated_at: now
  };

  const blocks = [created, ...readFallbackKnowledgeBlocks()];
  writeJson(BLOCKS_STORAGE_KEY, blocks);
  return created;
}

export function updateFallbackKnowledgeBlock(
  blockId: string,
  input: {
    title: string;
    category: KnowledgeCategory;
    content: string;
    tags: string[];
    status: KnowledgeBlockStatus;
    priority: number;
    source?: string | null;
  }
): AdminKnowledgeBlock | null {
  const blocks = readFallbackKnowledgeBlocks();
  const target = blocks.find((item) => item.id === blockId);
  if (!target) {
    return null;
  }

  const updated: AdminKnowledgeBlock = {
    ...target,
    title: input.title,
    category: input.category,
    content: input.content,
    tags: input.tags,
    status: input.status,
    priority: input.priority,
    source: input.source ?? null,
    updated_at: new Date().toISOString()
  };

  writeJson(
    BLOCKS_STORAGE_KEY,
    blocks.map((item) => (item.id === blockId ? updated : item))
  );
  return updated;
}

export function deleteFallbackKnowledgeBlock(blockId: string): boolean {
  const blocks = readFallbackKnowledgeBlocks();
  const next = blocks.filter((item) => item.id !== blockId);
  if (next.length === blocks.length) {
    return false;
  }

  writeJson(BLOCKS_STORAGE_KEY, next);

  const linkMap = readFallbackLinkMap();
  const normalized: FallbackLinkMap = {};
  for (const [projectId, blockIds] of Object.entries(linkMap)) {
    normalized[projectId] = blockIds.filter((id) => id !== blockId);
  }
  writeJson(LINKS_STORAGE_KEY, normalized);

  return true;
}

function readFallbackLinkMap(): FallbackLinkMap {
  const stored = readJson<FallbackLinkMap>(LINKS_STORAGE_KEY);
  if (!stored || typeof stored !== "object") {
    return {};
  }
  return stored;
}

function writeFallbackLinkMap(map: FallbackLinkMap): void {
  writeJson(LINKS_STORAGE_KEY, map);
}

export function readFallbackProjectKnowledge(projectId: string): string[] {
  const linkMap = readFallbackLinkMap();
  const list = linkMap[projectId];
  return Array.isArray(list) ? list : [];
}

export function attachFallbackProjectKnowledge(projectId: string, blockId: string): void {
  const linkMap = readFallbackLinkMap();
  const nextSet = new Set([...(linkMap[projectId] ?? []), blockId]);
  linkMap[projectId] = [...nextSet];
  writeFallbackLinkMap(linkMap);
}

export function detachFallbackProjectKnowledge(projectId: string, blockId: string): void {
  const linkMap = readFallbackLinkMap();
  linkMap[projectId] = (linkMap[projectId] ?? []).filter((item) => item !== blockId);
  writeFallbackLinkMap(linkMap);
}
