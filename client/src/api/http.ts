const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type ApiErrorPayload = {
  success?: boolean;
  message?: string;
  code?: string;
};

type ApiSuccessPayload<T> = {
  success: true;
  data: T;
};

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};

const parseResponsePayload = async (response: Response): Promise<unknown> => {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const apiPayload = payload as ApiErrorPayload;
    if (typeof apiPayload.message === "string" && apiPayload.message.trim()) {
      return apiPayload.message;
    }
  }

  return fallback;
};

export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH",
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBody: string | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: requestBody,
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Request failed with status ${response.status}`));
  }

  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: boolean }).success === true &&
    "data" in payload
  ) {
    return (payload as ApiSuccessPayload<T>).data;
  }

  return payload as T;
}

export function apiGet<T>(path: string, token?: string) {
  return apiRequest<T>(path, "GET", undefined, token);
}

export function apiPost<T>(path: string, body?: unknown, token?: string) {
  return apiRequest<T>(path, "POST", body, token);
}

export function apiPatch<T>(path: string, body?: unknown, token?: string) {
  return apiRequest<T>(path, "PATCH", body, token);
}
