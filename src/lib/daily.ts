import type { DailyDuel, Difficulty, DrillMix, Phrase } from "../domain/types";
import { hashSeed, mulberry32 } from "./rng";
import { createSession, pickPhrases } from "./questions";

function duelSeed(date: string, seasonId: string, seasonNumber: number): string {
  return `${date}|${seasonId}|${seasonNumber}`;
}

export function buildDailyDuel(input: {
  deck: readonly Phrase[];
  date: string;
  seasonId: string;
  seasonNumber: number;
  count: number;
  difficultyMix: Record<Difficulty, number>;
  scores?: Readonly<Record<string, number>>;
}): DailyDuel {
  const rng = mulberry32(hashSeed(duelSeed(input.date, input.seasonId, input.seasonNumber)));
  const phrases = pickPhrases(input.deck, input.count, input.difficultyMix, rng);
  if (input.count > 0 && phrases.length < input.count) {
    throw new Error("The deck doesn't have enough phrases for this set.");
  }
  return {
    seasonNumber: input.seasonNumber,
    seasonId: input.seasonId,
    date: input.date,
    phraseIds: phrases.map((phrase) => phrase.id),
    scores: input.scores ?? {},
  };
}

/** Same phrases for every player. Drill types follow that player's mix. */
export function dailyQuestions(input: {
  deck: readonly Phrase[];
  duel: DailyDuel;
  playerId: string;
  mix: DrillMix;
  difficultyMix: Record<Difficulty, number>;
}) {
  const rng = mulberry32(
    hashSeed(`${duelSeed(input.duel.date, input.duel.seasonId, input.duel.seasonNumber)}|${input.playerId}`),
  );
  return createSession({
    deck: input.deck,
    mix: input.mix,
    count: input.duel.phraseIds.length,
    difficultyMix: input.difficultyMix,
    phraseIds: input.duel.phraseIds,
    rng,
  });
}
