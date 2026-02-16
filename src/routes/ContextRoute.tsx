import { useStudio } from "../components/studio/StudioContext";

export function ContextRoute() {
  const studio = useStudio();

  return (
    <div className="tab-content">
      <label>
        <span>Goal</span>
        <textarea value={studio.goalDraft} onChange={(event) => studio.setGoalDraft(event.target.value)} />
      </label>
      <label>
        <span>Base Tone Description</span>
        <textarea value={studio.toneDraft} onChange={(event) => studio.setToneDraft(event.target.value)} />
      </label>
      <label>
        <span>System Context</span>
        <textarea value={studio.contextDraft} onChange={(event) => studio.setContextDraft(event.target.value)} />
      </label>
      <div className="split">
        <label>
          <span>Must Guardrails (line-separated)</span>
          <textarea value={studio.mustDraft} onChange={(event) => studio.setMustDraft(event.target.value)} />
        </label>
        <label>
          <span>Avoid Guardrails (line-separated)</span>
          <textarea value={studio.avoidDraft} onChange={(event) => studio.setAvoidDraft(event.target.value)} />
        </label>
      </div>
    </div>
  );
}
