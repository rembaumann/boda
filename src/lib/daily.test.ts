import { describe, expect, it } from "vitest";
import { appConfig } from "../config/app.config";
import { getDeck } from "../content/loadDeck";
import { DRILL_TYPES, type Difficulty } from "../domain/types";
import { allocateCounts } from "./allocate";
import { buildDailyDuel, dailyQuestions } from "./daily";
import { hashSeed } from "./rng";

const deck = getDeck("scouting-mexico-city");
const date = "2026-11-11";
const seasonId = "alpha";

function difficulties(ids: readonly string[]): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { 1: 0, 2: 0, 3: 0 };
  for (const id of ids) {
    const phrase = deck.find((item) => item.id === id);
    if (phrase) counts[phrase.difficulty] += 1;
  }
  return counts;
}

describe("daily set", () => {
  const input = {
    deck,
    date,
    seasonId,
    seasonNumber: 1,
    count: appConfig.session.questionsPerSet,
    difficultyMix: appConfig.session.difficultyMix,
  };

  it("derives the same phrase ids for a date, season, and deck", () => {
    const first = buildDailyDuel(input);
    const second = buildDailyDuel(input);
    expect(hashSeed(`${date}|${seasonId}|1`)).toBe(hashSeed(`${date}|${seasonId}|1`));
    expect(first.phraseIds).toEqual(second.phraseIds);
    expect(new Set(first.phraseIds).size).toBe(appConfig.session.questionsPerSet);
    expect(first.phraseIds.every((id) => deck.some((phrase) => phrase.id === id))).toBe(true);
    expect(difficulties(first.phraseIds)).toEqual({ 1: 4, 2: 4, 3: 2 });
  });

  it("changes the set when the date or the season instance changes", () => {
    const today = buildDailyDuel(input);
    const tomorrow = buildDailyDuel({ ...input, date: "2026-11-12" });
    const nextSeason = buildDailyDuel({ ...input, seasonNumber: 2 });
    expect(tomorrow.phraseIds).not.toEqual(today.phraseIds);
    expect(nextSeason.phraseIds).not.toEqual(today.phraseIds);
  });

  it("gives both players those phrases, with each player's drill mix", () => {
    const duel = buildDailyDuel(input);
    const [first, second] = appConfig.players;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) return;
    const firstQuestions = dailyQuestions({
      deck,
      duel,
      playerId: first.id,
      mix: first.mix,
      difficultyMix: input.difficultyMix,
    });
    const secondQuestions = dailyQuestions({
      deck,
      duel,
      playerId: second.id,
      mix: second.mix,
      difficultyMix: input.difficultyMix,
    });
    const again = dailyQuestions({
      deck,
      duel,
      playerId: first.id,
      mix: first.mix,
      difficultyMix: input.difficultyMix,
    });
    expect(firstQuestions.map((question) => question.phraseId)).toEqual(duel.phraseIds);
    expect(secondQuestions.map((question) => question.phraseId)).toEqual(duel.phraseIds);
    const count = (questions: typeof firstQuestions, type: (typeof firstQuestions)[number]["type"]) =>
      questions.filter((question) => question.type === type).length;
    expect(count(firstQuestions, "typeAnswer")).toBe(allocateCounts(first.mix, 10, DRILL_TYPES).typeAnswer);
    expect(count(secondQuestions, "multipleChoice")).toBe(
      allocateCounts(second.mix, 10, DRILL_TYPES).multipleChoice,
    );
    expect(count(firstQuestions, "typeAnswer")).toBeGreaterThan(count(secondQuestions, "typeAnswer"));
    expect(again.map((question) => question.id)).toEqual(firstQuestions.map((question) => question.id));
    expect(again.map((question) => (question.type === "typeAnswer" ? null : question.choices.map((choice) => choice.id)))).toEqual(
      firstQuestions.map((question) => (question.type === "typeAnswer" ? null : question.choices.map((choice) => choice.id))),
    );
  });
});
