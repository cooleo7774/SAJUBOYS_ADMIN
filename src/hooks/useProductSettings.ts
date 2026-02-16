import { useEffect, useState } from "react";
import { fetchProductSettings, updateProductSettings, type AdminApiConfig, type ProductSettings } from "../api";
import { getProductSettings, saveProductSettings } from "../utils/productSettingsStore";

export function useProductSettings(input: {
  projectId: string;
  projectKey: string;
  useFallback: boolean;
  apiConfig: AdminApiConfig;
}) {
  const [settings, setSettings] = useState<ProductSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!input.projectId) {
      setSettings(null);
      return;
    }

    const local = getProductSettings(input.projectId, input.projectKey);
    setSettings(local);

    if (input.useFallback) {
      return;
    }

    let ignore = false;
    const load = async () => {
      try {
        const remote = await fetchProductSettings(input.apiConfig, input.projectId);
        if (!ignore) {
          setSettings(saveProductSettings(input.projectId, remote));
        }
      } catch {
        // keep local fallback settings
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, [input.apiConfig, input.projectId, input.projectKey, input.useFallback]);

  const save = async (next: ProductSettings): Promise<ProductSettings> => {
    setErrorMessage("");
    setLoading(true);

    try {
      const local = saveProductSettings(input.projectId, next);
      setSettings(local);

      if (!input.useFallback) {
        try {
          const remote = await updateProductSettings(input.apiConfig, input.projectId, next);
          setSettings(saveProductSettings(input.projectId, remote));
          return remote;
        } catch {
          // keep local write on API mismatch
        }
      }

      return local;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "상품 설정 저장 실패");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    setSettings,
    save,
    loading,
    errorMessage
  };
}
