import { appConfig, type FeedbackConfig } from "../config/app.config";
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from "../lib/feedbackClient";

export const SUBMISSIONS_PER_HOUR = 10;
export const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const TITLE_LENGTH = 60;
const LINEAR_URL = "https://api.linear.app/graphql";

export type FeedbackRequest = {
  method: string;
  contentType: string | null;
  body: unknown;
  ip: string;
  userAgent: string;
  now: number;
  env: {
    linearApiKey?: string;
    version: string;
  };
};

export type FeedbackResponse = {
  status: number;
  body: Record<string, unknown>;
};

type PlayerRef = { id: string; name: string };

type Deps = {
  fetchImpl?: typeof fetch;
  config?: FeedbackConfig;
  players?: readonly PlayerRef[];
};

type Workspace = {
  teamId: string;
  labels: Map<string, string>;
  states: Map<string, string>;
  projectId: string | null;
};

type Parsed = {
  kind: "bug" | "feature";
  description: string;
  deviceId: string;
  clientRequestId: string;
  playerId: string;
  screen: string;
  mode: string | null;
  seasonId: string | null;
  deckFile: string | null;
  phraseId: string | null;
  drillType: string | null;
  lastAnswer: string | null;
  online: boolean | null;
};

type LinearPayload = {
  data?: {
    teams?: { nodes: { id: string; states?: { nodes: { id: string; name: string }[] } }[] };
    issueLabels?: { nodes: { id: string; name: string }[] };
    projects?: { nodes: { id: string; name: string }[] };
    issueCreate?: { success?: boolean; issue?: { identifier?: string | null } | null };
  };
  errors?: { message?: string }[];
};

const buckets = new Map<string, number[]>();
const replays = new Map<string, { identifier: string; at: number }>();
const creates = new Map<string, Promise<FeedbackResponse>>();
let workspaceCache: { signature: string; value: Workspace } | null = null;
let workspacePending: { signature: string; promise: Promise<Workspace> } | null = null;

export function resetFeedbackState(): void {
  buckets.clear();
  replays.clear();
  creates.clear();
  workspaceCache = null;
  workspacePending = null;
}

function invalid(): FeedbackResponse {
  return { status: 400, body: { ok: false, error: "invalid" } };
}

