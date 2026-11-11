import { appConfig } from "../config/app.config";

export const DESCRIPTION_MIN = 5;
export const DESCRIPTION_MAX = 1000;

export const OFFLINE_MESSAGE = "You're offline, try again when connected.";
export const UNCONFIGURED_MESSAGE = "Feedback isn't configured.";
export const RETRY_MESSAGE = "Couldn't send that. Try again in a moment.";

export type FeedbackKind = "bug" | "feature";

export type FeedbackFields = {
  playerId: string;
  screen: string;
  mode: string | null;
  seasonId: string | null;
  deckFile: string | null;
  phraseId: string | null;
  drillType: string | null;
  lastAnswer: string | null;
};

export type DrillLive = {
  phraseId: string;
  drillType: string;
  response: string | null;
};

export type FeedbackPayload = FeedbackFields & {
  kind: FeedbackKind;
  description: string;
  company: string;
  deviceId: string;
  clientRequestId: string;
  online: boolean;
};

export type FeedbackResult =
  | { status: "sent"; identifier: string | null }
  | { status: "unconfigured" }
  | { status: "offline" }
  | { status: "error" };

function onlineNow(override: boolean | undefined): boolean {
  if (typeof override === "boolean") return override;
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function deviceId(): string {
  const key = `${appConfig.storageKey}.device`;
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(key, created);
    return created;
  } catch {
    return "unknown-device";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function interpret(response: Response): Promise<FeedbackResult> {
  const text = await response.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = asRecord(JSON.parse(text) as unknown);
  } catch {
    // A non-JSON body is treated as an unconfigured or failed endpoint below.
  }
  if (!data) {
    if (response.status === 404 || response.status === 405 || response.ok) return { status: "unconfigured" };
    return { status: "error" };
  }
  if (data.error === "not_configured") return { status: "unconfigured" };
  if (data.ok === true && data.dropped === true) return { status: "sent", identifier: null };
  if (data.ok === true && typeof data.identifier === "string" && data.identifier.trim()) {
    return { status: "sent", identifier: data.identifier.trim() };
  }
  return { status: "error" };
}

export async function postFeedback(
  payload: FeedbackPayload,
  options?: { fetchImpl?: typeof fetch; online?: boolean },
): Promise<FeedbackResult> {
  if (!onlineNow(options?.online)) return { status: "offline" };
  const fetchImpl = options?.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return await interpret(response);
  } catch {
    return onlineNow(options?.online) ? { status: "error" } : { status: "offline" };
  }
}
