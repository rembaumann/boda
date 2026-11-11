import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { scoreableResult, type DuelResult } from "./scoring";

const PAGE_SIZE = 1000;
export const MAX_ELAPSED_MS = 86_400_000;

const PLAYER_ID = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const SEASON_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export type SubmitOutcome = "saved" | "duplicate";

export type ScoreboardGateway = {
  configured: boolean;
  fetchResults: () => Promise<DuelResult[]>;
  submit: (result: DuelResult) => Promise<SubmitOutcome>;
  subscribe: (onChange: () => void) => () => void;
};

type DailyResultInsert = {
  player_id: string;
  season_id: string;
  season_number: number;
  played_on: string;
  correct_count: number;
  question_count: number;
  elapsed_ms: number;
  marks: string;
};

export function isDuplicateResultError(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" || /duplicate key/i.test(error.message ?? "");
}

export function duelResultFromRow(value: unknown): DuelResult | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const result: DuelResult = {
    playerId: typeof row.player_id === "string" ? row.player_id : "",
    playedOn: typeof row.played_on === "string" ? row.played_on : "",
    seasonId: typeof row.season_id === "string" ? row.season_id : "",
    seasonNumber: typeof row.season_number === "number" ? row.season_number : Number(row.season_number),
    correctCount: typeof row.correct_count === "number" ? row.correct_count : Number(row.correct_count),
    questionCount: typeof row.question_count === "number" ? row.question_count : Number(row.question_count),
    elapsedMs: typeof row.elapsed_ms === "number" ? row.elapsed_ms : Number(row.elapsed_ms),
    marks: typeof row.marks === "string" ? row.marks : "",
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
  };
  if (!Number.isFinite(result.seasonNumber)) return null;
  if (!scoreableResult(result, new Set([result.playerId]))) return null;
  return result;
}

export function toDailyResultInsert(result: DuelResult): DailyResultInsert {
  const ones = result.marks.split("").filter((mark) => mark === "1").length;
  const marksOk = /^[01]+$/.test(result.marks) && result.marks.length === result.questionCount && ones === result.correctCount;
  if (
    !PLAYER_ID.test(result.playerId) ||
    !SEASON_ID.test(result.seasonId) ||
    !Number.isInteger(result.seasonNumber) ||
    result.seasonNumber < 1 ||
    result.seasonNumber > 10000 ||
    !scoreableResult(result, new Set([result.playerId])) ||
    result.questionCount > 100 ||
    result.elapsedMs > MAX_ELAPSED_MS ||
    !marksOk
  ) {
    throw new Error("This duel result can't be shared.");
  }
  return {
    player_id: result.playerId,
    season_id: result.seasonId,
    season_number: result.seasonNumber,
    played_on: result.playedOn,
    correct_count: result.correctCount,
    question_count: result.questionCount,
    elapsed_ms: result.elapsedMs,
    marks: result.marks,
  };
}

function readEnv(): { url: string; anonKey: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function clientFor(env: { url: string; anonKey: string }): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function fetchAll(client: SupabaseClient): Promise<DuelResult[]> {
  const seasons = await client.from("seasons").select("id").limit(1);
  if (seasons.error) throw new Error(`Couldn't read seasons. ${seasons.error.message}`);

  const rows: DuelResult[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await client
      .from("daily_results")
      .select("player_id,season_id,season_number,played_on,correct_count,question_count,elapsed_ms,marks,created_at")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Couldn't read results. ${error.message}`);
    const page = data ?? [];
    for (const row of page) {
      const result = duelResultFromRow(row);
      if (result) rows.push(result);
    }
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

export function createScoreboardGateway(): ScoreboardGateway {
  const env = readEnv();
  if (!env) {
    return {
      configured: false,
      fetchResults: async () => [],
      submit: async () => {
        throw new Error("Supabase isn't configured.");
      },
      subscribe: () => () => undefined,
    };
  }

  const client = clientFor(env);
  return {
    configured: true,
    fetchResults: () => fetchAll(client),
    submit: async (result) => {
      const { error } = await client.from("daily_results").insert(toDailyResultInsert(result));
      if (!error) return "saved";
      if (isDuplicateResultError(error)) return "duplicate";
      throw new Error(error.message);
    },
    subscribe: (onChange) => {
      const channel = client
        .channel(`daily-results-${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "daily_results" }, () => {
          onChange();
        })
        .subscribe();
      return () => {
        void client.removeChannel(channel);
      };
    },
  };
}

let cached: ScoreboardGateway | null = null;

export function getScoreboardGateway(): ScoreboardGateway {
  cached ??= createScoreboardGateway();
  return cached;
}
