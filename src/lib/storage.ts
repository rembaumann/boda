import { appConfig } from "../config/app.config";
import { emptyProgress, type StoredProgress } from "./progress";

function isProgress(value: unknown): value is StoredProgress {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.schemaVersion === 1 && !!record.players && typeof record.players === "object";
}

export function loadProgress(): StoredProgress {
  try {
    const raw = localStorage.getItem(appConfig.storageKey);
    if (!raw) return emptyProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!isProgress(parsed)) return emptyProgress();
    return parsed;
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: StoredProgress): void {
  try {
    localStorage.setItem(appConfig.storageKey, JSON.stringify(progress));
  } catch {
    // A blocked or full store still leaves the finished set on screen.
  }
}
