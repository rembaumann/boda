import { describe, expect, it } from "vitest";
import { appConfig } from "../config/app.config";
import type { SeasonConfig } from "../domain/types";
import { presentBoard, scoreSeasons, type DuelResult } from "./scoring";

const themes: SeasonConfig[] = [
  { id: "alpha", theme: "Alpha", deckFile: "alpha", order: 1 },
  { id: "beta", theme: "Beta", deckFile: null, order: 2 },
  { id: "gamma", theme: "Gamma", deckFile: null, order: 3 },
  { id: "delta", theme: "Delta", deckFile: null, order: 4 },
];

const players = [
  { id: "ada", name: "Ada" },
  { id: "grace", name: "Grace" },
];

function result(
  playerId: string,
  playedOn: string,
  correctCount: number,
  elapsedMs: number,
  extras: Partial<DuelResult> = {},
): DuelResult {
  const questionCount = extras.questionCount ?? 10;
  const marks = `${"1".repeat(correctCount)}${"0".repeat(Math.max(0, questionCount - correctCount))}`;
  return {
    playerId,
    playedOn,
    seasonId: "alpha",
    seasonNumber: 1,
    correctCount,
    questionCount,
    elapsedMs,
    marks,
    createdAt: `${playedOn}T12:00:00.000Z`,
    ...extras,
  };
}

function board(results: DuelResult[], today: string, target = 2, youId = "ada") {
  return presentBoard({ results, players, themes, target, today, youId });
}

describe("daily winner", () => {
  const date = "2026-11-11";

  it("gives the point to the more accurate player, even when they are slower", () => {
    const view = board(
      [result("ada", date, 9, 9_000), result("grace", date, 10, 12_000)],
      date,
    );
    expect(view.todayLabel).toBe("Grace takes the point.");
    expect(view.standings.map((row) => row.points)).toEqual([0, 1]);
  });

  it("uses time as the tiebreak when accuracy matches", () => {
    const view = board(
      [result("ada", date, 8, 4_000), result("grace", date, 8, 4_001)],
      date,
    );
    expect(view.todayLabel).toBe("You take the point.");
    expect(view.standings.map((row) => row.points)).toEqual([1, 0]);
  });

  it("compares accuracy as a ratio when the sets differ in length", () => {
    const view = board(
      [
        result("ada", date, 1, 2_000, { questionCount: 1 }),
        result("grace", date, 9, 1_000),
      ],
      date,
    );
    expect(view.standings.map((row) => row.points)).toEqual([1, 0]);
  });

  it("awards no point when accuracy and time both match", () => {
    const view = board(
      [result("ada", date, 8, 4_000), result("grace", date, 8, 4_000)],
      date,
    );
    expect(view.todayLabel).toBe("Tie. Nobody gets the point.");
    expect(view.standings.map((row) => row.points)).toEqual([0, 0]);
  });

  it("waits until every configured player has a result", () => {
    const view = board([result("ada", date, 10, 1_000)], date);
    expect(view.todayLabel).toBe("Waiting on Grace.");
    expect(view.youPlayed).toBe(true);
    expect(view.standings.map((row) => row.points)).toEqual([0, 0]);
    const other = board([result("ada", date, 10, 1_000)], date, 2, "grace");
    expect(other.todayLabel).toBe("Ada finished. Your turn.");
    expect(other.youPlayed).toBe(false);
  });

  it("ignores a player who is not in the config and a result that fails validation", () => {
    const view = board(
      [
        result("ada", date, 10, 1_000),
        result("mallory", date, 10, 1),
        result("grace", date, 1, 0),
      ],
      date,
    );
    expect(view.todayLabel).toBe("Waiting on Grace.");
    expect(view.standings.map((row) => row.points)).toEqual([0, 0]);
  });

  it("keeps the earliest result when the same player has two rows for one day", () => {
    const view = board(
      [
        result("ada", date, 1, 5_000, { createdAt: "2026-11-11T12:00:00.000Z" }),
        result("ada", date, 10, 1_000, { createdAt: "2026-11-11T18:00:00.000Z" }),
        result("grace", date, 5, 4_000),
      ],
      date,
    );
    expect(view.standings.map((row) => row.points)).toEqual([0, 1]);
  });
});

