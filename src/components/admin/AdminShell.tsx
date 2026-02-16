import { NavLink, Outlet } from "react-router-dom";
import { useStudio } from "../studio/StudioContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "대시보드" },
  { to: "/knowledge", label: "지식관리" },
  { to: "/products", label: "상품관리" },
  { to: "/generator", label: "생성기" },
  { to: "/deploy", label: "배포" }
] as const;

export function AdminShell() {
  const studio = useStudio();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">SAJUBOYS ADMIN</p>
        <h1>운영 콘솔</h1>
        <p className="muted">사주 지식 운영과 생성 파이프라인을 한 화면에서 관리합니다.</p>

        <nav className="sidebar-nav" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>{item.label}</NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="chip">모드: {studio.useFallback ? "Fallback" : "API Live"}</span>
          <span className="chip">프로젝트: {studio.projects.length}개</span>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-group">
            <label>
              <span>활성 상품</span>
              <select
                value={studio.activeProjectId}
                onChange={(event) => {
                  void studio.selectProject(event.target.value);
                }}
              >
                {studio.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={studio.handleCreateProject}>
              신규 상품
            </button>
          </div>

          <div className="topbar-group">
            <button type="button" className="primary" onClick={studio.handleConnect} disabled={studio.isLoading}>
              {studio.isLoading ? "연결 중..." : "API 재연결"}
            </button>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
