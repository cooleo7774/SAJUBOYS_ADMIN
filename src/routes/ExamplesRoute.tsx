import { useStudio } from "../components/studio/StudioContext";

export function ExamplesRoute() {
  const studio = useStudio();

  return (
    <div className="tab-content">
      <h3>Example Outputs</h3>
      <div className="example-grid">
        {(studio.activeProject?.examples ?? []).map((example) => (
          <button
            key={example.id}
            className={`example-card ${studio.selectedExampleId === example.id ? "active" : ""}`}
            onClick={() => studio.setSelectedExampleId(example.id)}
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
            value={studio.newExampleLabel}
            onChange={(event) => studio.setNewExampleLabel(event.target.value)}
            placeholder="좋은 예시 C"
          />
        </label>
        <label>
          <span>Kind</span>
          <select value={studio.newExampleKind} onChange={(event) => studio.setNewExampleKind(event.target.value as "good" | "bad")}>
            <option value="good">good</option>
            <option value="bad">bad</option>
          </select>
        </label>
      </div>
      <label>
        <span>User Prompt</span>
        <textarea value={studio.newExamplePrompt} onChange={(event) => studio.setNewExamplePrompt(event.target.value)} />
      </label>
      <label>
        <span>Expected Output</span>
        <textarea value={studio.newExampleOutput} onChange={(event) => studio.setNewExampleOutput(event.target.value)} />
      </label>
      <button type="button" onClick={studio.handleAddExample}>
        Add Example
      </button>
    </div>
  );
}
