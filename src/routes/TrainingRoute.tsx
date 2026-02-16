import { useStudio } from "../components/studio/StudioContext";
import type { TrainingCorpusItem } from "../types/studio";

export function TrainingRoute() {
  const studio = useStudio();

  return (
    <div className="tab-content">
      <p className="muted">
        사전학습 데이터는 프로젝트 context에 함께 저장됩니다. `Save Draft` 후 `Publish`하면 버전 스냅샷에 포함됩니다.
      </p>
      <div className="toolbar-inline">
        <button type="button" onClick={studio.handleExportTrainingCorpus}>
          Export JSON
        </button>
      </div>

      <div className="training-grid">
        {studio.trainingCorpus.map((item) => (
          <article
            key={item.id}
            className={`training-card ${studio.selectedTrainingId === item.id ? "active" : ""}`}
            onClick={() => studio.setSelectedTrainingId(item.id)}
          >
            <div className="panel-header-inline">
              <strong>{item.title}</strong>
              <button
                type="button"
                className="danger-light"
                onClick={(event) => {
                  event.stopPropagation();
                  studio.handleDeleteTrainingItem(item.id);
                }}
              >
                Remove
              </button>
            </div>
            <p className="muted">
              [{item.category}] priority {item.priority}
            </p>
            <p>{item.content}</p>
            {item.tags.length > 0 ? <p className="muted">tags: {item.tags.join(", ")}</p> : null}
            {item.source ? <p className="muted">source: {item.source}</p> : null}
          </article>
        ))}
        {studio.trainingCorpus.length === 0 ? <p className="muted">아직 등록된 학습 데이터가 없습니다.</p> : null}
      </div>

      <div className="split">
        <label>
          <span>Category</span>
          <select
            value={studio.trainingCategory}
            onChange={(event) => studio.setTrainingCategory(event.target.value as TrainingCorpusItem["category"])}
          >
            <option value="base_principle">base_principle</option>
            <option value="compatibility">compatibility</option>
            <option value="timing">timing</option>
            <option value="communication">communication</option>
            <option value="custom">custom</option>
          </select>
        </label>
        <label>
          <span>Priority</span>
          <input value={studio.trainingPriority} onChange={(event) => studio.setTrainingPriority(event.target.value)} placeholder="100" />
        </label>
      </div>
      <label>
        <span>Title</span>
        <input
          value={studio.trainingTitle}
          onChange={(event) => studio.setTrainingTitle(event.target.value)}
          placeholder="예: 궁합 해석 기본 원칙"
        />
      </label>
      <label>
        <span>Content</span>
        <textarea
          value={studio.trainingContent}
          onChange={(event) => studio.setTrainingContent(event.target.value)}
          placeholder="학습시킬 핵심 규칙/설명"
        />
      </label>
      <div className="split">
        <label>
          <span>Source</span>
          <input
            value={studio.trainingSource}
            onChange={(event) => studio.setTrainingSource(event.target.value)}
            placeholder="내부 문서/레퍼런스 이름"
          />
        </label>
        <label>
          <span>Tags (comma-separated)</span>
          <input
            value={studio.trainingTags}
            onChange={(event) => studio.setTrainingTags(event.target.value)}
            placeholder="궁합,연락타이밍,리스크"
          />
        </label>
      </div>
      <button type="button" onClick={studio.handleAddTrainingItem}>
        Add Training Data
      </button>
      {studio.selectedTrainingItem ? (
        <div className="preview-block">
          <h3>Selected Item</h3>
          <p>{studio.selectedTrainingItem.content}</p>
        </div>
      ) : null}
    </div>
  );
}
