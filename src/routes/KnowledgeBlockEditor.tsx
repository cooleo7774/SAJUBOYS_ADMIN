import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  KNOWLEDGE_CATEGORIES,
  createKnowledgeBlock,
  deleteKnowledgeBlock,
  fetchKnowledgeBlockDetail,
  updateKnowledgeBlock,
  type KnowledgeBlockStatus,
  type KnowledgeCategory
} from "../api";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { useStudio } from "../components/studio/StudioContext";
import {
  createFallbackKnowledgeBlock,
  deleteFallbackKnowledgeBlock,
  findFallbackKnowledgeBlock,
  updateFallbackKnowledgeBlock
} from "../utils/fallbackKnowledgeStore";
import { splitComma } from "../utils/text";

export function KnowledgeBlockEditor() {
  const studio = useStudio();
  const navigate = useNavigate();
  const params = useParams<{ blockId: string }>();
  const blockId = params.blockId ?? "new";
  const isNew = blockId === "new";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("custom");
  const [status, setStatus] = useState<KnowledgeBlockStatus>("draft");
  const [priority, setPriority] = useState("100");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (isNew) {
      setTitle("");
      setCategory("custom");
      setStatus("draft");
      setPriority("100");
      setSource("");
      setTags("");
      setContent("");
      setMessage("");
      setErrorMessage("");
      return;
    }

    const load = async () => {
      setLoading(true);
      setErrorMessage("");
      setMessage("");
      try {
        if (studio.useFallback) {
          const fallback = findFallbackKnowledgeBlock(blockId);
          if (!fallback) {
            setErrorMessage("해당 지식 블록을 찾을 수 없습니다.");
            return;
          }
          setTitle(fallback.title);
          setCategory(fallback.category);
          setStatus(fallback.status);
          setPriority(String(fallback.priority));
          setSource(fallback.source ?? "");
          setTags(fallback.tags.join(", "));
          setContent(fallback.content);
          return;
        }

        const detail = await fetchKnowledgeBlockDetail(studio.apiConfig, blockId);
        setTitle(detail.title);
        setCategory(detail.category);
        setStatus(detail.status);
        setPriority(String(detail.priority));
        setSource(detail.source ?? "");
        setTags(detail.tags.join(", "));
        setContent(detail.content);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "지식 블록 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [blockId, isNew, studio.apiConfig, studio.useFallback]);

  const parsedPriority = useMemo(() => {
    const value = Number(priority);
    return Number.isFinite(value) ? value : 100;
  }, [priority]);

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      setErrorMessage("제목과 내용을 입력하세요.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    const payload = {
      title: title.trim(),
      category,
      content: content.trim(),
      tags: splitComma(tags),
      status,
      priority: parsedPriority,
      source: source.trim() || null
    };

    try {
      if (studio.useFallback) {
        const saved = isNew
          ? createFallbackKnowledgeBlock(payload)
          : updateFallbackKnowledgeBlock(blockId, payload);

        if (!saved) {
          setErrorMessage("저장할 지식 블록을 찾을 수 없습니다.");
          return;
        }

        setMessage("저장 완료 (fallback)");
        if (isNew) {
          navigate(`/knowledge/${saved.id}`, { replace: true });
        }
        return;
      }

      const saved = isNew
        ? await createKnowledgeBlock(studio.apiConfig, payload)
        : await updateKnowledgeBlock(studio.apiConfig, blockId, payload);
      setMessage("저장 완료");
      if (isNew) {
        navigate(`/knowledge/${saved.id}`, { replace: true });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "저장 실패");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (isNew) {
      navigate("/knowledge");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMessage("");
    try {
      if (studio.useFallback) {
        deleteFallbackKnowledgeBlock(blockId);
      } else {
        await deleteKnowledgeBlock(studio.apiConfig, blockId);
      }
      setConfirmDeleteOpen(false);
      navigate("/knowledge");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = () => {
    if (isNew) {
      void remove();
      return;
    }
    setConfirmDeleteOpen(true);
  };

  return (
    <div className="tab-content">
      <div className="panel-header-inline">
        <h3>{isNew ? "지식 블록 생성" : "지식 블록 편집"}</h3>
        <div className="toolbar-inline">
          <button type="button" onClick={() => navigate("/knowledge")}>
            라이브러리로 이동
          </button>
        </div>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      {message ? <p className="muted">{message}</p> : null}

      <div className="split">
        <label>
          <span>제목</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 오행 과다/결핍 해석 원칙" />
        </label>
        <label>
          <span>카테고리</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as KnowledgeCategory)}>
            {KNOWLEDGE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="split">
        <label>
          <span>상태</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as KnowledgeBlockStatus)}>
            <option value="draft">초안</option>
            <option value="published">발행</option>
            <option value="archived">보관</option>
          </select>
        </label>
        <label>
          <span>우선순위</span>
          <input value={priority} onChange={(event) => setPriority(event.target.value)} placeholder="100" />
        </label>
      </div>

      <div className="split">
        <label>
          <span>출처</span>
          <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="내부 문서/레퍼런스" />
        </label>
        <label>
          <span>태그 (콤마 구분)</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="오행,해석,궁합" />
        </label>
      </div>

      <label>
        <span>본문 (Markdown)</span>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} style={{ minHeight: "220px" }} />
      </label>

      <div className="toolbar-inline">
        <button type="button" className="primary" onClick={() => void save()} disabled={loading}>
          {loading ? "저장 중..." : "저장"}
        </button>
        <button type="button" className="danger-light" onClick={requestDelete} disabled={loading}>
          삭제
        </button>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="지식 블록 삭제"
        description="현재 지식 블록을 삭제하면 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        tone="danger"
        onConfirm={() => {
          void remove();
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
