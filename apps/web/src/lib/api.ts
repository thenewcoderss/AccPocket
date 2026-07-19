import type { ApiResponse } from "@accpocket/shared";
const base = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "https://accpocket-api.onrender.com/api/v1" : "http://localhost:4000/api/v1");
let accessToken: string | null = null;
let unlockToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const expiryListeners = new Set<() => void>();
function clearSession(notify = false) {
  accessToken = null;
  unlockToken = null;
  if (notify) expiryListeners.forEach(listener => listener());
}
export const sessionTokens = {
  setAccess: (value: string | null) => accessToken = value,
  setUnlock: (value: string | null) => unlockToken = value,
  clear: () => clearSession(),
  onExpired(listener: () => void) { expiryListeners.add(listener); return () => { expiryListeners.delete(listener); }; }
};

function refreshAccess() {
  if (!refreshPromise) {
    refreshPromise = raw<{ accessToken: string }>("/auth/refresh", { method: "POST" }, false)
      .then(result => { accessToken = result.accessToken; return result.accessToken; })
      .catch(() => { clearSession(true); return null; })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function raw<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers); if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`); if (unlockToken) headers.set("x-unlock-token", unlockToken);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...init, headers, credentials: "include" });
  } catch (caught) {
    if (caught instanceof TypeError) throw new Error("Unable to reach AccPocket API. Check your connection and try again.");
    throw caught;
  }
  if (response.status === 401 && retry && !path.startsWith("/auth/")) { const refreshed = await refreshAccess(); if (refreshed) return raw<T>(path, init, false); }
  const payload = await response.json() as ApiResponse<T>;
  if (!payload.success) { const error = new Error(payload.error.message) as Error & { code: string; status: number }; error.code = payload.error.code; error.status = response.status; throw error; }
  return payload.data;
}
export async function downloadError(response: Response) {
  try {
    const payload = await response.json() as ApiResponse<unknown>;
    if (!payload.success) return new Error(payload.error.message);
  } catch { /* A proxy may return a non-JSON error page. */ }
  return new Error(`Download failed (${response.status})`);
}

export const api = { get: <T>(path: string, init?: Pick<RequestInit, "signal">) => raw<T>(path, init), post: <T>(path: string, body?: unknown) => raw<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }), patch: <T>(path: string, body: unknown) => raw<T>(path, { method: "PATCH", body: JSON.stringify(body) }), delete: <T>(path: string) => raw<T>(path, { method: "DELETE" }), download: async (path: string) => { const headers = new Headers(); if (accessToken) headers.set("authorization", `Bearer ${accessToken}`); if (unlockToken) headers.set("x-unlock-token", unlockToken); const response = await fetch(`${base}${path}`, { headers, credentials: "include" }); if (!response.ok) throw await downloadError(response); const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = response.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ?? "report"; a.click(); URL.revokeObjectURL(url); } };
