import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ProductSettings, ProductType } from "../../api";
import { useStudio } from "../../components/studio/StudioContext";
import { useProductSettings } from "../../hooks/useProductSettings";
import { useProjectKnowledge } from "../../hooks/useProjectKnowledge";
import { assemblePromptTemplate } from "../../utils/promptAssembler";

const PRODUCT_TYPE_OPTIONS: Array<{ value: ProductType; label: string }> = [
  { value: "daily_fortune", label: "종합운세" },
  { value: "compatibility", label: "궁합" },
  { value: "full_reading", label: "사주풀이" }
];

export function ProductSettings() {
  const studio = useStudio();
  const params = useParams<{ productId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const productId = params.productId;
    if (!productId) {
      return;
    }
    if (productId !== studio.activeProjectId) {
      void studio.selectProject(productId);
    }
  }, [params.productId, studio]);

  const project = studio.activeProject;

  const productSettingsState = useProductSettings({
    projectId: project?.id ?? "",
    projectKey: project?.project_key ?? "",
    useFallback: studio.useFallback,
    apiConfig: studio.apiConfig
  });

  const [localSettings, setLocalSettings] = useState<ProductSettings | null>(null);
  const [toneProfileText, setToneProfileText] = useState("{}");
  const [autoSave, setAutoSave] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const { attachedBlocks, loading: knowledgeLoading } = useProjectKnowledge({
    projectId: project?.id ?? "",
    useFallback: studio.useFallback,
    apiConfig: studio.apiConfig
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!productSettingsState.settings) {
      setLocalSettings(null);
      setToneProfileText("{}");
      initializedRef.current = false;
      return;
    }

    setLocalSettings(productSettingsState.settings);
    setToneProfileText(JSON.stringify(productSettingsState.settings.tone_profile, null, 2));
    initializedRef.current = true;
  }, [productSettingsState.settings]);

  const assembledPromptPreview = useMemo(() => {
    if (!localSettings) {
      return "";
    }

    return assemblePromptTemplate({
      template: localSettings.prompt_template,
      blocks: attachedBlocks,
      sajuChartText: "연주: 갑자\n월주: 을축\n일주: 병인\n시주: 정묘",
      userPrompt: "연애 흐름이 궁금해요"
    });
  }, [attachedBlocks, localSettings]);

  const saveAll = async () => {
    if (!localSettings || !project) {
      return;
    }

    setSaveError("");
    setSaveMessage("");

    let toneProfile: Record<string, unknown>;
    try {
      toneProfile = JSON.parse(toneProfileText) as Record<string, unknown>;
    } catch {
      setSaveError("톤 프로필 JSON 형식이 올바르지 않습니다.");
      return;
    }

    try {
      const payload: ProductSettings = {
        ...localSettings,
        tone_profile: toneProfile
      };
      await productSettingsState.save(payload);
      await studio.saveDraft();
      setSaveMessage(`저장 완료: ${new Date().toLocaleTimeString()}`);
    } catch {
      setSaveError("저장 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!autoSave || !initializedRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveAll();
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoSave,
    localSettings?.product_type,
    localSettings?.prompt_template,
    toneProfileText,
    studio.goalDraft,
    studio.toneDraft,
    studio.contextDraft,
    studio.mustDraft,
    studio.avoidDraft
  ]);

  if (!project || !localSettings) {
    return (
      <div className="page-grid">
        <section className="panel">
          <p className="muted">상품을 선택하면 설정을 편집할 수 있습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header-inline">
          <h2>상품 설정</h2>
          <div className="toolbar-inline">
            <label className="inline-checkbox">
              <input type="checkbox" checked={autoSave} onChange={(event) => setAutoSave(event.target.checked)} />
              자동 저장
            </label>
            <button type="button" className="primary" onClick={() => void saveAll()}>
              지금 저장
            </button>
          </div>
        </div>

        <p className="muted">
          상품 유형, 프롬프트 템플릿, 톤/가드레일을 함께 관리합니다. 템플릿에서{" "}
          <code>{"{{knowledge:카테고리}}"}</code>, <code>{"{{saju_chart}}"}</code>, <code>{"{{user_prompt}}"}</code>를
          사용할 수 있습니다.
        </p>

        {saveMessage ? <p className="muted">{saveMessage}</p> : null}
        {saveError ? <p className="error-text">{saveError}</p> : null}
        {productSettingsState.errorMessage ? <p className="error-text">{productSettingsState.errorMessage}</p> : null}

        <div className="split">
          <label>
            <span>상품 유형</span>
            <select
              value={localSettings.product_type}
              onChange={(event) =>
                setLocalSettings((prev) => (prev ? { ...prev, product_type: event.target.value as ProductType } : prev))
              }
            >
              {PRODUCT_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>활성 프로젝트</span>
            <input value={project.name} readOnly />
          </label>
        </div>

        <label>
          <span>프롬프트 템플릿</span>
          <textarea
            value={localSettings.prompt_template}
            onChange={(event) =>
              setLocalSettings((prev) => (prev ? { ...prev, prompt_template: event.target.value } : prev))
            }
            style={{ minHeight: "220px" }}
          />
        </label>

        <label>
          <span>톤 프로필(JSON)</span>
          <textarea value={toneProfileText} onChange={(event) => setToneProfileText(event.target.value)} style={{ minHeight: "160px" }} />
        </label>

        <div className="split">
          <label>
            <span>목표(Goal)</span>
            <textarea value={studio.goalDraft} onChange={(event) => studio.setGoalDraft(event.target.value)} />
          </label>
          <label>
            <span>기본 톤 설명</span>
            <textarea value={studio.toneDraft} onChange={(event) => studio.setToneDraft(event.target.value)} />
          </label>
        </div>

        <label>
          <span>시스템 컨텍스트</span>
          <textarea value={studio.contextDraft} onChange={(event) => studio.setContextDraft(event.target.value)} />
        </label>

        <div className="split">
          <label>
            <span>필수 가드레일 (줄바꿈)</span>
            <textarea value={studio.mustDraft} onChange={(event) => studio.setMustDraft(event.target.value)} />
          </label>
          <label>
            <span>금지 가드레일 (줄바꿈)</span>
            <textarea value={studio.avoidDraft} onChange={(event) => studio.setAvoidDraft(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-inline">
          <h3>조립 프롬프트 미리보기</h3>
          <div className="toolbar-inline">
            <Link className="button-link" to="/knowledge">
              지식 연결 관리
            </Link>
            <button type="button" onClick={() => navigate("/generator")}>
              생성기에서 실행
            </button>
          </div>
        </div>

        <p className="muted">
          연결 지식 블록 {attachedBlocks.length}개 {knowledgeLoading ? "(로딩 중)" : ""}
        </p>

        <div className="preview-block">
          <p>{assembledPromptPreview || "템플릿을 입력하면 조립 결과가 표시됩니다."}</p>
        </div>
      </section>
    </div>
  );
}
