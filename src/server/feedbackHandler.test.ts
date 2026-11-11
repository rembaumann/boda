import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig, type FeedbackConfig } from "../config/app.config";
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from "../lib/feedbackClient";
import {
  handleFeedback,
  resetFeedbackState,
  SUBMISSION_WINDOW_MS,
  SUBMISSIONS_PER_HOUR,
  type FeedbackRequest,
} from "./feedbackHandler";

const API_KEY = "lin_api_test_key";

type Call = {
  url: string;
  query: string;
  variables: Record<string, unknown>;
  authorization: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function workspace(config: FeedbackConfig, options?: { states?: { id: string; name: string }[]; labels?: { id: string; name: string }[] }) {
  return {
    teams: {
      nodes: [
        {
          id: "team-1",
          states: {
            nodes: options?.states ?? [
              { id: "state-triage", name: config.states.bug },
              { id: "state-backlog", name: config.states.feature },
            ],
          },
        },
      ],
    },
    issueLabels: {
      nodes: options?.labels ?? [
        { id: "label-source", name: config.labels.source },
        { id: "label-bug", name: config.labels.bug },
        { id: "label-feature", name: config.labels.feature },
      ],
    },
    projects: { nodes: [{ id: "project-1", name: config.projectName }] },
  };
}

function installFetch(config: FeedbackConfig = appConfig.feedback, options?: { states?: { id: string; name: string }[]; labels?: { id: string; name: string }[] }) {
  const calls: Call[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const raw = JSON.parse(String(init?.body)) as { query: string; variables: Record<string, unknown> };
    calls.push({
      url: String(input),
      query: raw.query,
      variables: raw.variables,
      authorization: new Headers(init?.headers).get("authorization") ?? "",
    });
    if (raw.query.includes("issueCreate")) {
      return json({ data: { issueCreate: { success: true, issue: { identifier: "REM-23" } } } });
    }
    return json({ data: workspace(config, options) });
  };
  return { calls, fetchImpl };
}

function request(body: unknown, overrides: Partial<FeedbackRequest> = {}): FeedbackRequest {
  return {
    method: "POST",
    contentType: "application/json",
    body,
    ip: "203.0.113.8",
    userAgent: "TestAgent",
    now: Date.parse("2026-11-11T16:30:00.000Z"),
    env: { linearApiKey: API_KEY, version: "abc123" },
    ...overrides,
  };
}

function submission(overrides: Record<string, unknown> = {}) {
  return {
    kind: "bug",
    description: "The listen button stayed silent.",
    company: "",
    deviceId: "device-0001",
    clientRequestId: "request-0001",
    playerId: "shannon",
    screen: "drill",
    mode: "practice",
    seasonId: "scouting-mexico-city",
    deckFile: "scouting-mexico-city",
    phraseId: "cafe-order",
    drillType: "listen",
    lastAnswer: "un cafe",
    online: true,
    ...overrides,
  };
}

function creates(calls: Call[]): Record<string, unknown>[] {
  return calls
    .filter((call) => call.query.includes("issueCreate"))
    .map((call) => call.variables.input as Record<string, unknown>);
}

describe("handleFeedback", () => {
  beforeEach(() => {
    resetFeedbackState();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns not configured when the key is missing and does not call Linear", async () => {
    const { calls, fetchImpl } = installFetch();
    const missing = await handleFeedback(request(submission(), { env: { linearApiKey: undefined, version: "dev" } }), {
      fetchImpl,
    });
    const blank = await handleFeedback(request(submission(), { env: { linearApiKey: "   ", version: "dev" } }), {
      fetchImpl,
    });
    expect(missing).toEqual({ status: 503, body: { ok: false, error: "not_configured" } });
    expect(blank.status).toBe(503);
    expect(calls).toHaveLength(0);
  });

  it("drops a filled honeypot without creating an issue", async () => {
    const { calls, fetchImpl } = installFetch();
    const result = await handleFeedback(request(submission({ company: " https://spam.example " })), { fetchImpl });
    expect(result).toEqual({ status: 200, body: { ok: true, dropped: true } });
    expect(calls).toHaveLength(0);
  });

  it("rejects descriptions outside 5 to 1000 characters, bad JSON, and non-POST", async () => {
    const { calls, fetchImpl } = installFetch();
    const tooShort = await handleFeedback(request(submission({ description: "abcd" })), { fetchImpl });
    const empty = await handleFeedback(request(submission({ description: "   " })), { fetchImpl });
    const tooLong = await handleFeedback(request(submission({ description: "a".repeat(DESCRIPTION_MAX + 1) })), {
      fetchImpl,
    });
    const malformed = await handleFeedback(request("{"), { fetchImpl });
    const arrayBody = await handleFeedback(request([]), { fetchImpl });
    const text = await handleFeedback(request(submission(), { contentType: "text/plain" }), { fetchImpl });
    const get = await handleFeedback(request(submission(), { method: "GET" }), { fetchImpl });
    expect(tooShort.status).toBe(400);
    expect(empty.status).toBe(400);
    expect(tooLong.status).toBe(400);
    expect(malformed.status).toBe(400);
    expect(arrayBody.status).toBe(400);
    expect(text.status).toBe(400);
    expect(get.status).toBe(405);
    expect(DESCRIPTION_MIN).toBe(5);
    expect(calls).toHaveLength(0);
  });

  it("creates one bug in Triage at high priority with the context block", async () => {
    const { calls, fetchImpl } = installFetch();
    const description = "  The listen button stayed silent.\nIt never spoke.  ";
    const result = await handleFeedback(
      request(submission({ description, clientRequestId: "request-bug1" }), {
        userAgent: "Phone",
        contentType: "application/json; charset=utf-8",
      }),
      { fetchImpl },
    );
    expect(result).toEqual({ status: 200, body: { ok: true, identifier: "REM-23" } });
    expect(calls[0]?.url).toBe("https://api.linear.app/graphql");
    expect(calls[0]?.authorization).toBe(API_KEY);
    expect(calls[0]?.authorization.startsWith("Bearer ")).toBe(false);
    expect(calls[0]?.variables.teamKey).toBe(appConfig.feedback.teamKey);
    expect(calls[0]?.variables.labelNames).toEqual([
      appConfig.feedback.labels.source,
      appConfig.feedback.labels.bug,
      appConfig.feedback.labels.feature,
    ]);
    expect(calls[0]?.variables.projectName).toBe(appConfig.feedback.projectName);
    const input = creates(calls)[0];
    expect(input).toMatchObject({
      teamId: "team-1",
      title: "[Bug] The listen button stayed silent. It never spoke.",
      stateId: "state-triage",
      priority: appConfig.feedback.bugPriority,
      labelIds: ["label-source", "label-bug"],
      projectId: "project-1",
    });
    expect(input?.description).toBe(
      [
        "The listen button stayed silent.",
        "It never spoke.",
        "",
        "---",
        "",
        "### Context",
        "- Submitted by: Shannon",
        "- Screen: drill",
        "- Mode: practice",
        "- Season: scouting-mexico-city",
        "- Deck: scouting-mexico-city",
        "- Phrase: cafe-order",
        "- Drill: listen",
        "- Last answer: un cafe",
        "- Version: abc123",
        "- User agent: Phone",
        "- Online: yes",
        "- Submitted: 2026-11-11T16:30:00.000Z",
      ].join("\n"),
    );
    expect(creates(calls)).toHaveLength(1);
  });

  it("files a feature in Backlog with no priority and a short title", async () => {
    const { calls, fetchImpl } = installFetch();
    const description = "a".repeat(80);
    const result = await handleFeedback(
      request(
        submission({
          kind: "feature",
          description,
          playerId: "rem",
          screen: "home",
          mode: null,
          seasonId: "scouting-mexico-city",
          deckFile: null,
          phraseId: null,
          drillType: null,
          lastAnswer: null,
          clientRequestId: "request-idea",
          deviceId: "device-0099",
        }),
      ),
      { fetchImpl },
    );
    expect(result.status).toBe(200);
    const input = creates(calls)[0];
    expect(input?.title).toBe(`[Idea] ${"a".repeat(60)}…`);
    expect(input?.stateId).toBe("state-backlog");
    expect(input?.labelIds).toEqual(["label-source", "label-feature"]);
    expect(input).not.toHaveProperty("priority");
    expect(String(input?.description)).toContain("Submitted by: Rem");
    expect(String(input?.description)).toContain("Screen: home");
    expect(String(input?.description)).not.toContain("Phrase:");
    expect(String(input?.description).startsWith(description)).toBe(true);
  });

  it("falls back to Backlog when Triage is missing and skips a project when none is configured", async () => {
    const config: FeedbackConfig = {
      ...appConfig.feedback,
      teamKey: "FORK",
      projectName: "",
      bugPriority: 2,
    };
    const { calls, fetchImpl } = installFetch(config, {
      states: [{ id: "state-backlog", name: "Backlog" }],
    });
    const result = await handleFeedback(request(submission({ clientRequestId: "request-fall", deviceId: "device-0042" })), {
      fetchImpl,
      config,
    });
    expect(result.status).toBe(200);
    expect(calls[0]?.variables.teamKey).toBe("FORK");
    expect(calls[0]?.variables.skipProject).toBe(true);
    const input = creates(calls)[0];
    expect(input?.stateId).toBe("state-backlog");
    expect(input?.priority).toBe(2);
    expect(input).not.toHaveProperty("projectId");
  });

  it("creates one issue when the same request id is submitted twice", async () => {
    const { calls, fetchImpl } = installFetch();
    const body = submission({ clientRequestId: "request-same", deviceId: "device-0077" });
    const first = handleFeedback(request(body), { fetchImpl });
    const second = handleFeedback(request(body), { fetchImpl });
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual({ status: 200, body: { ok: true, identifier: "REM-23" } });
    expect(b).toEqual(a);
    expect(creates(calls)).toHaveLength(1);
    const again = await handleFeedback(request(body), { fetchImpl });
    expect(again).toEqual(a);
    expect(creates(calls)).toHaveLength(1);
  });

  it("limits a device and IP pair to 10 submissions an hour", async () => {
    const { calls, fetchImpl } = installFetch();
    const now = Date.parse("2026-11-11T12:00:00.000Z");
    for (let index = 0; index < SUBMISSIONS_PER_HOUR; index += 1) {
      const result = await handleFeedback(
        request(submission({ clientRequestId: `request-${index}`, deviceId: "device-rate" }), {
          now,
          ip: "198.51.100.10",
        }),
        { fetchImpl },
      );
      expect(result.status).toBe(200);
    }
    const blocked = await handleFeedback(
      request(submission({ clientRequestId: "request-blocked", deviceId: "device-rate" }), {
        now: now + 1,
        ip: "198.51.100.10",
      }),
      { fetchImpl },
    );
    expect(blocked).toEqual({ status: 429, body: { ok: false, error: "rate_limited" } });
    expect(creates(calls)).toHaveLength(SUBMISSIONS_PER_HOUR);
    const otherIp = await handleFeedback(
      request(submission({ clientRequestId: "request-other", deviceId: "device-rate" }), {
        now: now + 2,
        ip: "198.51.100.11",
      }),
      { fetchImpl },
    );
    expect(otherIp.status).toBe(200);
    const later = await handleFeedback(
      request(submission({ clientRequestId: "request-later", deviceId: "device-rate" }), {
        now: now + SUBMISSION_WINDOW_MS,
        ip: "198.51.100.10",
      }),
      { fetchImpl },
    );
    expect(later.status).toBe(200);
    expect(creates(calls)).toHaveLength(SUBMISSIONS_PER_HOUR + 2);
  });

  it("does not file an issue when the team or a label cannot be resolved", async () => {
    const { calls, fetchImpl } = installFetch(appConfig.feedback, {
      labels: [{ id: "label-source", name: appConfig.feedback.labels.source }],
    });
    const result = await handleFeedback(request(submission({ clientRequestId: "request-miss", deviceId: "device-miss" })), {
      fetchImpl,
    });
    expect(result.status).toBe(502);
    expect(result.body.error).toBe("linear");
    expect(creates(calls)).toHaveLength(0);
  });

  it("reuses the workspace lookup for the next submission", async () => {
    const { calls, fetchImpl } = installFetch();
    await handleFeedback(request(submission({ clientRequestId: "request-a1", deviceId: "device-cache" })), { fetchImpl });
    await handleFeedback(request(submission({ clientRequestId: "request-a2", deviceId: "device-cache" })), { fetchImpl });
    const lookups = calls.filter((call) => call.query.includes("FeedbackTargets"));
    expect(lookups).toHaveLength(1);
    expect(creates(calls)).toHaveLength(2);
  });
});
