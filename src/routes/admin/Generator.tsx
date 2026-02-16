import { useEffect, useMemo, useState } from "react";
import {
  calculateSaju,
  createGenerationHistory,
  fetchGenerationHistory,
  generateReading,
  type GenerationHistoryItem,
  type SajuChart
} from "../../api";
import { useStudio } from "../../components/studio/StudioContext";
import { useProductSettings } from "../../hooks/useProductSettings";
import { useProjectKnowledge } from "../../hooks/useProjectKnowledge";
import { addFallbackGenerationHistory, listFallbackGenerationHistory } from "../../utils/generationHistoryStore";
import { assemblePromptTemplate } from "../../utils/promptAssembler";
import { calculateSajuLocal, elementToKorean, formatSajuChartForPrompt } from "../../utils/saju";

export function Generator() {
  const studio = useStudio();
  const project = studio.activeProject;

  const settingsState = useProductSettings({
    projectId: project?.id ?? "",
    projectKey: project?.project_key ?? "",
    useFallback: studio.useFallback,
    apiConfig: studio.apiConfig
  });

  const { attachedBlocks } = useProjectKnowledge({
    projectId: project?.id ?? "",
    useFallback: studio.useFallback,
    apiConfig: studio.apiConfig
  });

  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [birthTime, setBirthTime] = useState("12:00");
  const [gender, setGender] = useState<"male" | "female" | "other">("female");
  const [userPrompt, setUserPrompt] = useState("현재 관계 흐름과 행동 타이밍을 알고 싶어요.");
  const [chart, setChart] = useState<SajuChart | null>(null);
  const [assembledPrompt, setAssembledPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  const loadHistory = async () => {
    if (!project) {
      setHistory([]);
      return;
    }

    if (studio.useFallback) {
      setHistory(listFallbackGenerationHistory(project.id));
      return;
    }

    try {
      const items = await fetchGenerationHistory(studio.apiConfig, project.id);
      setHistory(items);
    } catch {
      setHistory(listFallbackGenerationHistory(project.id));
    }
  };

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, studio.useFallback]);

  const compareOutputA = useMemo(
    () => history.find((item) => item.id === compareA)?.output_text ?? "",
    [compareA, history]
  );
  const compareOutputB = useMemo(
    () => history.find((item) => item.id === compareB)?.output_text ?? "",
    [compareB, history]
  );

  const runGeneration = async () => {
    if (!project || !settingsState.settings) {
      setErrorMessage("프로젝트와 상품 설정을 먼저 확인하세요.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      let nextChart: SajuChart;
      if (studio.useFallback) {
        nextChart = calculateSajuLocal({
          birthDate,
          birthTime,
          gender
        });
      } else {
        try {
          nextChart = await calculateSaju(studio.apiConfig, {
            birth_date: birthDate,
            birth_time: birthTime,
            gender
          });
        } catch {
          nextChart = calculateSajuLocal({
            birthDate,
            birthTime,
            gender
          });
        }
      }

      const chartText = formatSajuChartForPrompt(nextChart);
      const prompt = assemblePromptTemplate({
        template: settingsState.settings.prompt_template,
        blocks: attachedBlocks,
        sajuChartText: chartText,
        userPrompt
      });

      setChart(nextChart);
      setAssembledPrompt(prompt);

      let generatedText = "";
      if (studio.useFallback) {
        generatedText = buildFallbackReading({ userPrompt, chartText });
      } else {
        try {
          const result = await generateReading(studio.apiConfig, {
            project_id: project.id,
            product_type: settingsState.settings.product_type,
            prompt: userPrompt,
            assembled_prompt: prompt,
            saju_chart: nextChart
          });
          generatedText = result.output;
        } catch {
          generatedText = buildFallbackReading({ userPrompt, chartText });
        }
      }

      setOutput(generatedText);

      const historyPayload = {
        project_id: project.id,
        product_type: settingsState.settings.product_type,
        input_json: {
          birth_date: birthDate,
          birth_time: birthTime,
          gender,
          user_prompt: userPrompt
        },
        prompt_text: prompt,
        output_text: generatedText
      };

      if (studio.useFallback) {
        addFallbackGenerationHistory(historyPayload);
      } else {
        try {
          await createGenerationHistory(studio.apiConfig, historyPayload);
        } catch {
          addFallbackGenerationHistory(historyPayload);
        }
      }

      await loadHistory();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>생성기</h2>
        <p className="muted">생년월일 입력 → 사주 차트 계산 → 프롬프트 조립 → 결과 생성 파이프라인</p>

        <div className="split">
          <label>
            <span>생년월일</span>
            <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          </label>
          <label>
            <span>출생시간</span>
            <input type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} />
          </label>
        </div>

        <div className="split">
          <label>
            <span>성별</span>
            <select value={gender} onChange={(event) => setGender(event.target.value as "male" | "female" | "other")}>
              <option value="female">여성</option>
              <option value="male">남성</option>
              <option value="other">기타</option>
            </select>
          </label>
          <label>
            <span>상품 유형</span>
            <input value={settingsState.settings?.product_type ?? "미설정"} readOnly />
          </label>
        </div>

        <label>
          <span>사용자 질문</span>
          <textarea value={userPrompt} onChange={(event) => setUserPrompt(event.target.value)} />
        </label>

        <button type="button" className="primary" onClick={() => void runGeneration()} disabled={loading}>
          {loading ? "생성 중..." : "해석 생성"}
        </button>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>

      <section className="panel">
        <h3>사주 차트</h3>
        {chart ? <SajuChartView chart={chart} /> : <p className="muted">생성 실행 후 차트가 표시됩니다.</p>}
      </section>

      <section className="panel">
        <h3>조립 프롬프트</h3>
        <div className="preview-block">
          <p>{assembledPrompt || "생성 실행 시 조립된 프롬프트가 표시됩니다."}</p>
        </div>
      </section>

      <section className="panel">
        <h3>생성 결과</h3>
        <div className="preview-block">
          <p>{output || "생성 결과가 아직 없습니다."}</p>
        </div>
      </section>

      <section className="panel">
        <h3>생성 이력 비교</h3>
        <p className="muted">최근 생성 결과를 선택해 내용 차이를 비교합니다.</p>

        <div className="split">
          <label>
            <span>비교 A</span>
            <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
              <option value="">선택 안 함</option>
              {history.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.created_at}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>비교 B</span>
            <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
              <option value="">선택 안 함</option>
              {history.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.created_at}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="split">
          <div className="preview-block">
            <h4>A</h4>
            <p>{compareOutputA || "선택된 이력이 없습니다."}</p>
          </div>
          <div className="preview-block">
            <h4>B</h4>
            <p>{compareOutputB || "선택된 이력이 없습니다."}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SajuChartView({ chart }: { chart: SajuChart }) {
  const pillars: Array<{ label: string; value: SajuChart[keyof SajuChart] }> = [
    { label: "연주", value: chart.year },
    { label: "월주", value: chart.month },
    { label: "일주", value: chart.day },
    { label: "시주", value: chart.hour }
  ];

  return (
    <>
      <div className="chart-grid">
        {pillars.map((item) => {
          const pillar = item.value as SajuChart["year"];
          return (
            <article key={item.label} className="chart-card">
              <p className="eyebrow">{item.label}</p>
              <strong>
                {pillar.stem}
                {pillar.branch}
              </strong>
              <span className={`element-badge element-${pillar.element}`}>{elementToKorean(pillar.element)}</span>
            </article>
          );
        })}
      </div>

      <div className="element-grid">
        {(Object.keys(chart.five_elements) as Array<keyof SajuChart["five_elements"]>).map((key) => (
          <div key={key} className="element-row">
            <span>{elementToKorean(key)}</span>
            <div className="element-bar">
              <div className={`element-fill element-${key}`} style={{ width: `${chart.five_elements[key] * 12.5}%` }} />
            </div>
            <strong>{chart.five_elements[key]}</strong>
          </div>
        ))}
      </div>

      <p className="muted">십성: {chart.ten_gods.join(", ")}</p>
    </>
  );
}

function buildFallbackReading(input: { userPrompt: string; chartText: string }): string {
  return [
    "[Fallback 해석 결과]",
    `질문: ${input.userPrompt}`,
    "",
    "1) 현재 흐름",
    "감정 리듬은 빠르지 않지만 안정적으로 이어질 가능성이 있습니다. 단정 대신 조건부로 접근하세요.",
    "",
    "2) 실행 전략",
    "오늘은 짧은 확인 메시지 1회, 내일은 구체적 일정 제안 1회를 권장합니다.",
    "",
    "3) 차트 참고",
    input.chartText
  ].join("\n");
}
