import { Solar } from "lunar-javascript";

type Env = {
  ADMIN_DATA_KV?: {
    get: (key: string, options?: { type?: "text" | "json" }) => Promise<unknown>;
    put: (key: string, value: string) => Promise<void>;
  };
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

type AdminProjectExample = {
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

type AdminProject = {
  id: string;
  project_key: string;
  name: string;
  status: "draft" | "published" | "archived";
  language: string;
  goal: string;
  tone: string;
  context_text: string;
  guardrails_must: string[];
  guardrails_avoid: string[];
  examples: AdminProjectExample[];
  current_knowledge_version: string | null;
  updated_at: string;
  product_type: "daily_fortune" | "compatibility" | "full_reading";
  prompt_template: string;
  tone_profile: Record<string, unknown>;
};

type KnowledgeCategory =
  | "cheon_gan"
  | "ji_ji"
  | "ohaeng"
  | "sib_i_unseong"
  | "sibseong"
  | "sinsal"
  | "compatibility_principle"
  | "fortune_principle"
  | "tongbyeon"
  | "interpretation_guide"
  | "custom";

type AdminKnowledgeBlock = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  priority: number;
  source: string | null;
  created_at: string;
  updated_at: string;
};

type AdminProjectKnowledgeLink = {
  project_id: string;
  knowledge_block_id: string;
  attached_at: string;
};

type SajuChart = {
  year: { stem: string; branch: string; element: "wood" | "fire" | "earth" | "metal" | "water" };
  month: { stem: string; branch: string; element: "wood" | "fire" | "earth" | "metal" | "water" };
  day: { stem: string; branch: string; element: "wood" | "fire" | "earth" | "metal" | "water" };
  hour: { stem: string; branch: string; element: "wood" | "fire" | "earth" | "metal" | "water" };
  five_elements: Record<"wood" | "fire" | "earth" | "metal" | "water", number>;
  ten_gods: string[];
};

type GenerationHistoryItem = {
  id: string;
  project_id: string;
  product_type: "daily_fortune" | "compatibility" | "full_reading";
  input_json: Record<string, unknown>;
  prompt_text: string;
  output_text: string;
  created_at: string;
};

type DeploymentSnapshot = {
  id: string;
  project_id: string;
  version: string;
  release_note: string;
  snapshot_json: Record<string, unknown>;
  created_at: string;
};

type AdminDb = {
  projects: AdminProject[];
  knowledge_blocks: AdminKnowledgeBlock[];
  project_knowledge: AdminProjectKnowledgeLink[];
  generations: GenerationHistoryItem[];
  deployments: DeploymentSnapshot[];
};

const DB_KEY = "admin-db-v2";

export const onRequest: PagesFunction<Env> = async (context) => {
  const method = context.request.method.toUpperCase();
  const pathParam = context.params.path;
  const segments = Array.isArray(pathParam) ? pathParam : typeof pathParam === "string" ? [pathParam] : [];

  if (method === "OPTIONS") {
    return jsonResponse({ ok: true }, 200);
  }

  try {
    if (method === "GET" && isPath(segments, ["knowledge", "projects"])) {
      return handleGetProjects(context);
    }

    if (method === "POST" && isPath(segments, ["knowledge", "projects"])) {
      return handleCreateProject(context);
    }

    if (method === "GET" && segments[0] === "knowledge" && segments[1] === "projects" && segments.length === 3) {
      return handleGetProjectDetail(context, segments[2]);
    }

    if (method === "PUT" && segments[0] === "knowledge" && segments[1] === "projects" && segments[3] === "context") {
      return handleUpdateProjectContext(context, segments[2]);
    }

    if (method === "POST" && segments[0] === "knowledge" && segments[1] === "projects" && segments[3] === "examples") {
      return handleCreateProjectExample(context, segments[2]);
    }

    if (method === "POST" && segments[0] === "knowledge" && segments[1] === "projects" && segments[3] === "publish") {
      return handlePublishProject(context, segments[2]);
    }

    if (method === "GET" && isPath(segments, ["knowledge", "blocks"])) {
      return handleGetKnowledgeBlocks(context);
    }

    if (method === "POST" && isPath(segments, ["knowledge", "blocks"])) {
      return handleCreateKnowledgeBlock(context);
    }

    if (method === "GET" && segments[0] === "knowledge" && segments[1] === "blocks" && segments.length === 3) {
      return handleGetKnowledgeBlock(context, segments[2]);
    }

    if (method === "PUT" && segments[0] === "knowledge" && segments[1] === "blocks" && segments.length === 3) {
      return handleUpdateKnowledgeBlock(context, segments[2]);
    }

    if (method === "DELETE" && segments[0] === "knowledge" && segments[1] === "blocks" && segments.length === 3) {
      return handleDeleteKnowledgeBlock(context, segments[2]);
    }

    if (method === "GET" && segments[0] === "knowledge" && segments[1] === "projects" && segments[3] === "blocks") {
      return handleGetProjectKnowledge(context, segments[2]);
    }

    if (method === "POST" && segments[0] === "knowledge" && segments[1] === "projects" && segments[3] === "blocks") {
      return handleAttachProjectKnowledge(context, segments[2]);
    }

    if (
      method === "DELETE" &&
      segments[0] === "knowledge" &&
      segments[1] === "projects" &&
      segments[3] === "blocks" &&
      segments.length === 5
    ) {
      return handleDetachProjectKnowledge(context, segments[2], segments[4]);
    }

    if (method === "GET" && segments[0] === "products" && segments[2] === "settings") {
      return handleGetProductSettings(context, segments[1]);
    }

    if (method === "PUT" && segments[0] === "products" && segments[2] === "settings") {
      return handleUpdateProductSettings(context, segments[1]);
    }

    if (method === "POST" && isPath(segments, ["saju", "calculate"])) {
      return handleSajuCalculate(context);
    }

    if (method === "POST" && isPath(segments, ["generate"])) {
      return handleGenerate(context);
    }

    if (method === "GET" && isPath(segments, ["generations"])) {
      return handleGetGenerations(context);
    }

    if (method === "POST" && isPath(segments, ["generations"])) {
      return handleCreateGeneration(context);
    }

    if (method === "GET" && isPath(segments, ["deployments"])) {
      return handleGetDeployments(context);
    }

    if (method === "POST" && isPath(segments, ["deployments"])) {
      return handleCreateDeployment(context);
    }

    return jsonResponse({ message: "Not found" }, 404);
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
};

function isPath(actual: string[], expected: string[]): boolean {
  return actual.length === expected.length && expected.every((item, index) => actual[index] === item);
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-api-key",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    }
  });
}

