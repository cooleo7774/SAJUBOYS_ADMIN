export type AdminProjectSummary = {
  id: string;
  project_key: string;
  name: string;
  status: "draft" | "published" | "archived";
  language: string;
  current_knowledge_version: string | null;
  updated_at: string;
  example_count: number;
};

export type AdminProjectDetail = {
  id: string;
  project_key: string;
  name: string;
  status: "draft" | "published" | "archived";
  language: string;
  goal: string;
  tone: string;
  context_text: string;
  current_knowledge_version: string | null;
  guardrails_must: string[];
  guardrails_avoid: string[];
  examples: Array<{
    id: string;
    label: string;
    kind: "good" | "bad";
    user_prompt: string;
    expected_output: string;
    language: string;
    priority: number;
    created_at: string;
    updated_at: string;
  }>;
  updated_at: string;
};

type AdminApiConfig = {
  baseUrl: string;
  apiKey: string;
  bearerToken: string;
};

function buildHeaders(config: AdminApiConfig): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (config.apiKey.trim().length > 0) {
    headers["x-admin-api-key"] = config.apiKey.trim();
  }

  if (config.bearerToken.trim().length > 0) {
    headers.Authorization = `Bearer ${config.bearerToken.trim()}`;
  }

  return headers;
}

async function requestJson<T>(config: AdminApiConfig, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(config),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const maybeJson = (await response
      .json()
      .catch(() => ({ message: `${response.status} ${response.statusText}` }))) as { message?: string };
    throw new Error(maybeJson.message ?? `request_failed:${response.status}`);
  }

  return (await response.json()) as T;
}

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
  payload: {
    knowledge_version?: string;
    release_note?: string;
    style_mode: string;
  }
): Promise<{
  project: AdminProjectDetail;
  knowledge_version: string;
  published_at: string;
}> {
  return requestJson<{
    project: AdminProjectDetail;
    knowledge_version: string;
    published_at: string;
  }>(config, `/api/admin/knowledge/projects/${projectId}/publish`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