describe("seasons and trophies", () => {
  it("ends the season at the target and starts the next theme at zero", () => {
    const results = [
      result("ada", "2026-11-01", 9, 1_000),
      result("grace", "2026-11-01", 8, 1_000),
      result("ada", "2026-11-02", 7, 1_000),
      result("grace", "2026-11-02", 8, 1_000),
      result("ada", "2026-11-03", 10, 1_000),
      result("grace", "2026-11-03", 9, 1_000),
      result("ada", "2026-11-04", 6, 1_000),
      result("grace", "2026-11-04", 9, 1_000),
    ];
    const closed = board(results.slice(0, 6), "2026-11-03");
    expect(closed.seasonNumber).toBe(2);
    expect(closed.theme).toBe("Beta");
    expect(closed.deckFile).toBeNull();
    expect(closed.standings).toEqual([
      { id: "ada", name: "Ada", points: 0, trophies: 1 },
      { id: "grace", name: "Grace", points: 0, trophies: 0 },
    ]);
    expect(closed.todayLabel).toBe("You take the point. The next season has started.");

    const next = board(results, "2026-11-04");
    expect(next.theme).toBe("Beta");
    expect(next.standings.map((row) => [row.points, row.trophies])).toEqual([
      [0, 1],
      [1, 0],
    ]);
    expect(next.todayLabel).toBe("Grace takes the point.");
  });

  it("does not end a season on a tied day", () => {
    const view = board(
      [
        result("ada", "2026-11-01", 9, 1_000),
        result("grace", "2026-11-01", 8, 1_000),
        result("ada", "2026-11-02", 8, 2_000),
        result("grace", "2026-11-02", 8, 2_000),
      ],
      "2026-11-02",
    );
    expect(view.seasonNumber).toBe(1);
    expect(view.theme).toBe("Alpha");
    expect(view.standings.map((row) => row.points)).toEqual([1, 0]);
    expect(view.todayLabel).toBe("Tie. Nobody gets the point.");
  });

  it("wraps to the first theme after every themed season has a winner", () => {
    const results: DuelResult[] = [];
    for (let day = 1; day <= 4; day += 1) {
      const date = `2026-12-${String(day).padStart(2, "0")}`;
      results.push(result("ada", date, 10, 1_000), result("grace", date, 0, 2_000));
    }
    const view = board(results, "2026-12-05", 1);
    expect(view.seasonNumber).toBe(5);
    expect(view.seasonId).toBe("alpha");
    expect(view.theme).toBe("Alpha");
    expect(view.standings.map((row) => row.trophies)).toEqual([4, 0]);
    expect(view.standings.map((row) => row.points)).toEqual([0, 0]);
  });

  it("races to the configured target and shows the same board from the same rows", () => {
    const target = appConfig.session.seasonPointsTarget;
    const results: DuelResult[] = [];
    for (let day = 0; day < target; day += 1) {
      const date = `2026-01-${String(day + 1).padStart(2, "0")}`;
      results.push(result("ada", date, 10, 1_000), result("grace", date, 9, 1_000));
    }
    const first = presentBoard({ results, players, themes, target, today: "2026-02-01", youId: "ada" });
    const second = presentBoard({ results, players, themes, target, today: "2026-02-01", youId: "grace" });
    expect(first.seasonNumber).toBe(2);
    expect(first.standings.map((row) => row.trophies)).toEqual([1, 0]);
    expect(first.standings.map((row) => row.points)).toEqual(second.standings.map((row) => row.points));
    expect(first.theme).toBe(second.theme);
    expect(scoreSeasons({ results, playerIds: ["ada", "grace"], themes, target }).completed).toHaveLength(1);
  });

  it("rejects a target below 1", () => {
    expect(() =>
      scoreSeasons({ results: [], playerIds: ["ada"], themes, target: 0 }),
    ).toThrow(/positive/i);
  });
});
