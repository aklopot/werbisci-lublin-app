export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type JsonValue = unknown;

let authToken: string | undefined;

export function setAuthToken(token: string | undefined): void {
  authToken = token;
}

function joinUrl(base: string, path: string): string {
  if (!base) return path;
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  if (!base.endsWith("/") && !path.startsWith("/")) return `${base}/${path}`;
  return base + path;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function fetchJson<TResponse = JsonValue>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: JsonValue;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  } = {}
): Promise<TResponse> {
  const url = joinUrl(API_BASE_URL, path);

  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (response.status === 204) {
    return undefined as unknown as TResponse;
  }

  const text = await response.text();
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson && text ? (JSON.parse(text) as TResponse) : (text as unknown as TResponse);

  if (!response.ok) {
    const message = (data as any)?.detail ?? response.statusText;
    const error = new Error(typeof message === "string" ? message : "Request failed");
    (error as any).status = response.status;
    throw error;
  }

  return data as TResponse;
}

// Auth endpoints
export interface LoginResponse {
  access_token: string;
  token_type: string; // "bearer"
}

export async function loginApi(login: string, password: string): Promise<LoginResponse> {
  return fetchJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { login, password },
  });
}

export async function fetchBlob(
  path: string,
  options: {
    method?: HttpMethod;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  } = {}
): Promise<Blob> {
  const url = joinUrl(API_BASE_URL, path);

  const headers: Record<string, string> = {
    "Accept": "application/pdf",
    ...(options.headers ?? {}),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(text || response.statusText || "Request failed");
    (error as any).status = response.status;
    throw error;
  }

  return await response.blob();
}


