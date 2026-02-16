export type AdminProjectStatus = "draft" | "published" | "archived";

export type AdminProjectSummary = {
  id: string;
  project_key: string;
  name: string;
  status: AdminProjectStatus;
  language: string;
  current_knowledge_version: string | null;
  updated_at: string;
  example_count: number;
};

export type AdminProjectExample = {
  id: string;
  label: string;
  kind: "good" | "bad";
  user_prompt: string;
  expected_output: string;
  language: string;
  priority: number;
  created_at: string;
  updated_at: string;
};

export type AdminProjectDetail = {
  id: string;
  project_key: string;
  name: string;
  status: AdminProjectStatus;
  language: string;
  goal: string;
  tone: string;
  context_text: string;
  current_knowledge_version: string | null;
  guardrails_must: string[];
  guardrails_avoid: string[];
  examples: AdminProjectExample[];
  updated_at: string;
};

export type AdminApiConfig = {
  baseUrl: string;
  apiKey: string;
  bearerToken: string;
};

export type PublishAdminProjectPayload = {
  knowledge_version?: string;
  release_note?: string;
  style_mode: string;
};

export type PublishAdminProjectResult = {
  project: AdminProjectDetail;
  knowledge_version: string;
  published_at: string;
};
