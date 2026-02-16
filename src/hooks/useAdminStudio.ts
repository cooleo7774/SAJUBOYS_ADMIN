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
} from "../api";
import { sampleProjects } from "../studio-data";
import {
  DEFAULT_TONE_PROFILE,
  TONE_PRESETS,
  type ToneMannerProfile,
  type TrainingCorpusItem
} from "../types/studio";
import {
  buildContextPayload,
  buildToneGuide,
  extractContextPayload,
  normalizeToneProfile,
  normalizeTrainingCorpus,
  summarizeTrainingCorpus
} from "../utils/contextPayload";
import { generateDraft } from "../utils/generateDraft";
import { scoreSimilarity } from "../utils/similarity";
import { createLocalId, splitComma, splitLines } from "../utils/text";

const DEFAULT_API_BASE_URL = (() => {
  const fromEnv = import.meta.env.VITE_DEFAULT_API_BASE_URL?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://127.0.0.1:4000";
})();
const OPERATION_MODE = import.meta.env.VITE_ADMIN_OPERATION_MODE === "true";

const FALLBACK_SUMMARIES: AdminProjectSummary[] = sampleProjects.map((item) => ({
  id: item.id,
  project_key: item.id,
  name: item.name,
  status: item.status,
  language: "ko",
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
      language: "ko",
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
        language: "ko",
        priority: 100,
        created_at: item.updatedAt,
        updated_at: item.updatedAt
      })),
      updated_at: item.updatedAt
    }
  ])
);

