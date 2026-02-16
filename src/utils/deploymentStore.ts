import type { DeploymentSnapshot } from "../api";

const STORAGE_KEY = "sb_admin_deployments_v1";

function readAll(): DeploymentSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as DeploymentSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: DeploymentSnapshot[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listFallbackDeployments(projectId: string): DeploymentSnapshot[] {
  return readAll()
    .filter((item) => item.project_id === projectId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function addFallbackDeployment(payload: {
  project_id: string;
  version: string;
  release_note: string;
  snapshot_json: Record<string, unknown>;
}): DeploymentSnapshot {
  const item: DeploymentSnapshot = {
    id: `dep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    project_id: payload.project_id,
    version: payload.version,
    release_note: payload.release_note,
    snapshot_json: payload.snapshot_json,
    created_at: new Date().toISOString()
  };

  const next = [item, ...readAll()];
  writeAll(next);
  return item;
}
