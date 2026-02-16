import { NavLink, Outlet } from "react-router-dom";
import { useStudio } from "./StudioContext";

const ROUTE_ITEMS = [
  { to: "/context", label: "context" },
  { to: "/tone", label: "tone" },
  { to: "/training", label: "training" },
  { to: "/knowledge", label: "knowledge" },
  { to: "/examples", label: "examples" },
  { to: "/playground", label: "playground" },
  { to: "/publish", label: "publish" }
] as const;

export function StudioLayout() {
  const studio = useStudio();

  if (!studio.activeProject && studio.projects.length === 0) {
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
        {studio.operationMode ? (
          <div className="topbar-meta">
            <span className="chip">API: {studio.apiConfig.baseUrl}</span>
            <button type="button" onClick={studio.handleConnect} disabled={studio.isLoading}>
              {studio.isLoading ? "Reconnecting..." : "Reconnect"}
            </button>
          </div>
        ) : (
          <div className="connection-grid">
            <input
              value={studio.apiBaseUrl}
              onChange={(event) => studio.setApiBaseUrl(event.target.value)}
              placeholder="API Base URL"
            />
            <input
              value={studio.apiKey}
              onChange={(event) => studio.setApiKey(event.target.value)}
              placeholder="Admin API Key"
            />
            <input
              value={studio.bearerToken}
              onChange={(event) => studio.setBearerToken(event.target.value)}
              placeholder="Bearer Token (optional)"
            />
            <button type="button" className="primary" onClick={studio.handleConnect} disabled={studio.isLoading}>
              {studio.isLoading ? "Connecting..." : "Connect"}
            </button>
          </div>
        )}
      </header>

      <main className="layout">
        <aside className="panel project-panel reveal" data-stagger="1">
          <div className="panel-header-inline">
            <h2>Projects</h2>
            <button type="button" onClick={studio.handleCreateProject}>
              New
            </button>
          </div>
          <p className="muted">모드: {studio.useFallback ? "Fallback" : "API Live"}</p>
          <div className="project-list">
            {studio.projects.map((project) => (
              <button
                key={project.id}
                className={`project-card ${studio.activeProjectId === project.id ? "active" : ""}`}
                onClick={() => {
                  void studio.selectProject(project.id);
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
          <nav className="tabs" aria-label="Knowledge Studio Routes">
            {ROUTE_ITEMS.map((item) => (
              <NavLink key={item.to} className={({ isActive }) => (isActive ? "active" : "")} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </section>

        <aside className="panel preview-panel reveal" data-stagger="3">
          <h2>Preview</h2>
          <p className="muted">목표 예시와 생성 결과를 실시간 비교합니다.</p>
          <div className="preview-block">
            <h3>Tone Snapshot</h3>
            <p>{studio.toneGuide}</p>
          </div>
          <div className="preview-block">
            <h3>Training Snapshot</h3>
            <p>{studio.trainingSummary}</p>
          </div>
          <div className="preview-block">
            <h3>Target Example</h3>
            <p>{studio.selectedExample?.expected_output ?? "예시를 선택하면 기준 출력이 표시됩니다."}</p>
          </div>
          <div className="preview-block">
            <h3>Generated Output</h3>
            <p>{studio.generatedOutput || "아직 생성된 출력이 없습니다."}</p>
          </div>
          <div className="score">
            <span>Similarity</span>
            <strong>{studio.similarity}%</strong>
          </div>
          <p className="muted">{studio.lastAction}</p>
          {studio.errorMessage ? <p className="error-text">{studio.errorMessage}</p> : null}
        </aside>
      </main>

      <footer className="action-bar reveal" data-stagger="4">
        <button type="button" onClick={studio.saveDraft} disabled={studio.isLoading || !studio.activeProject}>
          Save Draft
        </button>
        <button type="button" onClick={studio.runEval} disabled={!studio.activeProject}>
          Run Eval
        </button>
        <button type="button" className="primary" onClick={studio.publish} disabled={studio.isLoading || !studio.activeProject}>
          Publish Version
        </button>
      </footer>
    </div>
  );
}
