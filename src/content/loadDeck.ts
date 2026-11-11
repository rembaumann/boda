import type { Phrase } from "../domain/types";
import { parseDeck, validateDeck } from "./parseDeck";

const DECK_FILE = /\/([^/]+)\.json$/;

const modules = import.meta.glob("./decks/*.json", {
  eager: true,
  import: "default",
});

export function listDeckFiles(): string[] {
  return Object.keys(modules)
    .map((path) => path.match(DECK_FILE)?.[1])
    .filter((name): name is string => Boolean(name))
    .sort();
}

export function getDeck(fileBase: string): Phrase[] {
  const entry = Object.entries(modules).find(([path]) => path.endsWith(`/${fileBase}.json`));
  if (!entry) {
    const available = listDeckFiles().join(", ") || "none";
    throw new Error(`Missing deck "${fileBase}". Available decks: ${available}.`);
  }
  const phrases = parseDeck(entry[1], fileBase);
  const errors = validateDeck(phrases);
  if (errors.length > 0) {
    throw new Error(`Deck "${fileBase}" is invalid: ${errors.join(" ")}`);
  }
  return phrases;
}
