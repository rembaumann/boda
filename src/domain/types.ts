export const CATEGORIES = [
  "greetings",
  "restaurants",
  "venues",
  "getting-around",
  "polite",
] as const;

export type CategoryId = (typeof CATEGORIES)[number];

export const DIFFICULTY_LEVELS = [1, 2, 3] as const;

export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export const DRILL_TYPES = ["multipleChoice", "typeAnswer", "listen"] as const;

export type DrillType = (typeof DRILL_TYPES)[number];

export type DrillMix = Record<DrillType, number>;

export type Phrase = {
  id: string;
  es: string;
  en: string;
  pronunciation?: string;
  difficulty: Difficulty;
  category: CategoryId;
  needsNativeReview: boolean;
};

export type Choice = {
  id: string;
  text: string;
};

type QuestionBase = {
  id: string;
  phraseId: string;
  category: CategoryId;
  difficulty: Difficulty;
  spanish: string;
  english: string;
  pronunciation?: string;
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multipleChoice";
  promptLang: "es" | "en";
  choices: Choice[];
  correctChoiceId: string;
};

export type TypeAnswerQuestion = QuestionBase & {
  type: "typeAnswer";
};

export type ListenQuestion = QuestionBase & {
  type: "listen";
  choices: Choice[];
  correctChoiceId: string;
};

export type Question = MultipleChoiceQuestion | TypeAnswerQuestion | ListenQuestion;

export type AnsweredQuestion = {
  phraseId: string;
  drill: DrillType;
  difficulty: Difficulty;
  category: CategoryId;
  correct: boolean;
  spanish: string;
  english: string;
  response: string | null;
};

export type PlayerConfig = {
  id: string;
  name: string;
  note: string;
  mix: DrillMix;
};

export type SeasonConfig = {
  id: string;
  theme: string;
  /** Null until that season's phrase deck is in the repo. */
  deckFile: string | null;
  order: number;
};

/** One shared daily set. Scores are correct counts for players who have finished. */
export type DailyDuel = {
  seasonNumber: number;
  seasonId: string;
  date: string;
  phraseIds: readonly string[];
  scores: Readonly<Record<string, number>>;
};