async function parseJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("invalid_json_payload");
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultPromptTemplate(type: AdminProject["product_type"]): string {
  if (type === "compatibility") {
    return [
      "[역할] 당신은 궁합 전문 해석가입니다.",
      "{{knowledge:compatibility_principle}}",
      "{{knowledge:tongbyeon}}",
      "{{saju_chart}}",
      "{{user_prompt}}"
    ].join("\n");
  }

  if (type === "daily_fortune") {
    return [
      "[역할] 당신은 일일 운세 브리핑 작성자입니다.",
      "{{knowledge:fortune_principle}}",
      "{{knowledge:interpretation_guide}}",
      "{{saju_chart}}",
      "{{user_prompt}}"
    ].join("\n");
  }

  return [
    "[역할] 당신은 종합 사주풀이 해석가입니다.",
    "{{knowledge:cheon_gan}}",
    "{{knowledge:ji_ji}}",
    "{{knowledge:ohaeng}}",
    "{{knowledge:sibseong}}",
    "{{knowledge:tongbyeon}}",
    "{{saju_chart}}",
    "{{user_prompt}}"
  ].join("\n");
}

function seedDatabase(): AdminDb {
  const now = nowIso();
  const project1Id = newId("project");
  const project2Id = newId("project");

  const projects: AdminProject[] = [
    {
      id: project1Id,
      project_key: "match-soft-v1",
      name: "궁합 해설 - 소프트",
      status: "published",
      language: "ko",
      goal: "두 사람의 감정 리듬과 관계 타이밍을 현실적으로 해석",
      tone: "정확하지만 단정하지 않음. 행동 가능한 한 줄 제안 포함.",
      context_text: "사주 해석은 운명 단정이 아니라 패턴 해석이다.",
      guardrails_must: ["실행 가능한 한 문장"],
      guardrails_avoid: ["100% 단정 표현"],
      examples: [
        {
          id: newId("ex"),
          label: "좋은 예시 A",
          kind: "good",
          user_prompt: "내가 먼저 연락해도 될까?",
          expected_output: "짧은 확인 메시지를 먼저 보내고 반응 속도를 관찰하세요.",
          language: "ko",
          priority: 100,
          created_at: now,
          updated_at: now
        }
      ],
      current_knowledge_version: "dep_seed_1",
      updated_at: now,
      product_type: "compatibility",
      prompt_template: defaultPromptTemplate("compatibility"),
      tone_profile: {
        formality: "balanced",
        directness: "soft",
        empathy: "high"
      }
    },
    {
      id: project2Id,
      project_key: "fortune-daily-v1",
      name: "일일 운세 - 액션 브리프",
      status: "draft",
      language: "ko",
      goal: "하루 운세를 실행 가능한 브리핑으로 제공",
      tone: "짧고 명료한 브리핑",
      context_text: "운세는 실행 프롬프트다.",
      guardrails_must: ["오늘 행동 1개 제시"],
      guardrails_avoid: ["신비주의 과장"],
      examples: [],
      current_knowledge_version: null,
      updated_at: now,
      product_type: "daily_fortune",
      prompt_template: defaultPromptTemplate("daily_fortune"),
      tone_profile: {
        formality: "balanced",
        directness: "balanced",
        empathy: "medium"
      }
    }
  ];

  const knowledge_blocks: AdminKnowledgeBlock[] = [
    {
      id: newId("kb"),
      title: "천간 기본 해석 원칙",
      category: "cheon_gan",
      content: "천간은 외부로 드러나는 성향 해석에 우선 적용한다.",
      tags: ["천간", "기본"],
      status: "published",
      priority: 180,
      source: "seed",
      created_at: now,
      updated_at: now
    },
    {
      id: newId("kb"),
      title: "궁합 해석 프레임",
      category: "compatibility_principle",
      content: "감정 리듬, 소통 속도, 갈등 복구 패턴을 중심으로 제시한다.",
      tags: ["궁합", "프레임"],
      status: "published",
      priority: 220,
      source: "seed",
      created_at: now,
      updated_at: now
    },
    {
      id: newId("kb"),
      title: "오행 분포 해석",
      category: "ohaeng",
      content: "과다/결핍은 단정하지 않고 행동 전략과 연결한다.",
      tags: ["오행"],
      status: "draft",
      priority: 140,
      source: "seed",
      created_at: now,
      updated_at: now
    }
  ];

  const project_knowledge: AdminProjectKnowledgeLink[] = [
    {
      project_id: project1Id,
      knowledge_block_id: knowledge_blocks[1].id,
      attached_at: now
    },
    {
      project_id: project2Id,
      knowledge_block_id: knowledge_blocks[2].id,
      attached_at: now
    }
  ];

  return {
    projects,
    knowledge_blocks,
    project_knowledge,
    generations: [],
    deployments: []
  };
}

