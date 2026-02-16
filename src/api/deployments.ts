import { requestJson } from "./client";
import type { AdminApiConfig } from "./types";

export type DeploymentSnapshot = {
  id: string;
  project_id: string;
  version: string;
  release_note: string;
  snapshot_json: Record<string, unknown>;
  created_at: string;
};

export async function fetchDeployments(
  config: AdminApiConfig,
  projectId: string
): Promise<DeploymentSnapshot[]> {
  const response = await requestJson<{ items: DeploymentSnapshot[] }>(
    config,
    `/api/admin/deployments?project_id=${encodeURIComponent(projectId)}`
  );
  return response.items;
}

export async function createDeployment(
  config: AdminApiConfig,
  payload: {
    project_id: string;
    version: string;
    release_note: string;
    snapshot_json: Record<string, unknown>;
  }
): Promise<DeploymentSnapshot> {
  return requestJson<DeploymentSnapshot>(config, "/api/admin/deployments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
