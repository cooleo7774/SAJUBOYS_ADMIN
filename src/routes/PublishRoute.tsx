import { useStudio } from "../components/studio/StudioContext";

export function PublishRoute() {
  const studio = useStudio();

  return (
    <div className="tab-content">
      <h3>Release Checklist</h3>
      <ul className="checklist">
        <li>필수 가드레일 포함 여부 확인</li>
        <li>나쁜 예시 패턴 미포함 검증</li>
        <li>평가 케이스 similarity 70% 이상</li>
        <li>knowledge_version 메타 기록</li>
        <li>사전학습 데이터 누락 여부 확인 ({studio.trainingCorpus.length} items)</li>
      </ul>
      <label>
        <span>Style Mode</span>
        <input value={studio.styleMode} onChange={(event) => studio.setStyleMode(event.target.value)} />
      </label>
      <label>
        <span>Requested Knowledge Version (optional)</span>
        <input value={studio.requestedKnowledgeVersion} onChange={(event) => studio.setRequestedKnowledgeVersion(event.target.value)} />
      </label>
      <label>
        <span>Release Note</span>
        <textarea value={studio.releaseNote} onChange={(event) => studio.setReleaseNote(event.target.value)} />
      </label>
      <p className="muted">
        현재 상태: <strong>{studio.activeProject?.status ?? "n/a"}</strong> | 마지막 수정일: {studio.activeProject?.updated_at ?? "n/a"}
      </p>
    </div>
  );
}
