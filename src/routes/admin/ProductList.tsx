import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStudio } from "../../components/studio/StudioContext";
import { getProductSettings } from "../../utils/productSettingsStore";

export function ProductList() {
  const studio = useStudio();
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      studio.projects.map((project) => ({
        project,
        settings: getProductSettings(project.id, project.project_key)
      })),
    [studio.projects]
  );

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header-inline">
          <h2>상품 목록</h2>
          <button type="button" onClick={studio.handleCreateProject}>
            신규 상품
          </button>
        </div>
        <p className="muted">상품 유형별로 프롬프트/가드레일/지식 연결 정책을 분리 관리합니다.</p>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>상품명</th>
                <th>유형</th>
                <th>상태</th>
                <th>최종 수정</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ project, settings }) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <p className="muted">{project.project_key}</p>
                  </td>
                  <td>{settings.product_type}</td>
                  <td>{project.status}</td>
                  <td>{project.updated_at}</td>
                  <td>
                    <div className="toolbar-inline">
                      <button
                        type="button"
                        onClick={() => {
                          void studio.selectProject(project.id);
                          navigate(`/products/${project.id}`);
                        }}
                      >
                        설정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void studio.selectProject(project.id);
                          navigate("/generator");
                        }}
                      >
                        생성 테스트
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
