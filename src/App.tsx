import { useEffect, useMemo, useState } from "react";
import {
  createAdminProject,
  createAdminProjectExample,
  fetchAdminProjectDetail,
  fetchAdminProjects,
  publishAdminProject,
  updateAdminProjectContext,
  type AdminProjectDetail,
  type AdminProjectSummary
} from "./api";
import { sampleProjects } from "./studio-data";

type TabKey = "context" | "examples" | "playground" | "publish";

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_DEFAULT_API_BASE_URL?.trim() || "http://127.0.0.1:4000";

const FALLBACK_SUMMARIES: AdminProjectSummary[] = sampleProjects.map((item) => ({
  id: item.id,
  project_key: item.id,
  name: item.name,
  status: item.status,
  language: "en",
  current_knowledge_version: item.status === "published" ? "fallback_v1" : null,
  updated_at: item.updatedAt,
  example_count: item.examples.length
}));

const FALLBACK_DETAILS: Record<string, AdminProjectDetail> = Object.fromEntries(
  sampleProjects.map((item) => [
    item.id,
    {
      id: item.id,
      project_key: item.id,
      name: item.name,
      status: item.status,
      language: "en",
      goal: item.goal,
      tone: item.tone,
      context_text: item.context,
      current_knowledge_version: item.status === "published" ? "fallback_v1" : null,
      guardrails_must: item.guardrailsMust,
      guardrails_avoid: item.guardrailsAvoid,
      examples: item.examples.map((example) => ({
        id: example.id,
        label: example.label,
        kind: example.kind,
        user_prompt: example.userPrompt,
        expected_output: example.expectedOutput,
        language: "en",
        priority: 100,
        created_at: item.updatedAt,
        updated_at: item.updatedAt
      })),
      updated_at: item.updatedAt
    }
  ])
);

function scoreSimilarity(target: string, actual: string): number {
  const normalize = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((item) => item.length > 1)
    );

  const targetSet = normalize(target);
  const actualSet = normalize(actual);
  if (targetSet.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const word of targetSet) {
    if (actualSet.has(word)) {
      overlap += 1;
    }
  }

  return Math.round((overlap / targetSet.size) * 100);
}

