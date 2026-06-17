/**
 * Finexa API Client
 * Connects new-ui to the existing Django backend.
 * Base URL resolves from VITE_API_URL env var, falls back to localhost:8000.
 */

export const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:8000";

// ── Token storage ────────────────────────────────────────────────────────────
export function getTokens() {
  return {
    access: typeof window !== "undefined" ? localStorage.getItem("finexa_access") || "" : "",
    refresh: typeof window !== "undefined" ? localStorage.getItem("finexa_refresh") || "" : "",
  };
}

export function saveTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("finexa_access", access);
  localStorage.setItem("finexa_refresh", refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("finexa_access");
  localStorage.removeItem("finexa_refresh");
  localStorage.removeItem("finexa_user");
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function tryRefreshToken(): Promise<boolean> {
  try {
    const { refresh } = getTokens();
    if (!refresh) return false;
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    saveTokens(data.access, refresh);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (requiresAuth) {
    const { access } = getTokens();
    if (access) headers["Authorization"] = `Bearer ${access}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiFetch<T>(path, options, requiresAuth, false);
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || err.detail || JSON.stringify(err));
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const { access } = getTokens();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || err.detail || "Upload failed");
  }
  return res.json();
}
