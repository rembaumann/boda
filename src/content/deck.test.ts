import { describe, expect, it } from "vitest";
import { appConfig } from "../config/app.config";
import rawDeck from "./decks/scouting-mexico-city.json";
import { getDeck } from "./loadDeck";
import { parseDeck, validateDeck } from "./parseDeck";

const SPAIN_MARKERS =
  /\b(vosotros|vosotras|ordenador|zumo|guay|tío|tía|coche|conducir|mola)\b|áis\b|éis\b/i;

describe("season 1 deck", () => {
  const phrases = parseDeck(rawDeck, "scouting-mexico-city");

  it("has about 60 reviewable Mexican Spanish phrases", () => {
    expect(validateDeck(phrases)).toEqual([]);
    expect(phrases).toHaveLength(60);
    expect(phrases.some((phrase) => phrase.needsNativeReview)).toBe(true);
    expect(phrases.some((phrase) => !phrase.needsNativeReview)).toBe(true);
    expect(new Set(phrases.map((phrase) => phrase.difficulty))).toEqual(new Set([1, 2, 3]));
    expect(phrases.some((phrase) => /ustedes/i.test(phrase.es))).toBe(true);
    expect(phrases.some((phrase) => /mande/i.test(phrase.es))).toBe(true);
    expect(phrases.some((phrase) => /cacahuate/i.test(phrase.es))).toBe(true);
    for (const phrase of phrases) expect(phrase.es).not.toMatch(SPAIN_MARKERS);
  });

  it("is the deck named by the season list", () => {
    for (const season of appConfig.seasons) {
      expect(getDeck(season.deckFile).length).toBeGreaterThan(0);
    }
    expect(appConfig.voice.locale).toBe("es-MX");
    expect(appConfig.session.questionsPerSet).toBe(10);
    expect(appConfig.session.seasonPointsTarget).toBe(21);
  });

  it("rejects a phrase that is missing fields", () => {
    expect(() => parseDeck([{ id: "x" }], "bad")).toThrow(/missing/i);
  });
});
