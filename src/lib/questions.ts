import { allocateCounts } from "./allocate";
import { type Rng, unitInterval } from "./rng";
import {
  DIFFICULTY_LEVELS,
  DRILL_TYPES,
  type Choice,
  type Difficulty,
  type DrillMix,
  type DrillType,
  type ListenQuestion,
  type MultipleChoiceQuestion,
  type Phrase,
  type Question,
  type TypeAnswerQuestion,
} from "../domain/types";

export type CreateSessionInput = {
  deck: readonly Phrase[];
  mix: DrillMix;
  count: number;
  difficultyMix: Record<Difficulty, number>;
  /** When set, the set uses these phrases in this order instead of drawing new ones. */
  phraseIds?: readonly string[];
  rng?: Rng;
};

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(unitInterval(rng) * (index + 1));
    const current = copy[index];
    const swap = copy[swapIndex];
    if (current === undefined || swap === undefined) continue;
    copy[index] = swap;
    copy[swapIndex] = current;
  }
  return copy;
}

function baseQuestion(phrase: Phrase, type: DrillType, index: number) {
  return {
    id: `${phrase.id}-${type}-${index}`,
    phraseId: phrase.id,
    category: phrase.category,
    difficulty: phrase.difficulty,
    spanish: phrase.es,
    english: phrase.en,
    ...(phrase.pronunciation ? { pronunciation: phrase.pronunciation } : {}),
  };
}

function pickDistractors(
  phrase: Phrase,
  deck: readonly Phrase[],
  rng: Rng,
  textOf: (item: Phrase) => string,
  count: number,
): Phrase[] {
  const sameCategory = shuffle(
    deck.filter(
      (item) =>
        item.id !== phrase.id && item.category === phrase.category && textOf(item) !== textOf(phrase),
    ),
    rng,
  );
  const otherCategories = shuffle(
    deck.filter(
      (item) =>
        item.id !== phrase.id && item.category !== phrase.category && textOf(item) !== textOf(phrase),
    ),
    rng,
  );
  const picked: Phrase[] = [];
  const seenText = new Set<string>([textOf(phrase)]);
  const seenIds = new Set<string>([phrase.id]);

  for (const item of [...sameCategory, ...otherCategories]) {
    if (seenIds.has(item.id)) continue;
    const text = textOf(item);
    if (seenText.has(text)) continue;
    seenText.add(text);
    seenIds.add(item.id);
    picked.push(item);
    if (picked.length === count) break;
  }

  if (picked.length < count) {
    throw new Error(`Not enough distinct choices for "${phrase.id}". Add more phrases.`);
  }
  return picked;
}

function toChoices(phrase: Phrase, distractors: readonly Phrase[], textOf: (item: Phrase) => string, rng: Rng): Choice[] {
  return shuffle(
    [
      { id: phrase.id, text: textOf(phrase) },
      ...distractors.map((item) => ({ id: item.id, text: textOf(item) })),
    ],
    rng,
  );
}

export function buildQuestion(
  type: DrillType,
  phrase: Phrase,
  deck: readonly Phrase[],
  rng: Rng,
  index: number,
): Question {
  const shared = baseQuestion(phrase, type, index);
  if (type === "typeAnswer") {
    const question: TypeAnswerQuestion = { ...shared, type };
    return question;
  }

  if (type === "listen") {
    const distractors = pickDistractors(phrase, deck, rng, (item) => item.es, 3);
    const question: ListenQuestion = {
      ...shared,
      type,
      choices: toChoices(phrase, distractors, (item) => item.es, rng),
      correctChoiceId: phrase.id,
    };
    return question;
  }

  const promptLang = unitInterval(rng) < 0.5 ? "es" : "en";
  const textOf = promptLang === "es" ? (item: Phrase) => item.en : (item: Phrase) => item.es;
  const distractors = pickDistractors(phrase, deck, rng, textOf, 3);
  const question: MultipleChoiceQuestion = {
    ...shared,
    type: "multipleChoice",
    promptLang,
    choices: toChoices(phrase, distractors, textOf, rng),
    correctChoiceId: phrase.id,
  };
  return question;
}

export function pickPhrases(
  deck: readonly Phrase[],
  count: number,
  difficultyMix: Record<Difficulty, number>,
  rng: Rng,
): Phrase[] {
  const targets = allocateCounts(difficultyMix, count, DIFFICULTY_LEVELS);
  const used = new Set<string>();
  const picked: Phrase[] = [];

  for (const level of DIFFICULTY_LEVELS) {
    const pool = shuffle(
      deck.filter((phrase) => phrase.difficulty === level && !used.has(phrase.id)),
      rng,
    );
    const target = targets[level] ?? 0;
    let taken = 0;
    for (const phrase of pool) {
      if (taken >= target) break;
      picked.push(phrase);
      used.add(phrase.id);
      taken += 1;
    }
  }

  if (picked.length < count) {
    for (const phrase of shuffle(
      deck.filter((phrase) => !used.has(phrase.id)),
      rng,
    )) {
      if (picked.length >= count) break;
      picked.push(phrase);
      used.add(phrase.id);
    }
  }

  if (picked.length < count && deck.length > 0) {
    const extras = shuffle([...deck], rng);
    let cursor = 0;
    while (picked.length < count) {
      const phrase = extras[cursor % extras.length];
      if (!phrase) break;
      picked.push(phrase);
      cursor += 1;
      if (cursor > deck.length * count) break;
    }
  }

  return shuffle(picked, rng).slice(0, count);
}

function phrasesById(deck: readonly Phrase[], ids: readonly string[], count: number): Phrase[] {
  if (ids.length !== count) {
    throw new Error("The daily set size doesn't match the question count.");
  }
  const byId = new Map(deck.map((phrase) => [phrase.id, phrase]));
  const seen = new Set<string>();
  return ids.map((id) => {
    if (seen.has(id)) throw new Error(`Duplicate phrase "${id}" in the daily set.`);
    seen.add(id);
    const phrase = byId.get(id);
    if (!phrase) throw new Error(`Missing phrase "${id}" in the deck.`);
    return phrase;
  });
}

export function createSession(input: CreateSessionInput): Question[] {
  if (!Number.isInteger(input.count) || input.count < 0) {
    throw new Error("Question count must be a non-negative integer.");
  }
  const rng = input.rng ?? Math.random;
  const phrases = input.phraseIds
    ? phrasesById(input.deck, input.phraseIds, input.count)
    : pickPhrases(input.deck, input.count, input.difficultyMix, rng);
  if (input.count > 0 && phrases.length < input.count) {
    throw new Error("The deck doesn't have enough phrases for this set.");
  }

  const typeCounts = allocateCounts(input.mix, phrases.length, DRILL_TYPES);
  const needsChoices = (typeCounts.multipleChoice ?? 0) + (typeCounts.listen ?? 0) > 0;
  if (needsChoices && input.deck.length < 4) {
    throw new Error("Multiple choice and listening need at least 4 phrases in the deck.");
  }

  const types: DrillType[] = [];
  for (const type of DRILL_TYPES) {
    const amount = typeCounts[type] ?? 0;
    for (let index = 0; index < amount; index += 1) types.push(type);
  }

  return shuffle(types, rng).map((type, index) => {
    const phrase = phrases[index];
    if (!phrase) throw new Error("Ran out of phrases while building the set.");
    return buildQuestion(type, phrase, input.deck, rng, index);
  });
}
