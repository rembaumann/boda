import type { AnsweredQuestion } from "../domain/types";

export type PhraseStat = {
  seen: number;
  correct: number;
  incorrect: number;
  lastResult: "correct" | "incorrect" | null;
  lastSeenAt: string | null;
  ease: number;
  intervalDays: number;
  nextDueOn: string | null;
};

export type Streak = {
  current: number;
  longest: number;
  lastPlayedOn: string | null;
};

export type SessionRecord = {
  id: string;
  seasonId: string;
  completedAt: string;
  questions: AnsweredQuestion[];
  correctCount: number;
  total: number;
};

export type PlayerProgress = {
  playerId: string;
  updatedAt: string;
  sessions: SessionRecord[];
  phraseStats: Record<string, PhraseStat>;
  streak: Streak;
};

export type StoredProgress = {
  schemaVersion: 1;
  lastPlayerId: string | null;
  lastSeasonId: string | null;
  players: Record<string, PlayerProgress>;
};

const MAX_SESSIONS = 20;
const INITIAL_EASE = 2.5;

export function emptyProgress(): StoredProgress {
  return {
    schemaVersion: 1,
    lastPlayerId: null,
    lastSeasonId: null,
    players: {},
  };
}

function emptyPlayer(playerId: string, now: string): PlayerProgress {
  return {
    playerId,
    updatedAt: now,
    sessions: [],
    phraseStats: {},
    streak: { current: 0, longest: 0, lastPlayedOn: null },
  };
}

function emptyStat(): PhraseStat {
  return {
    seen: 0,
    correct: 0,
    incorrect: 0,
    lastResult: null,
    lastSeenAt: null,
    ease: INITIAL_EASE,
    intervalDays: 0,
    nextDueOn: null,
  };
}

export function createSessionRecord(input: {
  seasonId: string;
  questions: readonly AnsweredQuestion[];
  completedAt: string;
  id?: string;
}): SessionRecord {
  const correctCount = input.questions.filter((question) => question.correct).length;
  return {
    id: input.id ?? crypto.randomUUID(),
    seasonId: input.seasonId,
    completedAt: input.completedAt,
    questions: [...input.questions],
    correctCount,
    total: input.questions.length,
  };
}

export function applySession(
  progress: StoredProgress,
  session: SessionRecord,
  playerId: string,
  now: string,
): StoredProgress {
  const player = progress.players[playerId] ?? emptyPlayer(playerId, now);
  const phraseStats: Record<string, PhraseStat> = { ...player.phraseStats };

  for (const question of session.questions) {
    const prev = phraseStats[question.phraseId] ?? emptyStat();
    phraseStats[question.phraseId] = {
      seen: prev.seen + 1,
      correct: prev.correct + (question.correct ? 1 : 0),
      incorrect: prev.incorrect + (question.correct ? 0 : 1),
      lastResult: question.correct ? "correct" : "incorrect",
      lastSeenAt: now,
      ease: prev.ease,
      intervalDays: prev.intervalDays,
      nextDueOn: prev.nextDueOn,
    };
  }

  return {
    ...progress,
    players: {
      ...progress.players,
      [playerId]: {
        ...player,
        updatedAt: now,
        sessions: [session, ...player.sessions].slice(0, MAX_SESSIONS),
        phraseStats,
        streak: player.streak,
      },
    },
  };
}
