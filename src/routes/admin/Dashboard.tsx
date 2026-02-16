import { useEffect, useMemo, useState } from "react";
import { fetchGenerationHistory, fetchDeployments } from "../../api";
import { useStudio } from "../../components/studio/StudioContext";
import { useProjectKnowledge } from "../../hooks/useProjectKnowledge";
import { listFallbackDeployments } from "../../utils/deploymentStore";
import { listFallbackGenerationHistory } from "../../utils/generationHistoryStore";
import { getProductSettings } from "../../utils/productSettingsStore";

export function Dashboard() {
  const studio = useStudio();
  const project = studio.activeProject;

  const { attachedBlocks, loading: knowledgeLoading } = useProjectKnowledge({
    projectId: studio.activeProjectId,
    useFallback: studio.useFallback,
    apiConfig: studio.apiConfig
  });

  const [generationCount, setGenerationCount] = useState(0);
  const [deploymentCount, setDeploymentCount] = useState(0);

  useEffect(() => {
    if (!studio.activeProjectId) {
      setGenerationCount(0);
      setDeploymentCount(0);
      return;
    }

    const load = async () => {
      if (studio.useFallback) {
        setGenerationCount(listFallbackGenerationHistory(studio.activeProjectId).length);
        setDeploymentCount(listFallbackDeployments(studio.activeProjectId).length);
        return;
      }

      try {
        const [histories, deployments] = await Promise.all([
          fetchGenerationHistory(studio.apiConfig, studio.activeProjectId),
          fetchDeployments(studio.apiConfig, studio.activeProjectId)
        ]);
        setGenerationCount(histories.length);
        setDeploymentCount(deployments.length);
      } catch {
        setGenerationCount(listFallbackGenerationHistory(studio.activeProjectId).length);
        setDeploymentCount(listFallbackDeployments(studio.activeProjectId).length);
      }
    };

    void load();
  }, [studio.activeProjectId, studio.apiConfig, studio.useFallback]);

  const settings = useMemo(() => {
    if (!project) {
      return null;
    }
    return getProductSettings(project.id, project.project_key);
  }, [project]);

  const stats = [
    { label: "전체 상품", value: String(studio.projects.length), help: "운영 중인 프로젝트 수" },
    { label: "연결 지식 블록", value: String(attachedBlocks.length), help: "활성 상품 기준" },
    { label: "생성 이력", value: String(generationCount), help: "활성 상품 기준 누적" },
    { label: "배포 이력", value: String(deploymentCount), help: "스냅샷 기반 배포 버전" }
  ];

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>운영 대시보드</h2>
        <p className="muted">상품 상태, 지식 자산, 생성/배포 흐름을 요약합니다.</p>

        <div className="stat-grid">
          {stats.map((item) => (
            <article key={item.label} className="stat-card">
              <p className="eyebrow">{item.label}</p>
              <strong>{item.value}</strong>
              <p className="muted">{item.help}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>활성 상품 요약</h3>
        {project ? (
          <div className="preview-block">
            <p>
              <strong>{project.name}</strong> ({project.project_key})
            </p>
            <p>상태: {project.status}</p>
            <p>상품 유형: {settings?.product_type ?? "미설정"}</p>
            <p>마지막 수정: {project.updated_at}</p>
            <p>가드레일 수: must {project.guardrails_must.length} / avoid {project.guardrails_avoid.length}</p>
            <p>예시 수: {project.examples.length}</p>
            {knowledgeLoading ? <p>지식 연결 로딩 중...</p> : <p>연결 지식 블록: {attachedBlocks.length}</p>}
          </div>
        ) : (
          <p className="muted">활성 상품이 없습니다.</p>
        )}
      </section>

      <section className="panel">
        <h3>운영 체크리스트</h3>
        <ul className="checklist">
          <li>상품 유형/프롬프트 템플릿 최신화</li>
          <li>지식 블록 연결 상태 점검</li>
          <li>생성기 샘플 1회 이상 실행</li>
          <li>배포 전 확인 모달/릴리즈 노트 점검</li>
        </ul>
      </section>
    </div>
  );
}