async function loadDb(env: Env): Promise<AdminDb> {
  const globalStore = globalThis as typeof globalThis & { __SAJUBOYS_ADMIN_DB__?: AdminDb };

  if (env.ADMIN_DATA_KV) {
    const fromKv = await env.ADMIN_DATA_KV.get(DB_KEY, { type: "json" });
    if (fromKv && typeof fromKv === "object") {
      return fromKv as AdminDb;
    }

    const seeded = seedDatabase();
    await env.ADMIN_DATA_KV.put(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  if (!globalStore.__SAJUBOYS_ADMIN_DB__) {
    globalStore.__SAJUBOYS_ADMIN_DB__ = seedDatabase();
  }
  return globalStore.__SAJUBOYS_ADMIN_DB__;
}

async function saveDb(env: Env, db: AdminDb): Promise<void> {
  const globalStore = globalThis as typeof globalThis & { __SAJUBOYS_ADMIN_DB__?: AdminDb };

  if (env.ADMIN_DATA_KV) {
    await env.ADMIN_DATA_KV.put(DB_KEY, JSON.stringify(db));
    return;
  }

  globalStore.__SAJUBOYS_ADMIN_DB__ = db;
}

function findProject(db: AdminDb, projectId: string): AdminProject {
  const project = db.projects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error("project_not_found");
  }
  return project;
}

function projectToSummary(project: AdminProject) {
  return {
    id: project.id,
    project_key: project.project_key,
    name: project.name,
    status: project.status,
    language: project.language,
    current_knowledge_version: project.current_knowledge_version,
    updated_at: project.updated_at,
    example_count: project.examples.length,
    product_type: project.product_type
  };
}

async function handleGetProjects(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const db = await loadDb(context.env);
  return jsonResponse({ items: db.projects.map(projectToSummary) });
}

async function handleCreateProject(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const payload = await parseJson<{
    project_key: string;
    name: string;
    language?: string;
    goal?: string;
    tone?: string;
    context_text?: string;
    guardrails_must?: string[];
    guardrails_avoid?: string[];
  }>(context.request);

  if (!payload.project_key?.trim() || !payload.name?.trim()) {
    return jsonResponse({ message: "project_key_and_name_required" }, 400);
  }

  const db = await loadDb(context.env);
  if (db.projects.some((item) => item.project_key === payload.project_key.trim())) {
    return jsonResponse({ message: "project_key_already_exists" }, 409);
  }

  const now = nowIso();
  const project: AdminProject = {
    id: newId("project"),
    project_key: payload.project_key.trim(),
    name: payload.name.trim(),
    status: "draft",
    language: payload.language?.trim() || "ko",
    goal: payload.goal ?? "",
    tone: payload.tone ?? "",
    context_text: payload.context_text ?? "",
    guardrails_must: Array.isArray(payload.guardrails_must) ? payload.guardrails_must : [],
    guardrails_avoid: Array.isArray(payload.guardrails_avoid) ? payload.guardrails_avoid : [],
    examples: [],
    current_knowledge_version: null,
    updated_at: now,
    product_type: "full_reading",
    prompt_template: defaultPromptTemplate("full_reading"),
    tone_profile: {
      formality: "balanced",
      directness: "balanced",
      empathy: "medium"
    }
  };

  db.projects.unshift(project);
  await saveDb(context.env, db);
  return jsonResponse(project, 201);
}

async function handleGetProjectDetail(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const db = await loadDb(context.env);
  const project = findProject(db, projectId);
  return jsonResponse(project);
}

async function handleUpdateProjectContext(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const payload = await parseJson<{
    goal: string;
    tone: string;
    context_text: string;
    guardrails_must: string[];
    guardrails_avoid: string[];
  }>(context.request);

  const db = await loadDb(context.env);
  const project = findProject(db, projectId);

  project.goal = payload.goal ?? "";
  project.tone = payload.tone ?? "";
  project.context_text = payload.context_text ?? "";
  project.guardrails_must = Array.isArray(payload.guardrails_must) ? payload.guardrails_must : [];
  project.guardrails_avoid = Array.isArray(payload.guardrails_avoid) ? payload.guardrails_avoid : [];
  project.updated_at = nowIso();

  await saveDb(context.env, db);
  return jsonResponse(project);
}

async function handleCreateProjectExample(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const payload = await parseJson<{
    label: string;
    kind: "good" | "bad";
    user_prompt: string;
    expected_output: string;
    language?: string;
    priority?: number;
  }>(context.request);

  if (!payload.label?.trim() || !payload.user_prompt?.trim() || !payload.expected_output?.trim()) {
    return jsonResponse({ message: "label_prompt_output_required" }, 400);
  }

  const db = await loadDb(context.env);
  const project = findProject(db, projectId);
  const now = nowIso();

  const example: AdminProjectExample = {
    id: newId("ex"),
    label: payload.label.trim(),
    kind: payload.kind === "bad" ? "bad" : "good",
    user_prompt: payload.user_prompt.trim(),
    expected_output: payload.expected_output.trim(),
    language: payload.language?.trim() || project.language,
    priority: Number.isFinite(payload.priority) ? Number(payload.priority) : 100,
    created_at: now,
    updated_at: now
  };

  project.examples.unshift(example);
  project.updated_at = now;
  await saveDb(context.env, db);
  return jsonResponse(project, 201);
}

async function handlePublishProject(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const payload = await parseJson<{ knowledge_version?: string; release_note?: string; style_mode?: string }>(context.request);
  const db = await loadDb(context.env);
  const project = findProject(db, projectId);
  const now = nowIso();

  const knowledgeVersion =
    payload.knowledge_version?.trim() ||
    `dep_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

  project.status = "published";
  project.current_knowledge_version = knowledgeVersion;
  project.updated_at = now;

  await saveDb(context.env, db);

  return jsonResponse({
    project,
    knowledge_version: knowledgeVersion,
    published_at: now,
    release_note: payload.release_note ?? "",
    style_mode: payload.style_mode ?? ""
  });
}

async function handleGetKnowledgeBlocks(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const db = await loadDb(context.env);
  const url = new URL(context.request.url);
  const category = url.searchParams.get("category")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const query = url.searchParams.get("q")?.trim().toLowerCase();

  let items = [...db.knowledge_blocks];
  if (category) {
    items = items.filter((item) => item.category === category);
  }
  if (status) {
    items = items.filter((item) => item.status === status);
  }
  if (query) {
    items = items.filter((item) => [item.title, item.content, item.tags.join(" ")].join(" ").toLowerCase().includes(query));
  }

  items.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  return jsonResponse({ items });
}

async function handleGetKnowledgeBlock(
  context: EventContext<Env, string, Record<string, unknown>>,
  blockId: string
): Promise<Response> {
  const db = await loadDb(context.env);
  const block = db.knowledge_blocks.find((item) => item.id === blockId);
  if (!block) {
    return jsonResponse({ message: "knowledge_block_not_found" }, 404);
  }
  return jsonResponse(block);
}

async function handleCreateKnowledgeBlock(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const payload = await parseJson<{
    title: string;
    category: KnowledgeCategory;
    content: string;
    tags?: string[];
    status?: "draft" | "published" | "archived";
    priority?: number;
    source?: string | null;
  }>(context.request);

  if (!payload.title?.trim() || !payload.content?.trim()) {
    return jsonResponse({ message: "title_and_content_required" }, 400);
  }

  const db = await loadDb(context.env);
  const now = nowIso();

  const block: AdminKnowledgeBlock = {
    id: newId("kb"),
    title: payload.title.trim(),
    category: payload.category ?? "custom",
    content: payload.content.trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    status: payload.status ?? "draft",
    priority: Number.isFinite(payload.priority) ? Number(payload.priority) : 100,
    source: payload.source ?? null,
    created_at: now,
    updated_at: now
  };

  db.knowledge_blocks.unshift(block);
  await saveDb(context.env, db);
  return jsonResponse(block, 201);
}

async function handleUpdateKnowledgeBlock(
  context: EventContext<Env, string, Record<string, unknown>>,
  blockId: string
): Promise<Response> {
  const payload = await parseJson<{
    title: string;
    category: KnowledgeCategory;
    content: string;
    tags?: string[];
    status?: "draft" | "published" | "archived";
    priority?: number;
    source?: string | null;
  }>(context.request);

  const db = await loadDb(context.env);
  const block = db.knowledge_blocks.find((item) => item.id === blockId);
  if (!block) {
    return jsonResponse({ message: "knowledge_block_not_found" }, 404);
  }

  block.title = payload.title?.trim() || block.title;
  block.category = payload.category ?? block.category;
  block.content = payload.content?.trim() || block.content;
  block.tags = Array.isArray(payload.tags) ? payload.tags : block.tags;
  block.status = payload.status ?? block.status;
  block.priority = Number.isFinite(payload.priority) ? Number(payload.priority) : block.priority;
  block.source = payload.source ?? block.source;
  block.updated_at = nowIso();

  await saveDb(context.env, db);
  return jsonResponse(block);
}

async function handleDeleteKnowledgeBlock(
  context: EventContext<Env, string, Record<string, unknown>>,
  blockId: string
): Promise<Response> {
  const db = await loadDb(context.env);
  const before = db.knowledge_blocks.length;
  db.knowledge_blocks = db.knowledge_blocks.filter((item) => item.id !== blockId);
  db.project_knowledge = db.project_knowledge.filter((item) => item.knowledge_block_id !== blockId);

  if (db.knowledge_blocks.length === before) {
    return jsonResponse({ message: "knowledge_block_not_found" }, 404);
  }

  await saveDb(context.env, db);
  return jsonResponse({ ok: true });
}

async function handleGetProjectKnowledge(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const db = await loadDb(context.env);
  findProject(db, projectId);

  const items = db.project_knowledge.filter((item) => item.project_id === projectId);
  return jsonResponse({ items });
}

async function handleAttachProjectKnowledge(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const payload = await parseJson<{ knowledge_block_id: string }>(context.request);
  const blockId = payload.knowledge_block_id;

  if (!blockId?.trim()) {
    return jsonResponse({ message: "knowledge_block_id_required" }, 400);
  }

  const db = await loadDb(context.env);
  findProject(db, projectId);

  if (!db.knowledge_blocks.some((item) => item.id === blockId)) {
    return jsonResponse({ message: "knowledge_block_not_found" }, 404);
  }

  const exists = db.project_knowledge.some((item) => item.project_id === projectId && item.knowledge_block_id === blockId);
  if (!exists) {
    db.project_knowledge.push({
      project_id: projectId,
      knowledge_block_id: blockId,
      attached_at: nowIso()
    });
    await saveDb(context.env, db);
  }

  return jsonResponse({ ok: true });
}

async function handleDetachProjectKnowledge(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string,
  blockId: string
): Promise<Response> {
  const db = await loadDb(context.env);
  findProject(db, projectId);

  db.project_knowledge = db.project_knowledge.filter(
    (item) => !(item.project_id === projectId && item.knowledge_block_id === blockId)
  );

  await saveDb(context.env, db);
  return jsonResponse({ ok: true });
}

async function handleGetProductSettings(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const db = await loadDb(context.env);
  const project = findProject(db, projectId);

  return jsonResponse({
    product_type: project.product_type,
    prompt_template: project.prompt_template,
    tone_profile: project.tone_profile
  });
}

async function handleUpdateProductSettings(
  context: EventContext<Env, string, Record<string, unknown>>,
  projectId: string
): Promise<Response> {
  const payload = await parseJson<{
    product_type: AdminProject["product_type"];
    prompt_template: string;
    tone_profile: Record<string, unknown>;
  }>(context.request);

  const db = await loadDb(context.env);
  const project = findProject(db, projectId);

  project.product_type = payload.product_type ?? project.product_type;
  project.prompt_template = payload.prompt_template ?? project.prompt_template;
  project.tone_profile = payload.tone_profile ?? project.tone_profile;
  project.updated_at = nowIso();

  await saveDb(context.env, db);
  return jsonResponse({
    product_type: project.product_type,
    prompt_template: project.prompt_template,
    tone_profile: project.tone_profile
  });
}

async function handleSajuCalculate(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const payload = await parseJson<{ birth_date: string; birth_time?: string; gender: "male" | "female" | "other" }>(context.request);

  if (!payload.birth_date) {
    return jsonResponse({ message: "birth_date_required" }, 400);
  }

  const chart = calculateSaju({
    birthDate: payload.birth_date,
    birthTime: payload.birth_time,
    gender: payload.gender ?? "other"
  });

  return jsonResponse(chart);
}

async function handleGenerate(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const payload = await parseJson<{
    project_id: string;
    product_type: AdminProject["product_type"];
    prompt: string;
    assembled_prompt: string;
    saju_chart: SajuChart;
  }>(context.request);

  if (!payload.assembled_prompt?.trim()) {
    return jsonResponse({ message: "assembled_prompt_required" }, 400);
  }

  const generated = await callLlmOrFallback(context.env, payload);
  return jsonResponse(generated);
}

async function callLlmOrFallback(
  env: Env,
  payload: {
    prompt: string;
    assembled_prompt: string;
    product_type: AdminProject["product_type"];
    saju_chart: SajuChart;
  }
): Promise<{ output: string; model?: string; prompt_tokens?: number; completion_tokens?: number }> {
  if (!env.OPENAI_API_KEY) {
    return {
      output: buildFallbackGeneration(payload)
    };
  }

  const model = env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "당신은 사주 해석을 하는 어시스턴트입니다. 단정 표현을 피하고 한국어로 구체적인 실행 행동을 제시하세요."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${payload.assembled_prompt}\n\n[사용자 질문]\n${payload.prompt}`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`openai_error_${response.status}`);
    }

    const body = (await response.json()) as {
      output_text?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };

    const outputText =
      body.output_text?.trim() ||
      body.output
        ?.flatMap((item) => item.content ?? [])
        .map((item) => item.text ?? "")
        .join("\n")
        .trim();

    return {
      output: outputText && outputText.length > 0 ? outputText : buildFallbackGeneration(payload),
      model,
      prompt_tokens: body.usage?.input_tokens,
      completion_tokens: body.usage?.output_tokens
    };
  } catch {
    return {
      output: buildFallbackGeneration(payload),
      model
    };
  }
}

