import { describe, expect, it } from "vitest";
import { appConfig } from "../config/app.config";
import { getDeck } from "../content/loadDeck";
import {
  DRILL_TYPES,
  type CategoryId,
  type Difficulty,
  type DrillMix,
  type DrillType,
  type Phrase,
  type Question,
} from "../domain/types";
import { allocateCounts } from "./allocate";
import { createSession, buildQuestion } from "./questions";
import { mulberry32, sequenceRng } from "./rng";

function phrase(id: string, category: CategoryId, difficulty: Difficulty = 1): Phrase {
  return {
    id,
    es: `Frase ${id}`,
    en: `Phrase ${id}`,
    difficulty,
    category,
    needsNativeReview: false,
  };
}

function countTypes(questions: readonly Question[]): Record<DrillType, number> {
  const counts: Record<DrillType, number> = { multipleChoice: 0, typeAnswer: 0, listen: 0 };
  for (const question of questions) counts[question.type] += 1;
  return counts;
}

function countDifficulties(questions: readonly Question[]): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { 1: 0, 2: 0, 3: 0 };
  for (const question of questions) counts[question.difficulty] += 1;
  return counts;
}

describe("allocateCounts", () => {
  it("scales a handicap so typing and choice questions land on whole counts", () => {
    const experienced: DrillMix = { multipleChoice: 3, typeAnswer: 5, listen: 2 };
    const beginner: DrillMix = { multipleChoice: 6, typeAnswer: 2, listen: 2 };
    expect(allocateCounts(experienced, 10, DRILL_TYPES)).toEqual(experienced);
    expect(allocateCounts(beginner, 10, DRILL_TYPES)).toEqual(beginner);
    expect(allocateCounts(experienced, 10, DRILL_TYPES).typeAnswer).toBeGreaterThan(
      allocateCounts(beginner, 10, DRILL_TYPES).typeAnswer ?? 0,
    );
    expect(allocateCounts(beginner, 10, DRILL_TYPES).multipleChoice).toBeGreaterThan(
      allocateCounts(experienced, 10, DRILL_TYPES).multipleChoice ?? 0,
    );
  });

  it("breaks remainder ties toward the earlier drill and ignores a zero weight", () => {
    expect(allocateCounts({ multipleChoice: 1, typeAnswer: 1, listen: 1 }, 10, DRILL_TYPES)).toEqual({
      multipleChoice: 4,
      typeAnswer: 3,
      listen: 3,
    });
    expect(allocateCounts({ multipleChoice: 0, typeAnswer: 1, listen: 0 }, 10, DRILL_TYPES)).toEqual({
      multipleChoice: 0,
      typeAnswer: 10,
      listen: 0,
    });
  });
});

describe("buildQuestion", () => {
  const deck = ["a", "b", "c", "d", "e"].map((id) => phrase(id, "greetings"));

  it("can ask from Spanish or from English", () => {
    const spanish = buildQuestion("multipleChoice", deck[0]!, deck, sequenceRng([0]), 0);
    const english = buildQuestion("multipleChoice", deck[0]!, deck, sequenceRng([0.99]), 0);
    expect(spanish.type).toBe("multipleChoice");
    expect(english.type).toBe("multipleChoice");
    if (spanish.type !== "multipleChoice" || english.type !== "multipleChoice") return;
    expect(spanish.promptLang).toBe("es");
    expect(english.promptLang).toBe("en");
    expect(spanish.choices.find((choice) => choice.id === "a")?.text).toBe("Phrase a");
    expect(english.choices.find((choice) => choice.id === "a")?.text).toBe("Frase a");
  });

  it("keeps distractors in the same category when that category has enough phrases", () => {
    const mixed = [...deck, phrase("z", "restaurants")];
    const question = buildQuestion("multipleChoice", mixed[0]!, mixed, mulberry32(1), 0);
    expect(question.type).toBe("multipleChoice");
    if (question.type !== "multipleChoice") return;
    const categories = question.choices
      .filter((choice) => choice.id !== question.correctChoiceId)
      .map((choice) => mixed.find((item) => item.id === choice.id)?.category);
    expect(categories).toEqual(["greetings", "greetings", "greetings"]);
    expect(new Set(question.choices.map((choice) => choice.text)).size).toBe(4);
  });

  it("refuses a choice question without enough distinct phrases", () => {
    expect(() => buildQuestion("listen", deck[0]!, deck.slice(0, 3), mulberry32(1), 0)).toThrow(/enough/i);
  });
});

