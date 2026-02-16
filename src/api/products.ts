import { requestJson } from "./client";
import type { AdminApiConfig } from "./types";

export type ProductType = "daily_fortune" | "compatibility" | "full_reading";

export type ProductSettings = {
  product_type: ProductType;
  prompt_template: string;
  tone_profile: Record<string, unknown>;
};

export async function fetchProductSettings(
  config: AdminApiConfig,
  projectId: string
): Promise<ProductSettings> {
  return requestJson<ProductSettings>(config, `/api/admin/products/${projectId}/settings`);
}

export async function updateProductSettings(
  config: AdminApiConfig,
  projectId: string,
  payload: ProductSettings
): Promise<ProductSettings> {
  return requestJson<ProductSettings>(config, `/api/admin/products/${projectId}/settings`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
