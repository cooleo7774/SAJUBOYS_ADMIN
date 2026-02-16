import { requestJson } from "./client";
import type {
  AdminApiConfig,
  AdminProjectDetail,
  AdminProjectSummary,
  PublishAdminProjectPayload,
  PublishAdminProjectResult
} from "./types";

export async function fetchAdminProjects(config: AdminApiConfig): Promise<AdminProjectSummary[]> {
  const response = await requestJson<{ items: AdminProjectSummary[] }>(config, "/api/admin/knowledge/projects");
  return response.items;
}

export async function fetchAdminProjectDetail(
  config: AdminApiConfig,
  projectId: string
): Promise<AdminProjectDetail> {
  return requestJson<AdminProjectDetail>(config, `/api/admin/knowledge/projects/${projectId}`);
}

export async function createAdminProject(
  config: AdminApiConfig,
  payload: {
    project_key: string;
    name: string;
    language: string;
    goal: string;
    tone: string;
    context_text: string;
    guardrails_must: string[];
    guardrails_avoid: string[];
  }
): Promise<AdminProjectDetail> {
  return requestJson<AdminProjectDetail>(config, "/api/admin/knowledge/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAdminProjectContext(
  config: AdminApiConfig,
  projectId: string,
  payload: {
    goal: string;
    tone: string;
    context_text: string;
    guardrails_must: string[];
    guardrails_avoid: string[];
  }
): Promise<AdminProjectDetail> {
  return requestJson<AdminProjectDetail>(config, `/api/admin/knowledge/projects/${projectId}/context`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function createAdminProjectExample(
  config: AdminApiConfig,
  projectId: string,
  payload: {
    label: string;
    kind: "good" | "bad";
    user_prompt: string;
    expected_output: string;
    language: string;
    priority: number;
  }
): Promise<AdminProjectDetail> {
  return requestJson<AdminProjectDetail>(config, `/api/admin/knowledge/projects/${projectId}/examples`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function publishAdminProject(
  config: AdminApiConfig,
  projectId: string,
  payload: PublishAdminProjectPayload
): Promise<PublishAdminProjectResult> {
  return requestJson<PublishAdminProjectResult>(config, `/api/admin/knowledge/projects/${projectId}/publish`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
