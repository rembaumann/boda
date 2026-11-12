import { BOARD_UNREACHABLE, supabaseOrigin, upstreamRestPath } from "../lib/boardEndpoint.js";

const FORWARDED_REQUEST_HEADERS = [
  "apikey",
  "authorization",
  "accept",
  "accept-profile",
  "content-profile",
  "content-type",
  "prefer",
  "range",
  "x-client-info",
] as const;

export type BoardProxyRequest = {
  method: string;
  url: string;
  header(name: string): string | null;
  body: string | null;
  supabaseUrl?: string;
};

export type BoardProxyResponse = {
  status: number;
  contentType: string | null;
  contentRange: string | null;
  body: string;
};

function json(status: number, message: string): BoardProxyResponse {
  return {
    status,
    contentType: "application/json; charset=utf-8",
    contentRange: null,
    body: JSON.stringify({ message }),
  };
}

export async function handleBoardProxy(
  request: BoardProxyRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<BoardProxyResponse> {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "POST") {
    return json(405, "That request isn't allowed.");
  }
  const origin = supabaseOrigin(request.supabaseUrl);
  if (!origin) return json(503, "Supabase isn't configured.");
  const rest = upstreamRestPath(request.url);
  if (!rest) return json(404, "Not found.");

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.header(name);
    if (value) headers.set(name, value);
  }

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${origin}${rest}`, {
      method,
      headers,
      body: method === "POST" ? (request.body ?? undefined) : undefined,
      redirect: "manual",
    });
  } catch {
    return json(502, BOARD_UNREACHABLE);
  }
  if (upstream.status >= 300 && upstream.status < 400) return json(502, BOARD_UNREACHABLE);

  return {
    status: upstream.status,
    contentType: upstream.headers.get("content-type"),
    contentRange: upstream.headers.get("content-range"),
    body: method === "HEAD" ? "" : await upstream.text(),
  };
}
