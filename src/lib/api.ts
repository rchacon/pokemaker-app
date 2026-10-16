import type { Card, CardFields, Profile } from "../types";

/** Same-origin base path: Vite proxies it locally, CloudFront routes it in AWS. */
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** True when the API itself answered with a structured error (vs. a gateway or network failure). */
  get isStructured(): boolean {
    return this.code !== "HTTP_ERROR" && this.code !== "NETWORK_ERROR";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach PokeMaker right now.");
  }
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: { code: string; message: string; details?: Record<string, unknown> } } | null)
      ?.error;
    if (error?.code) throw new ApiError(response.status, error.code, error.message, error.details ?? {});
    throw new ApiError(response.status, "HTTP_ERROR", `Request failed (${response.status})`);
  }
  return body as T;
}

const json = (method: string, body?: unknown, headers?: Record<string, string>): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
  headers,
});

export const api = {
  listProfiles: () => request<Profile[]>("/profiles"),
  listCards: (profileId: string) => request<Card[]>(`/profiles/${profileId}/cards`),
  getCard: (profileId: string, cardId: string) => request<Card>(`/profiles/${profileId}/cards/${cardId}`),
  createCard: (profileId: string, fields: CardFields) => request<Card>(`/profiles/${profileId}/cards`, json("POST", fields)),
  updateCard: (profileId: string, cardId: string, fields: CardFields, version: number) =>
    request<Card>(`/profiles/${profileId}/cards/${cardId}`, json("PUT", { ...fields, version })),
  deleteCard: (profileId: string, cardId: string) =>
    request<void>(`/profiles/${profileId}/cards/${cardId}`, json("DELETE")),
  duplicateCard: (profileId: string, cardId: string) =>
    request<Card>(`/profiles/${profileId}/cards/${cardId}/duplicate`, json("POST")),
};
