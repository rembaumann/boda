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

/**
 * Where in-app feedback is filed. The API key stays on the server.
 * An empty projectName files the issue with no project.
 * bugPriority 2 is High. Feature requests omit priority.
 */
export type FeedbackConfig = {
  teamKey: string;
  projectName: string;
  labels: {
    source: string;
    bug: string;
    feature: string;
  };
  states: {
    bug: string;
    feature: string;
    fallback: string;
  };
  bugPriority: number;
};

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
  /** Both phones use this calendar, so the daily set rolls over at the same local midnight. */
  calendar: {
    timeZone: string;
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
  feedback: FeedbackConfig;
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
  calendar: {
    timeZone: "America/New_York",
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
      theme: "Scouting Trip",
      deckFile: "scouting-mexico-city",
      order: 1,
    },
    {
      id: "vendors-planner",
      theme: "Vendors & Planner",
      deckFile: null,
      order: 2,
    },
    {
      id: "family-guests",
      theme: "Family & Guests",
      deckFile: null,
      order: 3,
    },
    {
      id: "toast-vows",
      theme: "Toast & Vows",
      deckFile: null,
      order: 4,
    },
  ],
  feedback: {
    teamKey: "REM",
    projectName: "Boda v1",
    labels: {
      source: "from-app",
      bug: "Bug",
      feature: "Feature",
    },
    states: {
      bug: "Triage",
      feature: "Backlog",
      fallback: "Backlog",
    },
    bugPriority: 2,
  },
};