function buildFallbackGeneration(payload: {
  prompt: string;
  product_type: AdminProject["product_type"];
  saju_chart: SajuChart;
}): string {
  return [
    `[Fallback-${payload.product_type}]`,
    `질문: ${payload.prompt}`,
    "",
    "관계 흐름은 급격한 변화보다 점진적 조율이 유리합니다.",
    "오늘 실행 행동: 짧은 확인 메시지 1회 + 구체적인 시간 제안 1회로 반응을 점검하세요.",
    "주의: 결과를 단정하지 말고 상대 반응 속도에 맞춰 다음 행동을 조정하세요.",
    "",
    `일주 기준: ${payload.saju_chart.day.stem}${payload.saju_chart.day.branch}`,
    `오행 분포: 목${payload.saju_chart.five_elements.wood}/화${payload.saju_chart.five_elements.fire}/토${payload.saju_chart.five_elements.earth}/금${payload.saju_chart.five_elements.metal}/수${payload.saju_chart.five_elements.water}`
  ].join("\n");
}

async function handleGetGenerations(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const db = await loadDb(context.env);
  const url = new URL(context.request.url);
  const projectId = url.searchParams.get("project_id")?.trim();

  const items = db.generations
    .filter((item) => (projectId ? item.project_id === projectId : true))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return jsonResponse({ items });
}

