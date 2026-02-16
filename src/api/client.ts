import type { AdminApiConfig } from "./types";

export function buildHeaders(config: AdminApiConfig): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (config.apiKey.trim().length > 0) {
    headers["x-admin-api-key"] = config.apiKey.trim();
  }

  if (config.bearerToken.trim().length > 0) {
    headers.Authorization = `Bearer ${config.bearerToken.trim()}`;
  }

  return headers;
}

export async function requestJson<T>(config: AdminApiConfig, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(config),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const maybeJson = (await response
      .json()
      .catch(() => ({ message: `${response.status} ${response.statusText}` }))) as { message?: string };
    throw new Error(maybeJson.message ?? `request_failed:${response.status}`);
  }

  return (await response.json()) as T;
}
