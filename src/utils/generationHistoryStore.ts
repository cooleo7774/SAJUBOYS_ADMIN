import type { GenerationHistoryItem } from "../api";

const STORAGE_KEY = "sb_admin_generation_history_v1";

function readAll(): GenerationHistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as GenerationHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: GenerationHistoryItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listFallbackGenerationHistory(projectId: string): GenerationHistoryItem[] {
  return readAll()
    .filter((item) => item.project_id === projectId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function addFallbackGenerationHistory(payload: {
  project_id: string;
  product_type: "daily_fortune" | "compatibility" | "full_reading";
  input_json: Record<string, unknown>;
  prompt_text: string;
  output_text: string;
}): GenerationHistoryItem {
  const item: GenerationHistoryItem = {
    id: `gen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    project_id: payload.project_id,
    product_type: payload.product_type,
    input_json: payload.input_json,
    prompt_text: payload.prompt_text,
    output_text: payload.output_text,
    created_at: new Date().toISOString()
  };

  const next = [item, ...readAll()];
  writeAll(next);
  return item;
}
