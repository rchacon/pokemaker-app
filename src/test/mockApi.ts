import { vi } from "vitest";

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
}

type Reply = { status?: number; body?: unknown } | unknown;
type Handler = (request: MockRequest) => Reply | Promise<Reply>;

/**
 * Stub `fetch` with a tiny router: keys look like "PUT /api/profiles/:profileId/cards/:cardId".
 * A handler may return a plain body (status 200) or `{ status, body }` via `reply()`.
 */
export function mockApi(routes: Record<string, Handler>) {
  const compiled = Object.entries(routes).map(([key, handler]) => {
    const [method, pattern] = key.split(" ") as [string, string];
    const names: string[] = [];
    const regex = new RegExp(
      "^" + pattern.replace(/:(\w+)/g, (_, name: string) => (names.push(name), "([^/?]+)")) + "(?:\\?.*)?$",
    );
    return { method, regex, names, handler };
  });
  const calls: MockRequest[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const path = typeof input === "string" ? input : input.toString();
    const method = (init.method ?? "GET").toUpperCase();
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>));
    for (const route of compiled) {
      const match = route.method === method ? route.regex.exec(path) : null;
      if (!match) continue;
      const params = Object.fromEntries(route.names.map((n, i) => [n, match[i + 1]!]));
      const request = { method, path, params, body: init.body ? JSON.parse(String(init.body)) : undefined, headers };
      calls.push(request);
      const result = await route.handler(request);
      const { status, body } = isReply(result) ? result : { status: 200, body: result };
      return new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unmocked request: ${method} ${path}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock, callsTo: (method: string, fragment: string) => calls.filter((c) => c.method === method && c.path.includes(fragment)) };
}

const REPLY = Symbol("reply");

export function reply(status: number, body?: unknown) {
  return { [REPLY]: true, status, body };
}

function isReply(value: unknown): value is { status: number; body: unknown } {
  return typeof value === "object" && value !== null && REPLY in value;
}

export function apiError(status: number, code: string, message = code, details: Record<string, unknown> = {}) {
  return reply(status, { error: { code, message, details } });
}
