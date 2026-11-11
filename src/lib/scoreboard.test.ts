import { describe, expect, it } from "vitest";
import { parseDuelFile } from "./duelStore";
import { duelResultFromRow, isDuplicateResultError, toDailyResultInsert } from "./scoreboard";
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
