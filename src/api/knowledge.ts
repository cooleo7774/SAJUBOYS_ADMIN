import { requestJson } from "./client";
import type { AdminApiConfig } from "./types";

export const KNOWLEDGE_CATEGORIES = [
  "cheon_gan",
  "ji_ji",
  "ohaeng",
  "sib_i_unseong",
  "sibseong",
  "sinsal",
  "compatibility_principle",
  "fortune_principle",
  "tongbyeon",
  "interpretation_guide",
  "custom"
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export type KnowledgeBlockStatus = "draft" | "published" | "archived";

export type AdminKnowledgeBlock = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  status: KnowledgeBlockStatus;
  priority: number;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminProjectKnowledgeLink = {
  project_id: string;
  knowledge_block_id: string;
  attached_at: string;
};

export type KnowledgeBlockListQuery = {
  category?: KnowledgeCategory;
  status?: KnowledgeBlockStatus;
  q?: string;
};

function toQueryString(query?: KnowledgeBlockListQuery): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  if (query.category) {
    params.set("category", query.category);
  }
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : "";
}

export async function fetchKnowledgeBlocks(
  config: AdminApiConfig,
  query?: KnowledgeBlockListQuery
): Promise<AdminKnowledgeBlock[]> {
  const response = await requestJson<{ items: AdminKnowledgeBlock[] }>(
    config,
    `/api/admin/knowledge/blocks${toQueryString(query)}`
  );
  return response.items;
}

export async function fetchKnowledgeBlockDetail(
  config: AdminApiConfig,
  blockId: string
): Promise<AdminKnowledgeBlock> {
  return requestJson<AdminKnowledgeBlock>(config, `/api/admin/knowledge/blocks/${blockId}`);
}

export async function createKnowledgeBlock(
  config: AdminApiConfig,
  payload: {
    title: string;
    category: KnowledgeCategory;
    content: string;
    tags: string[];
    status: KnowledgeBlockStatus;
    priority: number;
    source?: string | null;
  }
): Promise<AdminKnowledgeBlock> {
  return requestJson<AdminKnowledgeBlock>(config, "/api/admin/knowledge/blocks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateKnowledgeBlock(
  config: AdminApiConfig,
  blockId: string,
  payload: {
    title: string;
    category: KnowledgeCategory;
    content: string;
    tags: string[];
    status: KnowledgeBlockStatus;
    priority: number;
    source?: string | null;
  }
): Promise<AdminKnowledgeBlock> {
  return requestJson<AdminKnowledgeBlock>(config, `/api/admin/knowledge/blocks/${blockId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteKnowledgeBlock(config: AdminApiConfig, blockId: string): Promise<{ ok: boolean }> {
  return requestJson<{ ok: boolean }>(config, `/api/admin/knowledge/blocks/${blockId}`, {
    method: "DELETE"
  });
}

export async function fetchProjectKnowledge(
  config: AdminApiConfig,
  projectId: string
): Promise<AdminProjectKnowledgeLink[]> {
  const response = await requestJson<{ items: AdminProjectKnowledgeLink[] }>(
    config,
    `/api/admin/knowledge/projects/${projectId}/blocks`
  );
  return response.items;
}

export async function attachProjectKnowledge(
  config: AdminApiConfig,
  projectId: string,
  knowledgeBlockId: string
): Promise<{ ok: boolean }> {
  return requestJson<{ ok: boolean }>(config, `/api/admin/knowledge/projects/${projectId}/blocks`, {
    method: "POST",
    body: JSON.stringify({ knowledge_block_id: knowledgeBlockId })
  });
}

export async function detachProjectKnowledge(
  config: AdminApiConfig,
  projectId: string,
  knowledgeBlockId: string
): Promise<{ ok: boolean }> {
  return requestJson<{ ok: boolean }>(config, `/api/admin/knowledge/projects/${projectId}/blocks/${knowledgeBlockId}`, {
    method: "DELETE"
  });
}
