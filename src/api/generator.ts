import { requestJson } from "./client";
import type { AdminApiConfig } from "./types";

export type SajuCalculateRequest = {
  birth_date: string;
  birth_time?: string;
  gender: "male" | "female" | "other";
};

export type SajuPillar = {
  stem: string;
  branch: string;
  element: "wood" | "fire" | "earth" | "metal" | "water";
};

export type SajuChart = {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar;
  five_elements: Record<"wood" | "fire" | "earth" | "metal" | "water", number>;
  ten_gods: string[];
};

export type GenerateRequest = {
  project_id: string;
  product_type: "daily_fortune" | "compatibility" | "full_reading";
  prompt: string;
  assembled_prompt: string;
  saju_chart: SajuChart;
};

export type GenerateResponse = {
  output: string;
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
};

export type GenerationHistoryItem = {
  id: string;
  project_id: string;
  product_type: "daily_fortune" | "compatibility" | "full_reading";
  input_json: Record<string, unknown>;
  prompt_text: string;
  output_text: string;
  created_at: string;
};

export async function calculateSaju(
  config: AdminApiConfig,
  payload: SajuCalculateRequest
): Promise<SajuChart> {
  return requestJson<SajuChart>(config, "/api/admin/saju/calculate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function generateReading(
  config: AdminApiConfig,
  payload: GenerateRequest
): Promise<GenerateResponse> {
  return requestJson<GenerateResponse>(config, "/api/admin/generate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchGenerationHistory(
  config: AdminApiConfig,
  projectId: string
): Promise<GenerationHistoryItem[]> {
  const response = await requestJson<{ items: GenerationHistoryItem[] }>(
    config,
    `/api/admin/generations?project_id=${encodeURIComponent(projectId)}`
  );
  return response.items;
}

export async function createGenerationHistory(
  config: AdminApiConfig,
  payload: {
    project_id: string;
    product_type: "daily_fortune" | "compatibility" | "full_reading";
    input_json: Record<string, unknown>;
    prompt_text: string;
    output_text: string;
  }
): Promise<GenerationHistoryItem> {
  return requestJson<GenerationHistoryItem>(config, "/api/admin/generations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
