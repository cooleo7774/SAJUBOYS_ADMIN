import { useStudio } from "../components/studio/StudioContext";

export function PlaygroundRoute() {
  const studio = useStudio();

  return (
    <div className="tab-content">
      <label>
        <span>User Prompt</span>
        <textarea value={studio.playgroundPrompt} onChange={(event) => studio.setPlaygroundPrompt(event.target.value)} />
      </label>
      <label>
        <span>Reference Example (optional)</span>
        <select value={studio.selectedExampleId} onChange={(event) => studio.setSelectedExampleId(event.target.value)}>
          <option value="">No reference</option>
          {(studio.activeProject?.examples ?? []).map((example) => (
            <option key={example.id} value={example.id}>
              {example.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="primary" onClick={studio.runEval}>
        Generate Preview
      </button>
    </div>
  );
}
