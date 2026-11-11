import { describe, expect, it } from "vitest";
import type { AnsweredQuestion } from "../domain/types";
import { applySession, createSessionRecord, emptyProgress, type StoredProgress } from "./progress";

function answered(id: string, correct: boolean): AnsweredQuestion {
  return {
    phraseId: id,
    drill: "typeAnswer",
    difficulty: 1,
    category: "greetings",
    correct,
    spanish: "Hola",
    english: "Hi",
    response: correct ? "Hola" : "adios",
  };
}

describe("applySession", () => {
  it("records results without touching streak or an existing review schedule", () => {
    const now = "2026-05-01T12:00:00.000Z";
    const first = createSessionRecord({
      id: "s1",
      seasonId: "season",
      completedAt: now,
      questions: [answered("a", true)],
    });
    const seeded = applySession(emptyProgress(), first, "rem", now);
    const stat = seeded.players.rem?.phraseStats.a;
    expect(stat?.ease).toBe(2.5);
    expect(stat?.seen).toBe(1);

    const tweaked: StoredProgress = {
      ...seeded,
      players: {
        ...seeded.players,
        rem: {
          ...seeded.players.rem!,
          phraseStats: {
            ...seeded.players.rem!.phraseStats,
            a: {
              ...stat!,
              ease: 2.8,
              intervalDays: 4,
              nextDueOn: "2026-12-01",
            },
          },
        },
      },
    };
    const later = "2026-05-02T12:00:00.000Z";
    const second = createSessionRecord({
      id: "s2",
      seasonId: "season",
      completedAt: later,
      questions: [answered("a", false), answered("b", true)],
    });
    const updated = applySession(tweaked, second, "rem", later);
    const again = updated.players.rem?.phraseStats.a;
    expect(again).toMatchObject({
      seen: 2,
      correct: 1,
      incorrect: 1,
      lastResult: "incorrect",
      ease: 2.8,
      intervalDays: 4,
      nextDueOn: "2026-12-01",
    });
    expect(updated.players.rem?.phraseStats.b?.ease).toBe(2.5);
    expect(updated.players.rem?.streak).toEqual({ current: 0, longest: 0, lastPlayedOn: null });
    expect(tweaked.players.rem?.phraseStats.a?.seen).toBe(1);
  });

  it("keeps the newest 20 sessions", () => {
    let progress = emptyProgress();
    for (let index = 0; index < 21; index += 1) {
      const session = createSessionRecord({
        id: `s${index}`,
        seasonId: "season",
        completedAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        questions: [answered("a", true)],
      });
      progress = applySession(progress, session, "rem", session.completedAt);
    }
    const sessions = progress.players.rem?.sessions ?? [];
    expect(sessions).toHaveLength(20);
    expect(sessions[0]?.id).toBe("s20");
    expect(sessions.some((session) => session.id === "s0")).toBe(false);
  });
});
