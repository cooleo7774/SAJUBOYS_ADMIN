import { useEffect, useMemo, useState } from "react";
import { createDeployment, fetchDeployments, type DeploymentSnapshot } from "../../api";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { useStudio } from "../../components/studio/StudioContext";
import { useProductSettings } from "../../hooks/useProductSettings";
import { useProjectKnowledge } from "../../hooks/useProjectKnowledge";
import { addFallbackDeployment, listFallbackDeployments } from "../../utils/deploymentStore";

export function DeployManager() {
  const studio = useStudio();
  const project = studio.activeProject;

  const settingsState = useProductSettings({
    projectId: project?.id ?? "",
    projectKey: project?.project_key ?? "",
    useFallback: studio.useFallback,
    apiConfig: studio.apiConfig
  });

  const { attachedBlocks } = useProjectKnowledge({
    projectId: project?.id ?? "",
    useFallback: studio.useFallback,
    apiConfig: studio.apiConfig
  });

  const [version, setVersion] = useState(defaultVersion());
  const [releaseNote, setReleaseNote] = useState("지식 블록/프롬프트 템플릿 업데이트");
  const [deployments, setDeployments] = useState<DeploymentSnapshot[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const loadDeployments = async () => {
    if (!project) {
      setDeployments([]);
      return;
    }

    if (studio.useFallback) {
      setDeployments(listFallbackDeployments(project.id));
      return;
    }

    try {
      const items = await fetchDeployments(studio.apiConfig, project.id);
      setDeployments(items);
    } catch {
      setDeployments(listFallbackDeployments(project.id));
    }
  };

  useEffect(() => {
    void loadDeployments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, studio.useFallback]);

  const snapshot = useMemo(() => {
    if (!project || !settingsState.settings) {
      return null;
    }

    return {
      project: {
        id: project.id,
        key: project.project_key,
        name: project.name,
        status: project.status,
        goal: studio.goalDraft,
        tone: studio.toneDraft,
        context: studio.contextDraft,
        must_guardrails: studio.mustDraft,
        avoid_guardrails: studio.avoidDraft
      },
      product_settings: settingsState.settings,
      knowledge_blocks: attachedBlocks.map((block) => ({
        id: block.id,
        category: block.category,
        title: block.title,
        priority: block.priority,
        updated_at: block.updated_at
      })),
      generated_at: new Date().toISOString()
    };
  }, [attachedBlocks, project, settingsState.settings, studio.avoidDraft, studio.contextDraft, studio.goalDraft, studio.mustDraft, studio.toneDraft]);

  const deploy = async () => {
    if (!project || !snapshot) {
      setErrorMessage("배포할 프로젝트 정보가 없습니다.");
      return;
    }

    setIsDeploying(true);
    setErrorMessage("");

    try {
      if (studio.useFallback) {
        addFallbackDeployment({
          project_id: project.id,
          version,
          release_note: releaseNote,
          snapshot_json: snapshot
        });
      } else {
        try {
          await createDeployment(studio.apiConfig, {
            project_id: project.id,
            version,
            release_note: releaseNote,
            snapshot_json: snapshot
          });
        } catch {
          addFallbackDeployment({
            project_id: project.id,
            version,
            release_note: releaseNote,
            snapshot_json: snapshot
          });
        }
      }

      setVersion(defaultVersion());
      setReleaseNote("지식 블록/프롬프트 템플릿 업데이트");
      await loadDeployments();
      setModalOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "배포 처리 실패");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>배포 관리</h2>
        <p className="muted">지식 블록 연결 상태를 포함한 스냅샷 버전을 생성하고 배포 타임라인을 추적합니다.</p>

        <div className="split">
          <label>
            <span>배포 버전</span>
            <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="dep_20260216_0001" />
          </label>
          <label>
            <span>연결 지식 블록 수</span>
            <input value={String(attachedBlocks.length)} readOnly />
          </label>
        </div>

        <label>
          <span>릴리즈 노트</span>
          <textarea value={releaseNote} onChange={(event) => setReleaseNote(event.target.value)} />
        </label>

        <button type="button" className="primary" onClick={() => setModalOpen(true)} disabled={isDeploying}>
          {isDeploying ? "배포 중..." : "스냅샷 배포"}
        </button>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>

      <section className="panel">
        <h3>배포 타임라인</h3>
        <div className="training-grid">
          {deployments.map((item) => (
            <article key={item.id} className="training-card">
              <div className="panel-header-inline">
                <strong>{item.version}</strong>
                <small>{item.created_at}</small>
              </div>
              <p>{item.release_note}</p>
            </article>
          ))}
          {deployments.length === 0 ? <p className="muted">아직 배포 이력이 없습니다.</p> : null}
        </div>
      </section>

      <ConfirmModal
        open={modalOpen}
        title="배포 스냅샷 생성"
        description="현재 상품 설정/가드레일/지식 연결 상태를 스냅샷으로 저장하고 배포 타임라인에 추가합니다."
        confirmLabel="배포 실행"
        cancelLabel="취소"
        onConfirm={() => {
          void deploy();
        }}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}

function defaultVersion(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `dep_${yyyy}${mm}${dd}_${hh}${mi}`;
}
