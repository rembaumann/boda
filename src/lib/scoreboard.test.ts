import { afterEach, describe, expect, it, vi } from "vitest";
import { BOARD_UNREACHABLE } from "./boardEndpoint";
import { parseDuelFile } from "./duelStore";
import {
  boardFailureMessage,
  createScoreboardGateway,
  duelResultFromRow,
  isDuplicateResultError,
  toDailyResultInsert,
} from "./scoreboard";
import type { DuelResult } from "./scoring";

const result: DuelResult = {
  playerId: "ada",
  playedOn: "2026-11-11",
  seasonId: "alpha",
  seasonNumber: 1,
  correctCount: 2,
  questionCount: 3,
  elapsedMs: 1500,
  marks: "110",
  createdAt: "2026-11-11T15:00:00.000Z",
};

describe("scoreboard rows", () => {
  it("maps a database row and refuses a result the insert policy would reject", () => {
    expect(
      duelResultFromRow({
        player_id: "ada",
        played_on: "2026-11-11",
        season_id: "alpha",
        season_number: 1,
        correct_count: 2,
        question_count: 3,
        elapsed_ms: 1500,
        marks: "110",
        created_at: "2026-11-11T15:00:00.000Z",
      }),
    ).toEqual(result);
    expect(toDailyResultInsert(result)).toEqual({
      player_id: "ada",
      season_id: "alpha",
      season_number: 1,
      played_on: "2026-11-11",
      correct_count: 2,
      question_count: 3,
      elapsed_ms: 1500,
      marks: "110",
    });
    expect(() => toDailyResultInsert({ ...result, marks: "11" })).toThrow(/can't be shared/i);
    expect(() => toDailyResultInsert({ ...result, elapsedMs: 0 })).toThrow(/can't be shared/i);
    expect(isDuplicateResultError({ code: "23505", message: "duplicate key value" })).toBe(true);
    expect(isDuplicateResultError({ message: "permission denied" })).toBe(false);
  });

  it("keeps only valid local rows", () => {
    expect(parseDuelFile({ schemaVersion: 1, results: [result, { playerId: "nope" }] })).toEqual([result]);
    expect(parseDuelFile(null)).toEqual([]);
  });
});

const row = {
  player_id: result.playerId,
  played_on: result.playedOn,
  season_id: result.seasonId,
  season_number: result.seasonNumber,
  correct_count: result.correctCount,
  question_count: result.questionCount,
  elapsed_ms: result.elapsedMs,
  marks: result.marks,
  created_at: result.createdAt,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("shared board gateway", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads results when the board responds", async () => {
    const gateway = createScoreboardGateway({
      url: "https://example.supabase.co",
      anonKey: "public-anon-key",
      retry: false,
      fetch: async (input) => {
        const url = String(input);
        if (url.includes("/rest/v1/seasons")) return jsonResponse([{ id: "alpha" }]);
        if (url.includes("/rest/v1/daily_results")) return jsonResponse([row]);
        return jsonResponse({ message: `unexpected ${url}` }, 404);
      },
    });

    await expect(gateway.fetchResults()).resolves.toEqual([result]);
  });

  it("saves a result when the board accepts it", async () => {
    const gateway = createScoreboardGateway({
      url: "https://example.supabase.co",
      anonKey: "public-anon-key",
      retry: false,
      fetch: async (input, init) => {
        const url = String(input);
        expect(init?.method).toBe("POST");
        expect(url).toContain("/rest/v1/daily_results");
        return new Response("", { status: 201 });
      },
    });

    await expect(gateway.submit(result)).resolves.toBe("saved");
  });

  it("shows a friendly retry message when fetch rejects", async () => {
    const gateway = createScoreboardGateway({
      url: "https://example.supabase.co",
      anonKey: "public-anon-key",
      retry: false,
      fetch: async () => {
        throw new TypeError("Load failed");
      },
    });

    await expect(gateway.fetchResults()).rejects.toThrow(BOARD_UNREACHABLE);
    await expect(gateway.submit(result)).rejects.toThrow(BOARD_UNREACHABLE);
    expect(boardFailureMessage(new TypeError("Load failed"))).toBe(BOARD_UNREACHABLE);
    expect(boardFailureMessage("TypeError: Load failed")).toBe(BOARD_UNREACHABLE);
    expect(boardFailureMessage("Failed to fetch")).toBe(BOARD_UNREACHABLE);
    expect(boardFailureMessage("permission denied for table daily_results")).toBe(
      "permission denied for table daily_results",
    );
  });

  it("sends browser REST calls to the same-origin proxy", async () => {
    vi.stubGlobal("window", { location: { origin: "https://boda-silk-mu.vercel.app" } });
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      (async (input: RequestInfo | URL) => {
        calls.push(String(input));
        const url = String(input);
        if (url.includes("/seasons")) return jsonResponse([{ id: "alpha" }]);
        return jsonResponse([]);
      }) as typeof fetch,
    );

    const gateway = createScoreboardGateway({
      url: "https://pkxgryaycnwpktsafodk.supabase.co",
      anonKey: "public-anon-key",
      retry: false,
    });
    await gateway.fetchResults();

    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every((url) => url.startsWith("https://boda-silk-mu.vercel.app/api/sb/rest/v1/"))).toBe(true);
    expect(calls.some((url) => url.includes("supabase.co"))).toBe(false);
  });
});