function splitLines(value: string): string[] {
  return value
    .split(/\n/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function generateDraft(input: {
  prompt: string;
  goal: string;
  tone: string;
  must: string[];
  avoid: string[];
  referenceOutput: string;
}): string {
  const mustText = input.must[0] ?? "실행 가능한 행동 한 줄";
  const avoidText = input.avoid[0] ?? "단정 표현";
  const guide =
    input.referenceOutput.length > 0
      ? input.referenceOutput
      : "관계 리듬과 실행 타이밍을 함께 제시하고, 단정 대신 조건부 문장을 사용하세요.";

  return [
    `요청 해석: ${input.prompt.trim() || "사용자 의도 입력 필요"}`,
    "",
    `목표: ${input.goal || "명시되지 않음"}`,
    `톤: ${input.tone || "명시되지 않음"}`,
    "",
    guide,
    "",
    `오늘의 실행 포인트: ${mustText}`,
    `주의 표현: ${avoidText}는 피하고 조건부 문장으로 안내합니다.`
  ].join("\n");
}

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(
    () => window.localStorage.getItem("sb_admin_api_base_url") ?? DEFAULT_API_BASE_URL
  );
  const [apiKey, setApiKey] = useState(() => window.localStorage.getItem("sb_admin_api_key") ?? "");
  const [bearerToken, setBearerToken] = useState(() => window.localStorage.getItem("sb_admin_bearer_token") ?? "");
  const [useFallback, setUseFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastAction, setLastAction] = useState("Ready");

  const [projects, setProjects] = useState<AdminProjectSummary[]>(FALLBACK_SUMMARIES);
  const [activeProjectId, setActiveProjectId] = useState(FALLBACK_SUMMARIES[0]?.id ?? "");
  const [activeProject, setActiveProject] = useState<AdminProjectDetail | null>(
    FALLBACK_SUMMARIES[0] ? FALLBACK_DETAILS[FALLBACK_SUMMARIES[0].id] : null
  );
  const [tab, setTab] = useState<TabKey>("context");

  const [goalDraft, setGoalDraft] = useState("");
  const [toneDraft, setToneDraft] = useState("");
  const [contextDraft, setContextDraft] = useState("");
  const [mustDraft, setMustDraft] = useState("");
  const [avoidDraft, setAvoidDraft] = useState("");

  const [newExampleLabel, setNewExampleLabel] = useState("");
  const [newExampleKind, setNewExampleKind] = useState<"good" | "bad">("good");
  const [newExamplePrompt, setNewExamplePrompt] = useState("");
  const [newExampleOutput, setNewExampleOutput] = useState("");

  const [playgroundPrompt, setPlaygroundPrompt] = useState("오늘 연락 타이밍을 알고 싶어");
  const [selectedExampleId, setSelectedExampleId] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [releaseNote, setReleaseNote] = useState("");
  const [styleMode, setStyleMode] = useState("expert_report");
  const [requestedKnowledgeVersion, setRequestedKnowledgeVersion] = useState("");

  const apiConfig = useMemo(
    () => ({
      baseUrl: apiBaseUrl.replace(/\/+$/, ""),
      apiKey,
      bearerToken
    }),
    [apiBaseUrl, apiKey, bearerToken]
  );

  const selectedExample = useMemo(
    () => activeProject?.examples.find((example) => example.id === selectedExampleId) ?? null,
    [activeProject, selectedExampleId]
  );

  const similarity = useMemo(() => {
    if (!selectedExample || !generatedOutput) {
      return 0;
    }
    return scoreSimilarity(selectedExample.expected_output, generatedOutput);
  }, [selectedExample, generatedOutput]);

  useEffect(() => {
    window.localStorage.setItem("sb_admin_api_base_url", apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    window.localStorage.setItem("sb_admin_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    window.localStorage.setItem("sb_admin_bearer_token", bearerToken);
  }, [bearerToken]);

  useEffect(() => {
    if (!activeProject) {
      setGoalDraft("");
      setToneDraft("");
      setContextDraft("");
      setMustDraft("");
      setAvoidDraft("");
      return;
    }
    setGoalDraft(activeProject.goal);
    setToneDraft(activeProject.tone);
    setContextDraft(activeProject.context_text);
    setMustDraft(activeProject.guardrails_must.join("\n"));
    setAvoidDraft(activeProject.guardrails_avoid.join("\n"));
    setRequestedKnowledgeVersion(activeProject.current_knowledge_version ?? "");
  }, [activeProject]);

  useEffect(() => {
    void handleConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProjectDetail = async (projectId: string) => {
    if (useFallback) {
      setActiveProject(FALLBACK_DETAILS[projectId] ?? null);
      return;
    }
    const detail = await fetchAdminProjectDetail(apiConfig, projectId);
    setActiveProject(detail);
  };

  const refreshProjects = async (nextProjectId?: string) => {
    if (useFallback) {
      setProjects(FALLBACK_SUMMARIES);
      const targetId = nextProjectId ?? FALLBACK_SUMMARIES[0]?.id ?? "";
      setActiveProjectId(targetId);
      setActiveProject(FALLBACK_DETAILS[targetId] ?? null);
      return;
    }

    const items = await fetchAdminProjects(apiConfig);
    setProjects(items);
    const targetId = nextProjectId ?? items[0]?.id ?? "";
    setActiveProjectId(targetId);
    if (targetId) {
      await refreshProjectDetail(targetId);
    } else {
      setActiveProject(null);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const items = await fetchAdminProjects(apiConfig);
      setUseFallback(false);
      setProjects(items);
      const targetId = items[0]?.id ?? "";
      setActiveProjectId(targetId);
      if (targetId) {
        const detail = await fetchAdminProjectDetail(apiConfig, targetId);
        setActiveProject(detail);
      } else {
        setActiveProject(null);
      }
      setLastAction("Connected to admin API");
    } catch (error) {
      setUseFallback(true);
      setProjects(FALLBACK_SUMMARIES);
      setActiveProjectId(FALLBACK_SUMMARIES[0]?.id ?? "");
      setActiveProject(FALLBACK_SUMMARIES[0] ? FALLBACK_DETAILS[FALLBACK_SUMMARIES[0].id] : null);
      setErrorMessage(error instanceof Error ? error.message : "API connection failed");
      setLastAction("Fallback mode enabled");
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!activeProject) {
      return;
    }

    if (useFallback) {
      setLastAction(`Draft updated (fallback): ${new Date().toLocaleTimeString()}`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const updated = await updateAdminProjectContext(apiConfig, activeProject.id, {
        goal: goalDraft,
        tone: toneDraft,
        context_text: contextDraft,
        guardrails_must: splitLines(mustDraft),
        guardrails_avoid: splitLines(avoidDraft)
      });
      setActiveProject(updated);
      await refreshProjects(updated.id);
      setLastAction(`Draft saved: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const runEval = () => {
    const draft = generateDraft({
      prompt: playgroundPrompt,
      goal: goalDraft,
      tone: toneDraft,
      must: splitLines(mustDraft),
      avoid: splitLines(avoidDraft),
      referenceOutput: selectedExample?.expected_output ?? ""
    });
    const evalScore = selectedExample ? scoreSimilarity(selectedExample.expected_output, draft) : 0;
    setGeneratedOutput(draft);
    setLastAction(`Eval complete: similarity ${selectedExample ? `${evalScore}%` : "n/a"}`);
  };

  const publish = async () => {
    if (!activeProject) {
      return;
    }

    if (useFallback) {
      setLastAction(`Published (fallback): ${activeProject.name}`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const published = await publishAdminProject(apiConfig, activeProject.id, {
        knowledge_version: requestedKnowledgeVersion.trim() || undefined,
        release_note: releaseNote.trim() || undefined,
        style_mode: styleMode
      });
      setActiveProject(published.project);
      await refreshProjects(published.project.id);
      setLastAction(`Published ${published.knowledge_version}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    const key = window.prompt("project_key (lowercase, a-z0-9_-)", "match-soft-v2");
    if (!key) {
      return;
    }
    const name = window.prompt("project name", "New Knowledge Project");
    if (!name) {
      return;
    }

    if (useFallback) {
      setLastAction("Project creation requires API connection");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const created = await createAdminProject(apiConfig, {
        project_key: key.trim(),
        name: name.trim(),
        language: "en",
        goal: "",
        tone: "",
        context_text: "",
        guardrails_must: [],
        guardrails_avoid: []
      });
      setActiveProject(created);
      await refreshProjects(created.id);
      setLastAction(`Created project ${created.project_key}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Create project failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExample = async () => {
    if (!activeProject) {
      return;
    }
    if (!newExampleLabel.trim() || !newExamplePrompt.trim() || !newExampleOutput.trim()) {
      setErrorMessage("example fields are required");
      return;
    }
    if (useFallback) {
      setLastAction("Example add requires API connection");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const updated = await createAdminProjectExample(apiConfig, activeProject.id, {
        label: newExampleLabel.trim(),
        kind: newExampleKind,
        user_prompt: newExamplePrompt.trim(),
        expected_output: newExampleOutput.trim(),
        language: activeProject.language,
        priority: 100
      });
      setActiveProject(updated);
      setNewExampleLabel("");
      setNewExamplePrompt("");
      setNewExampleOutput("");
      await refreshProjects(updated.id);
      setLastAction("Example added");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Add example failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeProject && projects.length === 0) {
    return null;
  }

  return (
    <div className="page-shell">
      <div className="background-mesh" />
      <header className="topbar reveal">
        <div>
          <p className="eyebrow">SAJUBOYS ADMIN</p>
          <h1>Knowledge Studio</h1>
        </div>
        <div className="connection-grid">
          <input
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            placeholder="API Base URL"
          />
          <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Admin API Key" />
          <input
            value={bearerToken}
            onChange={(event) => setBearerToken(event.target.value)}
            placeholder="Bearer Token (optional)"
          />
          <button type="button" className="primary" onClick={handleConnect} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="panel project-panel reveal" data-stagger="1">
          <div className="panel-header-inline">
            <h2>Projects</h2>
            <button type="button" onClick={handleCreateProject}>
              New
            </button>
          </div>
          <p className="muted">모드: {useFallback ? "Fallback" : "API Live"}</p>
          <div className="project-list">
            {projects.map((project) => (
              <button
                key={project.id}
                className={`project-card ${activeProjectId === project.id ? "active" : ""}`}
                onClick={() => {
                  setActiveProjectId(project.id);
                  setSelectedExampleId("");
                  setGeneratedOutput("");
                  void refreshProjectDetail(project.id);
                }}
                type="button"
              >
                <span>{project.name}</span>
                <small>{project.status.toUpperCase()}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel editor-panel reveal" data-stagger="2">
          <div className="tabs">
            {(["context", "examples", "playground", "publish"] as TabKey[]).map((item) => (
              <button
                key={item}
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "context" && (
            <div className="tab-content">
              <label>
                <span>Goal</span>
                <textarea value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} />
              </label>
              <label>
                <span>Tone</span>
                <textarea value={toneDraft} onChange={(event) => setToneDraft(event.target.value)} />
              </label>
              <label>
                <span>System Context</span>
                <textarea value={contextDraft} onChange={(event) => setContextDraft(event.target.value)} />
              </label>
              <div className="split">
                <label>
                  <span>Must Guardrails (line-separated)</span>
                  <textarea value={mustDraft} onChange={(event) => setMustDraft(event.target.value)} />
                </label>
                <label>
                  <span>Avoid Guardrails (line-separated)</span>
                  <textarea value={avoidDraft} onChange={(event) => setAvoidDraft(event.target.value)} />
                </label>
              </div>
            </div>
          )}

          {tab === "examples" && (
            <div className="tab-content">
              <h3>Example Outputs</h3>
              <div className="example-grid">
                {(activeProject?.examples ?? []).map((example) => (
                  <button
                    key={example.id}
                    className={`example-card ${selectedExampleId === example.id ? "active" : ""}`}
                    onClick={() => setSelectedExampleId(example.id)}
                    type="button"
                  >
                    <strong>{example.label}</strong>
                    <small>{example.kind === "good" ? "Preferred pattern" : "Avoid pattern"}</small>
                    <p>{example.user_prompt}</p>
                  </button>
                ))}
              </div>
              <div className="split">
                <label>
                  <span>New Example Label</span>
                  <input
                    value={newExampleLabel}
                    onChange={(event) => setNewExampleLabel(event.target.value)}
                    placeholder="좋은 예시 C"
                  />
                </label>
                <label>
                  <span>Kind</span>
                  <select
                    value={newExampleKind}
                    onChange={(event) => setNewExampleKind(event.target.value as "good" | "bad")}
                  >
                    <option value="good">good</option>
                    <option value="bad">bad</option>
                  </select>
                </label>
              </div>
              <label>
                <span>User Prompt</span>
                <textarea value={newExamplePrompt} onChange={(event) => setNewExamplePrompt(event.target.value)} />
              </label>
              <label>
                <span>Expected Output</span>
                <textarea value={newExampleOutput} onChange={(event) => setNewExampleOutput(event.target.value)} />
              </label>
              <button type="button" onClick={handleAddExample}>
                Add Example
              </button>
            </div>
          )}

          {tab === "playground" && (
            <div className="tab-content">
              <label>
                <span>User Prompt</span>
                <textarea
                  value={playgroundPrompt}
                  onChange={(event) => setPlaygroundPrompt(event.target.value)}
                />
              </label>
              <label>
                <span>Reference Example (optional)</span>
                <select
                  value={selectedExampleId}
                  onChange={(event) => setSelectedExampleId(event.target.value)}
                >
                  <option value="">No reference</option>
                  {(activeProject?.examples ?? []).map((example) => (
                    <option key={example.id} value={example.id}>
                      {example.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="primary" onClick={runEval}>
                Generate Preview
              </button>
            </div>
          )}

          {tab === "publish" && (
            <div className="tab-content">
              <h3>Release Checklist</h3>
              <ul className="checklist">
                <li>필수 가드레일 포함 여부 확인</li>
                <li>나쁜 예시 패턴 미포함 검증</li>
                <li>평가 케이스 similarity 70% 이상</li>
                <li>knowledge_version 메타 기록</li>
              </ul>
              <label>
                <span>Style Mode</span>
                <input value={styleMode} onChange={(event) => setStyleMode(event.target.value)} />
              </label>
              <label>
                <span>Requested Knowledge Version (optional)</span>
                <input
                  value={requestedKnowledgeVersion}
                  onChange={(event) => setRequestedKnowledgeVersion(event.target.value)}
                />
              </label>
              <label>
                <span>Release Note</span>
                <textarea value={releaseNote} onChange={(event) => setReleaseNote(event.target.value)} />
              </label>
              <p className="muted">
                현재 상태: <strong>{activeProject?.status ?? "n/a"}</strong> | 마지막 수정일:{" "}
                {activeProject?.updated_at ?? "n/a"}
              </p>
            </div>
          )}
        </section>

        <aside className="panel preview-panel reveal" data-stagger="3">
          <h2>Preview</h2>
          <p className="muted">목표 예시와 생성 결과를 실시간 비교합니다.</p>
          <div className="preview-block">
            <h3>Target Example</h3>
            <p>{selectedExample?.expected_output ?? "예시를 선택하면 기준 출력이 표시됩니다."}</p>
          </div>
          <div className="preview-block">
            <h3>Generated Output</h3>
            <p>{generatedOutput || "아직 생성된 출력이 없습니다."}</p>
          </div>
          <div className="score">
            <span>Similarity</span>
            <strong>{similarity}%</strong>
          </div>
          <p className="muted">{lastAction}</p>
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </aside>
      </main>

      <footer className="action-bar reveal" data-stagger="4">
        <button type="button" onClick={saveDraft} disabled={isLoading || !activeProject}>
          Save Draft
        </button>
        <button type="button" onClick={runEval} disabled={!activeProject}>
          Run Eval
        </button>
        <button type="button" className="primary" onClick={publish} disabled={isLoading || !activeProject}>
          Publish Version
        </button>
      </footer>
    </div>
  );
}
