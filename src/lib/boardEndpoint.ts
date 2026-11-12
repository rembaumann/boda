/** Same-origin prefix. The service worker already leaves `/api/` on the network. */
export const BOARD_PROXY_PREFIX = "/api/sb";

export const BOARD_UNREACHABLE = "Couldn't reach the shared board. Check your connection and try again.";

/**
 * Browser REST calls go to this site, then the server forwards them to Supabase.
 * iPhone Safari reports a cross-origin failure as "TypeError: Load failed" and
 * the request never reaches the project. Realtime is left on the project URL.
 */
export function sharedBoardUrl(requestUrl: string, pageOrigin: string | null): string {
  if (!pageOrigin) return requestUrl;
  let parsed: URL;
  try {
    parsed = new URL(requestUrl);
  } catch {
    return requestUrl;
  }
  if (parsed.pathname !== "/rest/v1" && !parsed.pathname.startsWith("/rest/v1/")) return requestUrl;
  return `${pageOrigin}${BOARD_PROXY_PREFIX}${parsed.pathname}${parsed.search}`;
}

/** Path under the proxy that may be forwarded. Anything else is refused. */
export function upstreamRestPath(requestUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(requestUrl, "https://app.local");
  } catch {
    return null;
  }
  let pathname = parsed.pathname;
  if (pathname.startsWith(`${BOARD_PROXY_PREFIX}/`)) pathname = pathname.slice(BOARD_PROXY_PREFIX.length);
  if (pathname !== "/rest/v1" && !pathname.startsWith("/rest/v1/")) return null;
  if (pathname.split("/").includes("..")) return null;
  return `${pathname}${parsed.search}`;
}

export function supabaseOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}
