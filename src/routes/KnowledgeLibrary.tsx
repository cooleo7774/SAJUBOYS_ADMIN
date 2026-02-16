import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  KNOWLEDGE_CATEGORIES,
  attachProjectKnowledge,
  deleteKnowledgeBlock,
  detachProjectKnowledge,
  fetchKnowledgeBlocks,
  fetchProjectKnowledge,
  type AdminKnowledgeBlock,
  type KnowledgeBlockStatus,
  type KnowledgeCategory
} from "../api";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { useStudio } from "../components/studio/StudioContext";
import {
  attachFallbackProjectKnowledge,
  deleteFallbackKnowledgeBlock,
  detachFallbackProjectKnowledge,
  readFallbackKnowledgeBlocks,
  readFallbackProjectKnowledge
} from "../utils/fallbackKnowledgeStore";

export function KnowledgeLibrary() {
  const studio = useStudio();
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState<AdminKnowledgeBlock[]>([]);
  const [attachedBlockIds, setAttachedBlockIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<KnowledgeCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<KnowledgeBlockStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingDeleteBlockId, setPendingDeleteBlockId] = useState<string | null>(null);

  const loadBlocks = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (studio.useFallback) {
        setBlocks(readFallbackKnowledgeBlocks());
      } else {
        const items = await fetchKnowledgeBlocks(studio.apiConfig);
        setBlocks(items);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지식 블록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const loadAttachedBlocks = async () => {
    if (!studio.activeProjectId) {
      setAttachedBlockIds([]);
      return;
    }

    try {
      if (studio.useFallback) {
        setAttachedBlockIds(readFallbackProjectKnowledge(studio.activeProjectId));
      } else {
        const links = await fetchProjectKnowledge(studio.apiConfig, studio.activeProjectId);
        setAttachedBlockIds(links.map((item) => item.knowledge_block_id));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "프로젝트 연결 데이터 조회 실패");
    }
  };

  useEffect(() => {
    void loadBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.useFallback]);

  useEffect(() => {
    void loadAttachedBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.activeProjectId, studio.useFallback]);

  const filteredBlocks = useMemo(() => {
    return blocks
      .filter((item) => (categoryFilter === "all" ? true : item.category === categoryFilter))
      .filter((item) => (statusFilter === "all" ? true : item.status === statusFilter))
      .filter((item) => {
        const q = search.trim().toLowerCase();
        if (!q) {
          return true;
        }
        return [item.title, item.content, item.tags.join(" ")].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => b.priority - a.priority);
  }, [blocks, categoryFilter, search, statusFilter]);

  const toggleAttach = async (blockId: string) => {
    if (!studio.activeProjectId) {
      setErrorMessage("프로젝트를 먼저 선택하세요.");
      return;
    }

    setErrorMessage("");
    const isAttached = attachedBlockIds.includes(blockId);

    try {
      if (studio.useFallback) {
        if (isAttached) {
          detachFallbackProjectKnowledge(studio.activeProjectId, blockId);
        } else {
          attachFallbackProjectKnowledge(studio.activeProjectId, blockId);
        }
      } else {
        if (isAttached) {
          await detachProjectKnowledge(studio.apiConfig, studio.activeProjectId, blockId);
        } else {
          await attachProjectKnowledge(studio.apiConfig, studio.activeProjectId, blockId);
        }
      }
      await loadAttachedBlocks();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "프로젝트 연결 변경 실패");
    }
  };

  const handleDelete = async (blockId: string) => {
    setPendingDeleteBlockId(blockId);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteBlockId) {
      return;
    }

    try {
      if (studio.useFallback) {
        deleteFallbackKnowledgeBlock(pendingDeleteBlockId);
      } else {
        await deleteKnowledgeBlock(studio.apiConfig, pendingDeleteBlockId);
      }
      await loadBlocks();
      await loadAttachedBlocks();
      setPendingDeleteBlockId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지식 블록 삭제 실패");
    }
  };

  return (
    <div className="tab-content">
      <div className="panel-header-inline">
        <h3>지식 라이브러리</h3>
        <div className="toolbar-inline">
          <button type="button" onClick={() => void loadBlocks()}>
            새로고침
          </button>
          <button type="button" className="primary" onClick={() => navigate("/knowledge/new")}>
            지식 블록 추가
          </button>
        </div>
      </div>

      <p className="muted">
        활성 프로젝트: <strong>{studio.activeProject?.name ?? "미선택"}</strong> | 연결된 블록: {attachedBlockIds.length}개
      </p>

      <div className="split">
        <label>
          <span>검색</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목/내용/태그" />
        </label>
        <label>
          <span>카테고리</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as KnowledgeCategory | "all")}>
            <option value="all">all</option>
            {KNOWLEDGE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>상태</span>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as KnowledgeBlockStatus | "all")}>
          <option value="all">전체</option>
          <option value="draft">초안</option>
          <option value="published">발행</option>
          <option value="archived">보관</option>
        </select>
      </label>

      {loading ? <p className="muted">불러오는 중...</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <div className="training-grid">
        {filteredBlocks.map((block) => {
          const isAttached = attachedBlockIds.includes(block.id);
          return (
            <article key={block.id} className="training-card">
              <div className="panel-header-inline">
                <strong>{block.title}</strong>
                <div className="toolbar-inline">
                  <button type="button" onClick={() => navigate(`/knowledge/${block.id}`)}>
                    편집
                  </button>
                  <button type="button" className={isAttached ? "primary" : ""} onClick={() => void toggleAttach(block.id)}>
                    {isAttached ? "연결 해제" : "연결"}
                  </button>
                  <button type="button" className="danger-light" onClick={() => void handleDelete(block.id)}>
                    삭제
                  </button>
                </div>
              </div>
              <p className="muted">
                [{block.category}] {block.status} | priority {block.priority}
              </p>
              <p>{block.content}</p>
              {block.tags.length > 0 ? <p className="muted">tags: {block.tags.join(", ")}</p> : null}
              {block.source ? <p className="muted">source: {block.source}</p> : null}
            </article>
          );
        })}
        {filteredBlocks.length === 0 ? <p className="muted">조건에 맞는 지식 블록이 없습니다.</p> : null}
      </div>

      <ConfirmModal
        open={pendingDeleteBlockId !== null}
        title="지식 블록 삭제"
        description="선택한 지식 블록을 삭제하면 프로젝트 연결도 함께 해제됩니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        tone="danger"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => setPendingDeleteBlockId(null)}
      />
    </div>
  );
}
