import { appConfig } from "../config/app.config";
import { scoreableResult, type DuelResult } from "./scoring";

const MAX_STORED = 400;

function storageKey(): string {
  return `${appConfig.storageKey}.duel`;
}

export function parseDuelFile(value: unknown): DuelResult[] {
  if (!value || typeof value !== "object") return [];
  const results = (value as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];
  return results.flatMap((item) => {
    const result = parseStoredResult(item);
    return result ? [result] : [];
  });
}

function parseStoredResult(value: unknown): DuelResult | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const result: DuelResult = {
    playerId: typeof row.playerId === "string" ? row.playerId : "",
    playedOn: typeof row.playedOn === "string" ? row.playedOn : "",
    seasonId: typeof row.seasonId === "string" ? row.seasonId : "",
    seasonNumber: typeof row.seasonNumber === "number" ? row.seasonNumber : 0,
    correctCount: typeof row.correctCount === "number" ? row.correctCount : -1,
    questionCount: typeof row.questionCount === "number" ? row.questionCount : 0,
    elapsedMs: typeof row.elapsedMs === "number" ? row.elapsedMs : 0,
    marks: typeof row.marks === "string" ? row.marks : "",
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
  };
  if (!scoreableResult(result, new Set([result.playerId]))) return null;
  return result;
}

export function loadLocalResults(): DuelResult[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    return parseDuelFile(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function saveLocalResult(result: DuelResult): void {
  try {
    const existing = loadLocalResults().filter(
      (item) => item.playerId !== result.playerId || item.playedOn !== result.playedOn,
    );
    const results = [...existing, result].slice(-MAX_STORED);
    localStorage.setItem(storageKey(), JSON.stringify({ schemaVersion: 1, results }));
  } catch {
    // The finished duel still stays on screen when storage is blocked.
  }
}
