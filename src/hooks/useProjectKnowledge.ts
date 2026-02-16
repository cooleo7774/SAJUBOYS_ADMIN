import { useEffect, useMemo, useState } from "react";
import { fetchKnowledgeBlocks, fetchProjectKnowledge, type AdminApiConfig, type AdminKnowledgeBlock } from "../api";
import { readFallbackKnowledgeBlocks, readFallbackProjectKnowledge } from "../utils/fallbackKnowledgeStore";

export function useProjectKnowledge(input: {
  projectId: string;
  useFallback: boolean;
  apiConfig: AdminApiConfig;
}) {
  const [blocks, setBlocks] = useState<AdminKnowledgeBlock[]>([]);
  const [attachedIds, setAttachedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = async () => {
    if (!input.projectId) {
      setBlocks([]);
      setAttachedIds([]);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      if (input.useFallback) {
        setBlocks(readFallbackKnowledgeBlocks());
        setAttachedIds(readFallbackProjectKnowledge(input.projectId));
      } else {
        const [items, links] = await Promise.all([
          fetchKnowledgeBlocks(input.apiConfig),
          fetchProjectKnowledge(input.apiConfig, input.projectId)
        ]);
        setBlocks(items);
        setAttachedIds(links.map((item) => item.knowledge_block_id));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지식 데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.projectId, input.useFallback, input.apiConfig.baseUrl, input.apiConfig.apiKey, input.apiConfig.bearerToken]);

  const attachedBlocks = useMemo(
    () => blocks.filter((item) => attachedIds.includes(item.id)).sort((a, b) => b.priority - a.priority),
    [attachedIds, blocks]
  );

  return {
    blocks,
    attachedIds,
    attachedBlocks,
    loading,
    errorMessage,
    reload: load
  };
}