function limited(): FeedbackResponse {
  return { status: 429, body: { ok: false, error: "rate_limited" } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return clip(trimmed, max);
}

function parseBody(contentType: string | null, body: unknown): Record<string, unknown> | null {
  if (!contentType?.toLowerCase().includes("application/json")) return null;
  let value = body;
  if (typeof value === "string") {
    if (!value.trim() || value.length > 20_000) return null;
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return isRecord(value) ? value : null;
}

function parseSubmission(record: Record<string, unknown>): Parsed | "honeypot" | null {
  const company = record.company;
  const honeypot =
    !(company === undefined || company === null || (typeof company === "string" && company.trim() === ""));
  if (honeypot) return "honeypot";
  if (record.kind !== "bug" && record.kind !== "feature") return null;
  if (typeof record.description !== "string") return null;
  const description = record.description.trim();
  if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) return null;
  if (typeof record.deviceId !== "string" || !/^[A-Za-z0-9-]{8,80}$/.test(record.deviceId)) return null;
  if (typeof record.clientRequestId !== "string" || !/^[A-Za-z0-9-]{8,80}$/.test(record.clientRequestId)) {
    return null;
  }
  const online = typeof record.online === "boolean" ? record.online : null;
  return {
    kind: record.kind,
    description,
    deviceId: record.deviceId,
    clientRequestId: record.clientRequestId,
    playerId: optionalText(record.playerId, 40) ?? "",
    screen: optionalText(record.screen, 40) ?? "unknown",
    mode: optionalText(record.mode, 40),
    seasonId: optionalText(record.seasonId, 80),
    deckFile: optionalText(record.deckFile, 80),
    phraseId: optionalText(record.phraseId, 80),
    drillType: optionalText(record.drillType, 40),
    lastAnswer: optionalText(record.lastAnswer, 500),
    online,
  };
}

function bucketKey(deviceId: string, ip: string): string {
  return `${deviceId}\n${ip || "unknown"}`;
}

function recent(deviceId: string, ip: string, now: number): number[] {
  const key = bucketKey(deviceId, ip);
  const kept = (buckets.get(key) ?? []).filter((at) => now - at < SUBMISSION_WINDOW_MS);
  buckets.set(key, kept);
  return kept;
}

function hasRoom(deviceId: string, ip: string, now: number): boolean {
  return recent(deviceId, ip, now).length < SUBMISSIONS_PER_HOUR;
}

function remember(deviceId: string, ip: string, now: number): void {
  recent(deviceId, ip, now).push(now);
}

function issueTitle(kind: "bug" | "feature", description: string): string {
  const prefix = kind === "bug" ? "[Bug]" : "[Idea]";
  const flat = description.replace(/\s+/g, " ").trim();
  const snippet = flat.length <= TITLE_LENGTH ? flat : `${flat.slice(0, TITLE_LENGTH).trimEnd()}…`;
  return `${prefix} ${snippet}`;
}

function submittedBy(players: readonly PlayerRef[], playerId: string): string {
  if (!playerId) return "Unknown";
  return players.find((player) => player.id === playerId)?.name ?? "Unknown";
}

function issueDescription(input: {
  kind: "bug" | "feature";
  description: string;
  who: string;
  screen: string;
  mode: string | null;
  seasonId: string | null;
  deckFile: string | null;
  phraseId: string | null;
  drillType: string | null;
  lastAnswer: string | null;
  version: string;
  userAgent: string;
  online: boolean | null;
  submitted: string;
}): string {
  const lines = [`Submitted by: ${input.who}`, `Screen: ${input.screen}`];
  if (input.mode) lines.push(`Mode: ${input.mode}`);
  if (input.seasonId) lines.push(`Season: ${input.seasonId}`);
  if (input.kind === "bug" && input.screen === "drill") {
    lines.push(`Deck: ${input.deckFile ?? "none"}`);
    lines.push(`Phrase: ${input.phraseId ?? "none"}`);
    lines.push(`Drill: ${input.drillType ?? "none"}`);
    lines.push(`Last answer: ${input.lastAnswer ?? "none"}`);
  }
  lines.push(`Version: ${input.version}`);
  lines.push(`User agent: ${input.userAgent || "unknown"}`);
  lines.push(`Online: ${input.online === null ? "unknown" : input.online ? "yes" : "no"}`);
  lines.push(`Submitted: ${input.submitted}`);
  const context = ["### Context", ...lines.map((line) => `- ${line}`)].join("\n");
  return `${input.description}\n\n---\n\n${context}`;
}

function safeMessage(error: unknown, apiKey: string): string {
  const raw = error instanceof Error ? error.message : "Linear request failed.";
  const cleaned = apiKey ? raw.split(apiKey).join("[redacted]") : raw;
  return cleaned.slice(0, 240) || "Linear request failed.";
}

async function linear(
  fetchImpl: typeof fetch,
  apiKey: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<LinearPayload> {
  const response = await fetchImpl(LINEAR_URL, {
    method: "POST",
    redirect: "error",
    headers: {
      "content-type": "application/json",
      authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  let payload: LinearPayload;
  try {
    payload = JSON.parse(text) as LinearPayload;
  } catch {
    throw new Error(`Linear returned ${response.status}.`);
  }
  if (!response.ok || (payload.errors && payload.errors.length > 0)) {
    throw new Error(payload.errors?.[0]?.message || `Linear returned ${response.status}.`);
  }
  return payload;
}

const RESOLVE_QUERY = `
  query FeedbackTargets($teamKey: String!, $labelNames: [String!]!, $projectName: String!, $skipProject: Boolean!) {
    teams(filter: { key: { eq: $teamKey } }) {
      nodes {
        id
        states(first: 50) {
          nodes {
            id
            name
          }
        }
      }
    }
    issueLabels(filter: { name: { in: $labelNames } }) {
      nodes {
        id
        name
      }
    }
    projects(filter: { name: { eq: $projectName } }, first: 5) @skip(if: $skipProject) {
      nodes {
        id
        name
      }
    }
  }
`;

const CREATE_QUERY = `
  mutation FeedbackIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        identifier
      }
    }
  }
`;

function cacheSignature(config: FeedbackConfig): string {
  return JSON.stringify({
    teamKey: config.teamKey,
    projectName: config.projectName,
    labels: config.labels,
    states: config.states,
  });
}

async function loadWorkspace(fetchImpl: typeof fetch, apiKey: string, config: FeedbackConfig): Promise<Workspace> {
  const signature = cacheSignature(config);
  if (workspaceCache?.signature === signature) return workspaceCache.value;
  if (workspacePending?.signature === signature) return workspacePending.promise;
  const promise = resolveWorkspace(fetchImpl, apiKey, config).then((value) => {
    workspaceCache = { signature, value };
    return value;
  });
  workspacePending = { signature, promise };
  try {
    return await promise;
  } finally {
    if (workspacePending?.promise === promise) workspacePending = null;
  }
}

async function resolveWorkspace(fetchImpl: typeof fetch, apiKey: string, config: FeedbackConfig): Promise<Workspace> {
  const projectName = config.projectName.trim();
  const payload = await linear(fetchImpl, apiKey, RESOLVE_QUERY, {
    teamKey: config.teamKey,
    labelNames: [config.labels.source, config.labels.bug, config.labels.feature],
    projectName,
    skipProject: projectName.length === 0,
  });
  const team = payload.data?.teams?.nodes[0];
  if (!team?.id) throw new Error("Missing Linear team.");
  const labels = new Map((payload.data?.issueLabels?.nodes ?? []).map((label) => [label.name, label.id]));
  for (const name of [config.labels.source, config.labels.bug, config.labels.feature]) {
    if (!labels.get(name)) throw new Error(`Missing Linear label: ${name}`);
  }
  const states = new Map((team.states?.nodes ?? []).map((state) => [state.name, state.id]));
  if (!states.get(config.states.fallback)) throw new Error(`Missing Linear state: ${config.states.fallback}`);
  let projectId: string | null = null;
  if (projectName) {
    const project = payload.data?.projects?.nodes?.find((item) => item.name === projectName);
    if (!project) throw new Error("Missing Linear project.");
    projectId = project.id;
  }
  return { teamId: team.id, labels, states, projectId };
}

async function createIssue(fetchImpl: typeof fetch, apiKey: string, input: Record<string, unknown>): Promise<string> {
  const payload = await linear(fetchImpl, apiKey, CREATE_QUERY, { input });
  const created = payload.data?.issueCreate;
  const identifier = created?.issue?.identifier?.trim() ?? "";
  if (!created?.success || !identifier) throw new Error("Linear did not create an issue.");
  return identifier;
}

function stateIdFor(workspace: Workspace, config: FeedbackConfig, kind: "bug" | "feature"): string {
  const preferred = kind === "bug" ? config.states.bug : config.states.feature;
  return workspace.states.get(preferred) ?? workspace.states.get(config.states.fallback) ?? "";
}

export async function handleFeedback(request: FeedbackRequest, deps?: Deps): Promise<FeedbackResponse> {
  if (request.method.toUpperCase() !== "POST") {
    return { status: 405, body: { ok: false, error: "method" } };
  }
  const apiKey = request.env.linearApiKey?.trim() ?? "";
  if (!apiKey) return { status: 503, body: { ok: false, error: "not_configured" } };

  const record = parseBody(request.contentType, request.body);
  if (!record) return invalid();
  const parsed = parseSubmission(record);
  if (parsed === "honeypot") return { status: 200, body: { ok: true, dropped: true } };
  if (!parsed) return invalid();

  const config = deps?.config ?? appConfig.feedback;
  const players = deps?.players ?? appConfig.players;
  const fetchImpl = deps?.fetchImpl ?? fetch;
  const now = Number.isFinite(request.now) ? request.now : Date.now();
  const version = clip(request.env.version.trim() || "dev", 64);
  const userAgent = clip(request.userAgent.trim() || "unknown", 300);
  const submitted = new Date(now).toISOString();
  const replayKey = `${parsed.deviceId}\n${parsed.clientRequestId}`;
  const saved = replays.get(replayKey);
  if (saved && now - saved.at < SUBMISSION_WINDOW_MS) {
    return { status: 200, body: { ok: true, identifier: saved.identifier } };
  }
  const existing = creates.get(replayKey);
  if (existing) return existing;
  if (!hasRoom(parsed.deviceId, request.ip, now)) return limited();

  const run = file(parsed, {
    fetchImpl,
    apiKey,
    config,
    players,
    version,
    userAgent,
    submitted,
    now,
    ip: request.ip,
    replayKey,
  }).finally(() => {
    creates.delete(replayKey);
  });
  creates.set(replayKey, run);
  return run;
}

async function file(
  parsed: Parsed,
  input: {
    fetchImpl: typeof fetch;
    apiKey: string;
    config: FeedbackConfig;
    players: readonly PlayerRef[];
    version: string;
    userAgent: string;
    submitted: string;
    now: number;
    ip: string;
    replayKey: string;
  },
): Promise<FeedbackResponse> {
  try {
    const workspace = await loadWorkspace(input.fetchImpl, input.apiKey, input.config);
    const stateId = stateIdFor(workspace, input.config, parsed.kind);
    if (!stateId) throw new Error("Missing Linear state.");
    const sourceId = workspace.labels.get(input.config.labels.source);
    const kindLabel = parsed.kind === "bug" ? input.config.labels.bug : input.config.labels.feature;
    const kindId = workspace.labels.get(kindLabel);
    if (!sourceId || !kindId) throw new Error("Missing Linear label.");
    const issueInput: Record<string, unknown> = {
      teamId: workspace.teamId,
      title: issueTitle(parsed.kind, parsed.description),
      description: issueDescription({
        kind: parsed.kind,
        description: parsed.description,
        who: submittedBy(input.players, parsed.playerId),
        screen: parsed.screen,
        mode: parsed.mode,
        seasonId: parsed.seasonId,
        deckFile: parsed.deckFile,
        phraseId: parsed.phraseId,
        drillType: parsed.drillType,
        lastAnswer: parsed.lastAnswer,
        version: input.version,
        userAgent: input.userAgent,
        online: parsed.online,
        submitted: input.submitted,
      }),
      stateId,
      labelIds: [sourceId, kindId],
    };
    if (parsed.kind === "bug") issueInput.priority = input.config.bugPriority;
    if (workspace.projectId) issueInput.projectId = workspace.projectId;
    const identifier = await createIssue(input.fetchImpl, input.apiKey, issueInput);
    remember(parsed.deviceId, input.ip, input.now);
    replays.set(input.replayKey, { identifier, at: input.now });
    return { status: 200, body: { ok: true, identifier } };
  } catch (error) {
    console.error("feedback:", safeMessage(error, input.apiKey));
    return { status: 502, body: { ok: false, error: "linear", message: safeMessage(error, input.apiKey) } };
  }
}