async function handleCreateGeneration(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const payload = await parseJson<{
    project_id: string;
    product_type: AdminProject["product_type"];
    input_json: Record<string, unknown>;
    prompt_text: string;
    output_text: string;
  }>(context.request);

  if (!payload.project_id || !payload.prompt_text || !payload.output_text) {
    return jsonResponse({ message: "project_prompt_output_required" }, 400);
  }

  const db = await loadDb(context.env);
  findProject(db, payload.project_id);

  const item: GenerationHistoryItem = {
    id: newId("gen"),
    project_id: payload.project_id,
    product_type: payload.product_type ?? "full_reading",
    input_json: payload.input_json ?? {},
    prompt_text: payload.prompt_text,
    output_text: payload.output_text,
    created_at: nowIso()
  };

  db.generations.unshift(item);
  await saveDb(context.env, db);

  return jsonResponse(item, 201);
}

async function handleGetDeployments(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const db = await loadDb(context.env);
  const url = new URL(context.request.url);
  const projectId = url.searchParams.get("project_id")?.trim();

  const items = db.deployments
    .filter((item) => (projectId ? item.project_id === projectId : true))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return jsonResponse({ items });
}

async function handleCreateDeployment(context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> {
  const payload = await parseJson<{
    project_id: string;
    version: string;
    release_note?: string;
    snapshot_json?: Record<string, unknown>;
  }>(context.request);

  if (!payload.project_id || !payload.version?.trim()) {
    return jsonResponse({ message: "project_id_and_version_required" }, 400);
  }

  const db = await loadDb(context.env);
  findProject(db, payload.project_id);

  const exists = db.deployments.some((item) => item.project_id === payload.project_id && item.version === payload.version.trim());
  if (exists) {
    return jsonResponse({ message: "deployment_version_already_exists" }, 409);
  }

  const item: DeploymentSnapshot = {
    id: newId("dep"),
    project_id: payload.project_id,
    version: payload.version.trim(),
    release_note: payload.release_note?.trim() ?? "",
    snapshot_json: payload.snapshot_json ?? {},
    created_at: nowIso()
  };

  db.deployments.unshift(item);
  await saveDb(context.env, db);

  return jsonResponse(item, 201);
}

function calculateSaju(input: { birthDate: string; birthTime?: string; gender: "male" | "female" | "other" }): SajuChart {
  type Element = "wood" | "fire" | "earth" | "metal" | "water";
  type KoreanStem = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";
  type KoreanBranch = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";

  const STEM_TO_KOREAN: Record<string, KoreanStem> = {
    甲: "갑",
    乙: "을",
    丙: "병",
    丁: "정",
    戊: "무",
    己: "기",
    庚: "경",
    辛: "신",
    壬: "임",
    癸: "계",
    갑: "갑",
    을: "을",
    병: "병",
    정: "정",
    무: "무",
    기: "기",
    경: "경",
    신: "신",
    임: "임",
    계: "계"
  };
  const BRANCH_TO_KOREAN: Record<string, KoreanBranch> = {
    子: "자",
    丑: "축",
    寅: "인",
    卯: "묘",
    辰: "진",
    巳: "사",
    午: "오",
    未: "미",
    申: "신",
    酉: "유",
    戌: "술",
    亥: "해",
    자: "자",
    축: "축",
    인: "인",
    묘: "묘",
    진: "진",
    사: "사",
    오: "오",
    미: "미",
    신: "신",
    유: "유",
    술: "술",
    해: "해"
  };
  const STEM_ELEMENT: Record<KoreanStem, Element> = {
    갑: "wood",
    을: "wood",
    병: "fire",
    정: "fire",
    무: "earth",
    기: "earth",
    경: "metal",
    신: "metal",
    임: "water",
    계: "water"
  };
  const BRANCH_ELEMENT: Record<KoreanBranch, Element> = {
    자: "water",
    축: "earth",
    인: "wood",
    묘: "wood",
    진: "earth",
    사: "fire",
    오: "fire",
    미: "earth",
    신: "metal",
    유: "metal",
    술: "earth",
    해: "water"
  };

  const normalizeStem = (value: string): KoreanStem => STEM_TO_KOREAN[value] ?? "갑";
  const normalizeBranch = (value: string): KoreanBranch => BRANCH_TO_KOREAN[value] ?? "자";

  try {
    const [year, month, day] = input.birthDate.split("-").map((item) => Number(item));
    const [hour, minute] = (input.birthTime || "12:00").split(":").map((item) => Number(item));

    const solar = Solar.fromYmdHms(year, month, day, hour || 12, minute || 0, 0);
    const lunar = solar.getLunar();
    const ec = lunar.getEightChar();

    const chart: SajuChart = {
      year: {
        stem: normalizeStem(ec.getYearGan()),
        branch: normalizeBranch(ec.getYearZhi()),
        element: "wood"
      },
      month: {
        stem: normalizeStem(ec.getMonthGan()),
        branch: normalizeBranch(ec.getMonthZhi()),
        element: "wood"
      },
      day: {
        stem: normalizeStem(ec.getDayGan()),
        branch: normalizeBranch(ec.getDayZhi()),
        element: "wood"
      },
      hour: {
        stem: normalizeStem(ec.getTimeGan()),
        branch: normalizeBranch(ec.getTimeZhi()),
        element: "wood"
      },
      five_elements: {
        wood: 0,
        fire: 0,
        earth: 0,
        metal: 0,
        water: 0
      },
      ten_gods: []
    };

    chart.year.element = STEM_ELEMENT[chart.year.stem as KoreanStem];
    chart.month.element = STEM_ELEMENT[chart.month.stem as KoreanStem];
    chart.day.element = STEM_ELEMENT[chart.day.stem as KoreanStem];
    chart.hour.element = STEM_ELEMENT[chart.hour.stem as KoreanStem];

    const addElement = (element: Element) => {
      chart.five_elements[element] += 1;
    };

    [chart.year, chart.month, chart.day, chart.hour].forEach((pillar) => {
      addElement(pillar.element as Element);
      addElement(BRANCH_ELEMENT[pillar.branch as KoreanBranch]);
    });

    const tenGodCandidates = [
      typeof (ec as { getYearShiShenGan?: () => string }).getYearShiShenGan === "function"
        ? (ec as { getYearShiShenGan: () => string }).getYearShiShenGan()
        : "",
      typeof (ec as { getMonthShiShenGan?: () => string }).getMonthShiShenGan === "function"
        ? (ec as { getMonthShiShenGan: () => string }).getMonthShiShenGan()
        : "",
      typeof (ec as { getDayShiShenGan?: () => string }).getDayShiShenGan === "function"
        ? (ec as { getDayShiShenGan: () => string }).getDayShiShenGan()
        : "",
      typeof (ec as { getTimeShiShenGan?: () => string }).getTimeShiShenGan === "function"
        ? (ec as { getTimeShiShenGan: () => string }).getTimeShiShenGan()
        : ""
    ].filter((item) => typeof item === "string" && item.trim().length > 0);

    chart.ten_gods =
      tenGodCandidates.length > 0
        ? [`일간:${chart.day.stem}`, ...tenGodCandidates]
        : input.gender === "male"
          ? [`일간:${chart.day.stem}`, "정관", "편재", "식신", "편인"]
          : input.gender === "female"
            ? [`일간:${chart.day.stem}`, "정인", "정재", "상관", "편관"]
            : [`일간:${chart.day.stem}`, "비견", "겁재", "식신", "정인"];

    return chart;
  } catch {
    return {
      year: { stem: "갑", branch: "자", element: "wood" },
      month: { stem: "을", branch: "축", element: "wood" },
      day: { stem: "병", branch: "인", element: "fire" },
      hour: { stem: "정", branch: "묘", element: "fire" },
      five_elements: { wood: 2, fire: 2, earth: 1, metal: 1, water: 2 },
      ten_gods: ["일간:병", "비견", "정인", "식신"]
    };
  }
}
