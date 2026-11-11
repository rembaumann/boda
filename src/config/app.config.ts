import type { Difficulty, PlayerConfig, SeasonConfig } from "../domain/types";

/**
 * Couple-specific settings live here and in `src/content`.
 * See the README section "Make it your own".
 */
export const THEME_COLORS = [
  "background",
  "surface",
  "ink",
  "muted",
  "primary",
  "onPrimary",
  "accent",
  "gold",
  "line",
  "correct",
  "correctBg",
  "incorrect",
  "incorrectBg",
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];

export type AppConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  uiLanguage: string;
  storageKey: string;
  colors: Record<ThemeColor, string>;
  voice: {
    locale: string;
    fallbackLanguage: string;
  };
  session: {
    questionsPerSet: number;
    seasonPointsTarget: number;
    goalLabel: string;
    goalNote: string;
    difficultyMix: Record<Difficulty, number>;
  };
  players: PlayerConfig[];
  seasons: SeasonConfig[];
};

export const appConfig: AppConfig = {
  name: "boda",
  shortName: "boda",
  tagline: "Mexican Spanish for the wedding.",
  description: "A pocket practice app for learning Mexican Spanish together.",
  uiLanguage: "en",
  storageKey: "boda.progress.v1",
  colors: {
    background: "#F3EEE4",
    surface: "#FFFCF8",
    ink: "#241C16",
    muted: "#655B51",
    primary: "#1E3A32",
    onPrimary: "#F6F1E7",
    accent: "#C6522A",
    gold: "#A68542",
    line: "#E4D8C6",
    correct: "#1B6B43",
    correctBg: "#E5F4EB",
    incorrect: "#9D342C",
    incorrectBg: "#FDECEA",
  },
  voice: {
    locale: "es-MX",
    fallbackLanguage: "es",
  },
  session: {
    questionsPerSet: 10,
    seasonPointsTarget: 21,
    goalLabel: "Goal",
    goalNote: "First to this many points takes the season.",
    difficultyMix: { 1: 4, 2: 4, 3: 2 },
  },
  players: [
    {
      id: "rem",
      name: "Rem",
      note: "High-school Spanish",
      mix: { multipleChoice: 3, typeAnswer: 5, listen: 2 },
    },
    {
      id: "shannon",
      name: "Shannon",
      note: "Starting from zero",
      mix: { multipleChoice: 6, typeAnswer: 2, listen: 2 },
    },
  ],
  seasons: [
    {
      id: "scouting-mexico-city",
      theme: "Scouting Trip: Mexico City",
      deckFile: "scouting-mexico-city",
      order: 1,
    },
  ],
};