describe("createSession", () => {
  const deck = getDeck("scouting-mexico-city");

  it("builds each configured player's mix", () => {
    for (const player of appConfig.players) {
      const questions = createSession({
        deck,
        mix: player.mix,
        count: appConfig.session.questionsPerSet,
        difficultyMix: appConfig.session.difficultyMix,
        rng: mulberry32(4),
      });
      expect(questions).toHaveLength(appConfig.session.questionsPerSet);
      expect(countTypes(questions)).toEqual(
        allocateCounts(player.mix, appConfig.session.questionsPerSet, DRILL_TYPES),
      );
      expect(new Set(questions.map((question) => question.phraseId)).size).toBe(questions.length);
    }
  });

  it("gives Rem more typing questions than Shannon, and Shannon more multiple choice", () => {
    const rem = appConfig.players.find((player) => player.id === "rem");
    const shannon = appConfig.players.find((player) => player.id === "shannon");
    expect(rem).toBeDefined();
    expect(shannon).toBeDefined();
    if (!rem || !shannon) return;
    const total = appConfig.session.questionsPerSet;
    const remSet = createSession({
      deck,
      mix: rem.mix,
      count: total,
      difficultyMix: appConfig.session.difficultyMix,
      rng: mulberry32(8),
    });
    const shannonSet = createSession({
      deck,
      mix: shannon.mix,
      count: total,
      difficultyMix: appConfig.session.difficultyMix,
      rng: mulberry32(8),
    });
    expect(countTypes(remSet).typeAnswer).toBeGreaterThan(countTypes(shannonSet).typeAnswer);
    expect(countTypes(shannonSet).multipleChoice).toBeGreaterThan(countTypes(remSet).multipleChoice);
  });

  it("follows the difficulty mix and stays inside one category for choices", () => {
    const questions = createSession({
      deck,
      mix: { multipleChoice: 1, typeAnswer: 1, listen: 1 },
      count: 10,
      difficultyMix: { 1: 4, 2: 4, 3: 2 },
      rng: mulberry32(3),
    });
    expect(countDifficulties(questions)).toEqual({ 1: 4, 2: 4, 3: 2 });
    const byId = new Map(deck.map((item) => [item.id, item]));
    for (const question of questions) {
      const source = byId.get(question.phraseId);
      expect(source?.es).toBe(question.spanish);
      expect(source?.en).toBe(question.english);
      if (question.type === "typeAnswer") continue;
      expect(question.choices).toHaveLength(4);
      const correct = question.choices.find((choice) => choice.id === question.correctChoiceId);
      expect(correct?.text).toBe(question.type === "listen" || question.promptLang === "en" ? question.spanish : question.english);
      for (const choice of question.choices) {
        if (choice.id === question.correctChoiceId) continue;
        expect(byId.get(choice.id)?.category).toBe(question.category);
      }
    }
  });

  it("repeats the same set for the same seed", () => {
    const input = {
      deck,
      mix: appConfig.players[0]?.mix ?? { multipleChoice: 1, typeAnswer: 1, listen: 1 },
      count: appConfig.session.questionsPerSet,
      difficultyMix: appConfig.session.difficultyMix,
    };
    const first = createSession({ ...input, rng: mulberry32(11) });
    const second = createSession({ ...input, rng: mulberry32(11) });
    expect(first.map((question) => question.id)).toEqual(second.map((question) => question.id));
  });
});
