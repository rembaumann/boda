import type { SeasonConfig } from "../domain/types";

export type DuelResult = {
  playerId: string;
  playedOn: string;
  seasonId: string;
  seasonNumber: number;
  correctCount: number;
  questionCount: number;
  elapsedMs: number;
  marks: string;
  createdAt: string;
};

export type DayStatus = "waiting" | "tie" | "decided";

export type ScoredDay = {
  date: string;
  status: DayStatus;
  winnerId: string | null;
  playedIds: readonly string[];
};

export type SeasonState = {
  number: number;
  seasonId: string;
  theme: string;
  deckFile: string | null;
  points: Readonly<Record<string, number>>;
  winnerId: string | null;
  days: readonly ScoredDay[];
};

export type Standing = {
  id: string;
  name: string;
  points: number;
  trophies: number;
};

export type BoardView = {
  seasonNumber: number;
  seasonId: string;
  theme: string;
  deckFile: string | null;
  standings: readonly Standing[];
  todayLabel: string;
  youPlayed: boolean;
  yourMarks: string | null;
  target: number;
};

type NamedPlayer = { id: string; name: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function scoreableResult(result: DuelResult, roster: ReadonlySet<string>): boolean {
  return (
    roster.has(result.playerId) &&
    DATE.test(result.playedOn) &&
    Number.isInteger(result.correctCount) &&
    Number.isInteger(result.questionCount) &&
    result.questionCount > 0 &&
    result.correctCount >= 0 &&
    result.correctCount <= result.questionCount &&
    Number.isInteger(result.elapsedMs) &&
    result.elapsedMs > 0
  );
}

function dedupe(results: readonly DuelResult[], roster: ReadonlySet<string>): DuelResult[] {
  const sorted = results
    .filter((result) => scoreableResult(result, roster))
    .slice()
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) ||
        a.playedOn.localeCompare(b.playedOn) ||
        a.playerId.localeCompare(b.playerId),
    );
  const seen = new Set<string>();
  const unique: DuelResult[] = [];
  for (const result of sorted) {
    const key = `${result.playerId}|${result.playedOn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(result);
  }
  return unique;
}

/** Positive when `a` should win the day. */
function comparePlays(a: DuelResult, b: DuelResult): number {
  const accuracy = a.correctCount * b.questionCount - b.correctCount * a.questionCount;
  if (accuracy !== 0) return accuracy;
  if (a.elapsedMs !== b.elapsedMs) return b.elapsedMs - a.elapsedMs;
  return 0;
}

function judgeDay(plays: readonly DuelResult[], playerIds: readonly string[]): ScoredDay {
  const date = plays[0]?.playedOn ?? "";
  const playedIds = playerIds.filter((id) => plays.some((play) => play.playerId === id));
  if (playedIds.length < playerIds.length || playerIds.length === 0) {
    return { date, status: "waiting", winnerId: null, playedIds };
  }
  const ordered = playerIds.map((id) => plays.find((play) => play.playerId === id));
  let best = ordered[0];
  let tied = false;
  for (const play of ordered.slice(1)) {
    if (!best || !play) continue;
    const comparison = comparePlays(play, best);
    if (comparison > 0) {
      best = play;
      tied = false;
    } else if (comparison === 0) {
      tied = true;
    }
  }
  if (!best || tied) return { date, status: "tie", winnerId: null, playedIds };
  return { date, status: "decided", winnerId: best.playerId, playedIds };
}

function themesInOrder(themes: readonly SeasonConfig[]): SeasonConfig[] {
  return themes.slice().sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function themeAt(themes: readonly SeasonConfig[], seasonNumber: number): SeasonConfig {
  const ordered = themesInOrder(themes);
  const theme = ordered[(seasonNumber - 1) % ordered.length];
  if (!theme) throw new Error("Add at least one season before scoring a duel.");
  return theme;
}

function emptyPoints(playerIds: readonly string[]): Record<string, number> {
  const points: Record<string, number> = {};
  for (const id of playerIds) points[id] = 0;
  return points;
}

export function scoreSeasons(input: {
  results: readonly DuelResult[];
  playerIds: readonly string[];
  themes: readonly SeasonConfig[];
  target: number;
}): { active: SeasonState; completed: readonly SeasonState[] } {
  if (!Number.isInteger(input.target) || input.target < 1) {
    throw new Error("Season target must be a positive integer.");
  }
  if (input.themes.length === 0) throw new Error("Add at least one season before scoring a duel.");
  const roster = new Set(input.playerIds);
  const unique = dedupe(input.results, roster);
  const byDate = new Map<string, DuelResult[]>();
  for (const result of unique) {
    const list = byDate.get(result.playedOn) ?? [];
    list.push(result);
    byDate.set(result.playedOn, list);
  }
  const dates = [...byDate.keys()].sort();

  let number = 1;
  let points = emptyPoints(input.playerIds);
  let days: ScoredDay[] = [];
  const completed: SeasonState[] = [];

  const snapshot = (winnerId: string | null): SeasonState => {
    const theme = themeAt(input.themes, number);
    return {
      number,
      seasonId: theme.id,
      theme: theme.theme,
      deckFile: theme.deckFile,
      points: { ...points },
      winnerId,
      days,
    };
  };

  for (const date of dates) {
    const day = judgeDay(byDate.get(date) ?? [], input.playerIds);
    days = [...days, day];
    if (day.winnerId) points = { ...points, [day.winnerId]: (points[day.winnerId] ?? 0) + 1 };
    if (day.winnerId && (points[day.winnerId] ?? 0) >= input.target) {
      completed.push(snapshot(day.winnerId));
      number += 1;
      points = emptyPoints(input.playerIds);
      days = [];
    }
  }

  return { active: snapshot(null), completed };
}

function joinNames(ids: readonly string[], players: readonly NamedPlayer[]): string {
  const names = ids.map((id) => players.find((player) => player.id === id)?.name ?? id);
  if (names.length === 0) return "the other player";
  if (names.length === 1) return names[0] ?? "the other player";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  const tail = names[names.length - 1];
  return `${names.slice(0, -1).join(", ")}, and ${tail}`;
}

function findDay(
  active: SeasonState,
  completed: readonly SeasonState[],
  today: string,
): { day: ScoredDay | null; closedSeason: boolean } {
  for (const season of completed) {
    const day = season.days.find((item) => item.date === today);
    if (day) return { day, closedSeason: season.days[season.days.length - 1]?.date === today };
  }
  const day = active.days.find((item) => item.date === today) ?? null;
  return { day, closedSeason: false };
}

export function presentBoard(input: {
  results: readonly DuelResult[];
  players: readonly NamedPlayer[];
  themes: readonly SeasonConfig[];
  target: number;
  today: string;
  youId: string;
}): BoardView {
  const playerIds = input.players.map((player) => player.id);
  const { active, completed } = scoreSeasons({
    results: input.results,
    playerIds,
    themes: input.themes,
    target: input.target,
  });
  const trophies: Record<string, number> = {};
  for (const id of playerIds) trophies[id] = 0;
  for (const season of completed) {
    if (!season.winnerId) continue;
    trophies[season.winnerId] = (trophies[season.winnerId] ?? 0) + 1;
  }
  const yours = dedupe(input.results, new Set(playerIds)).find(
    (result) => result.playerId === input.youId && result.playedOn === input.today,
  );
  const { day, closedSeason } = findDay(active, completed, input.today);
  const playedIds = day?.playedIds ?? [];
  const missing = playerIds.filter((id) => !playedIds.includes(id));
  let todayLabel = "No plays yet today.";
  if (day?.status === "waiting" && playedIds.length > 0 && playedIds.includes(input.youId)) {
    todayLabel = `Waiting on ${joinNames(missing, input.players)}.`;
  } else if (day?.status === "waiting" && playedIds.length > 0) {
    todayLabel = `${joinNames(playedIds, input.players)} finished. Your turn.`;
  } else if (day?.status === "tie") {
    todayLabel = "Tie. Nobody gets the point.";
  } else if (day?.status === "decided") {
    todayLabel =
      day.winnerId === input.youId
        ? "You take the point."
        : `${joinNames([day.winnerId ?? ""], input.players)} takes the point.`;
  }
  if (closedSeason && day && day.status !== "waiting") {
    todayLabel = `${todayLabel} The next season has started.`;
  }

  return {
    seasonNumber: active.number,
    seasonId: active.seasonId,
    theme: active.theme,
    deckFile: active.deckFile,
    standings: input.players.map((player) => ({
      id: player.id,
      name: player.name,
      points: active.points[player.id] ?? 0,
      trophies: trophies[player.id] ?? 0,
    })),
    todayLabel,
    youPlayed: playedIds.includes(input.youId),
    yourMarks: yours?.marks ?? null,
    target: input.target,
  };
}

export function resultKey(result: Pick<DuelResult, "playerId" | "playedOn">): string {
  return `${result.playerId}|${result.playedOn}`;
}

export function playerHasResult(results: readonly DuelResult[], playerId: string, date: string): boolean {
  return results.some(
    (result) =>
      result.playerId === playerId &&
      result.playedOn === date &&
      scoreableResult(result, new Set([playerId])),
  );
}