export function useAdminStudioState() {
  const [apiBaseUrl, setApiBaseUrl] = useState(() =>
    OPERATION_MODE ? DEFAULT_API_BASE_URL : window.localStorage.getItem("sb_admin_api_base_url") ?? DEFAULT_API_BASE_URL
  );
  const [apiKey, setApiKey] = useState(() =>
    OPERATION_MODE ? "" : window.localStorage.getItem("sb_admin_api_key") ?? ""
  );
  const [bearerToken, setBearerToken] = useState(() =>
    OPERATION_MODE ? "" : window.localStorage.getItem("sb_admin_bearer_token") ?? ""
  );
  const [useFallback, setUseFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastAction, setLastAction] = useState("Ready");

  const [projects, setProjects] = useState<AdminProjectSummary[]>(FALLBACK_SUMMARIES);
  const [activeProjectId, setActiveProjectId] = useState(FALLBACK_SUMMARIES[0]?.id ?? "");
  const [activeProject, setActiveProject] = useState<AdminProjectDetail | null>(
    FALLBACK_SUMMARIES[0] ? FALLBACK_DETAILS[FALLBACK_SUMMARIES[0].id] : null
  );

  const [goalDraft, setGoalDraft] = useState("");
  const [toneDraft, setToneDraft] = useState("");
  const [contextDraft, setContextDraft] = useState("");
  const [mustDraft, setMustDraft] = useState("");
  const [avoidDraft, setAvoidDraft] = useState("");

  const [toneProfile, setToneProfile] = useState<ToneMannerProfile>(DEFAULT_TONE_PROFILE);
  const [trainingCorpus, setTrainingCorpus] = useState<TrainingCorpusItem[]>([]);
  const [trainingCategory, setTrainingCategory] = useState<TrainingCorpusItem["category"]>("base_principle");
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingContent, setTrainingContent] = useState("");
  const [trainingSource, setTrainingSource] = useState("");
  const [trainingTags, setTrainingTags] = useState("");
  const [trainingPriority, setTrainingPriority] = useState("100");
  const [selectedTrainingId, setSelectedTrainingId] = useState("");

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

  const selectedTrainingItem = useMemo(
    () => trainingCorpus.find((item) => item.id === selectedTrainingId) ?? null,
    [trainingCorpus, selectedTrainingId]
  );

  const toneGuide = useMemo(() => buildToneGuide(toneProfile), [toneProfile]);
  const trainingSummary = useMemo(() => summarizeTrainingCorpus(trainingCorpus), [trainingCorpus]);

  const similarity = useMemo(() => {
    if (!selectedExample || !generatedOutput) {
      return 0;
    }
    return scoreSimilarity(selectedExample.expected_output, generatedOutput);
  }, [selectedExample, generatedOutput]);

  useEffect(() => {
    if (OPERATION_MODE) {
      return;
    }
    window.localStorage.setItem("sb_admin_api_base_url", apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    if (OPERATION_MODE) {
      return;
    }
    window.localStorage.setItem("sb_admin_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (OPERATION_MODE) {
      return;
    }
    window.localStorage.setItem("sb_admin_bearer_token", bearerToken);
  }, [bearerToken]);

  useEffect(() => {
    if (!activeProject) {
      setGoalDraft("");
      setToneDraft("");
      setContextDraft("");
      setMustDraft("");
      setAvoidDraft("");
      setToneProfile(DEFAULT_TONE_PROFILE);
      setTrainingCorpus([]);
      setSelectedTrainingId("");
      return;
    }

    const parsed = extractContextPayload(activeProject.context_text);
    setGoalDraft(activeProject.goal);
    setToneDraft(activeProject.tone);
    setContextDraft(parsed.plainContext);
    setMustDraft(activeProject.guardrails_must.join("\n"));
    setAvoidDraft(activeProject.guardrails_avoid.join("\n"));
    setRequestedKnowledgeVersion(activeProject.current_knowledge_version ?? "");
    setToneProfile(normalizeToneProfile(parsed.metadata.tone_profile));
    setTrainingCorpus(normalizeTrainingCorpus(parsed.metadata.training_corpus));
    setSelectedTrainingId("");
  }, [activeProject]);

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

  useEffect(() => {
    void handleConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectProject = async (projectId: string) => {
    setActiveProjectId(projectId);
    setSelectedExampleId("");
    setGeneratedOutput("");
    await refreshProjectDetail(projectId);
  };

  const saveDraft = async () => {
    if (!activeProject) {
      return;
    }

    const contextWithMeta = buildContextPayload(contextDraft, {
      tone_profile: toneProfile,
      training_corpus: trainingCorpus
    });

    if (useFallback) {
      setActiveProject({
        ...activeProject,
        goal: goalDraft,
        tone: toneDraft,
        context_text: contextWithMeta,
        guardrails_must: splitLines(mustDraft),
        guardrails_avoid: splitLines(avoidDraft),
        updated_at: new Date().toISOString()
      });
      setLastAction(`Draft updated (fallback): ${new Date().toLocaleTimeString()}`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const updated = await updateAdminProjectContext(apiConfig, activeProject.id, {
        goal: goalDraft,
        tone: toneDraft,
        context_text: contextWithMeta,
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
      referenceOutput: selectedExample?.expected_output ?? "",
      toneGuide,
      trainingHint: trainingSummary
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
        language: "ko",
        goal: "",
        tone: "",
        context_text: buildContextPayload("", {
          tone_profile: DEFAULT_TONE_PROFILE,
          training_corpus: []
        }),
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

  const handleApplyTonePreset = (presetKey: keyof typeof TONE_PRESETS) => {
    setToneProfile(TONE_PRESETS[presetKey]);
    setLastAction(`Tone preset applied: ${presetKey}`);
  };

  const handleAddTrainingItem = () => {
    if (!trainingTitle.trim() || !trainingContent.trim()) {
      setErrorMessage("학습 데이터는 title/content가 필요합니다.");
      return;
    }

    setErrorMessage("");
    const nextItem: TrainingCorpusItem = {
      id: createLocalId("corpus"),
      category: trainingCategory,
      title: trainingTitle.trim(),
      content: trainingContent.trim(),
      source: trainingSource.trim(),
      tags: splitComma(trainingTags),
      priority: Number.isNaN(Number(trainingPriority)) ? 100 : Number(trainingPriority)
    };

    setTrainingCorpus((prev) => [nextItem, ...prev]);
    setSelectedTrainingId(nextItem.id);
    setTrainingTitle("");
    setTrainingContent("");
    setTrainingSource("");
    setTrainingTags("");
    setTrainingPriority("100");
    setLastAction("Training corpus item added");
  };

  const handleDeleteTrainingItem = (id: string) => {
    setTrainingCorpus((prev) => prev.filter((item) => item.id !== id));
    if (selectedTrainingId === id) {
      setSelectedTrainingId("");
    }
    setLastAction("Training corpus item removed");
  };

  const handleExportTrainingCorpus = async () => {
    const payload = JSON.stringify(
      {
        project_id: activeProject?.id ?? "",
        project_key: activeProject?.project_key ?? "",
        exported_at: new Date().toISOString(),
        corpus: trainingCorpus
      },
      null,
      2
    );

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        setLastAction("Training corpus JSON copied to clipboard");
      } else {
        setGeneratedOutput(payload);
        setLastAction("Clipboard unavailable. JSON rendered in preview.");
      }
    } catch {
      setGeneratedOutput(payload);
      setLastAction("Clipboard failed. JSON rendered in preview.");
    }
  };

  return {
    operationMode: OPERATION_MODE,
    apiBaseUrl,
    setApiBaseUrl,
    apiKey,
    setApiKey,
    bearerToken,
    setBearerToken,
    apiConfig,
    useFallback,
    isLoading,
    errorMessage,
    lastAction,
    projects,
    activeProjectId,
    activeProject,
    goalDraft,
    setGoalDraft,
    toneDraft,
    setToneDraft,
    contextDraft,
    setContextDraft,
    mustDraft,
    setMustDraft,
    avoidDraft,
    setAvoidDraft,
    toneProfile,
    setToneProfile,
    trainingCorpus,
    trainingCategory,
    setTrainingCategory,
    trainingTitle,
    setTrainingTitle,
    trainingContent,
    setTrainingContent,
    trainingSource,
    setTrainingSource,
    trainingTags,
    setTrainingTags,
    trainingPriority,
    setTrainingPriority,
    selectedTrainingId,
    setSelectedTrainingId,
    selectedTrainingItem,
    newExampleLabel,
    setNewExampleLabel,
    newExampleKind,
    setNewExampleKind,
    newExamplePrompt,
    setNewExamplePrompt,
    newExampleOutput,
    setNewExampleOutput,
    playgroundPrompt,
    setPlaygroundPrompt,
    selectedExampleId,
    setSelectedExampleId,
    selectedExample,
    generatedOutput,
    setGeneratedOutput,
    releaseNote,
    setReleaseNote,
    styleMode,
    setStyleMode,
    requestedKnowledgeVersion,
    setRequestedKnowledgeVersion,
    toneGuide,
    trainingSummary,
    similarity,
    selectProject,
    handleConnect,
    saveDraft,
    runEval,
    publish,
    handleCreateProject,
    handleAddExample,
    handleApplyTonePreset,
    handleAddTrainingItem,
    handleDeleteTrainingItem,
    handleExportTrainingCorpus
  };
}

export type AdminStudioState = ReturnType<typeof useAdminStudioState>;
