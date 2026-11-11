import { CATEGORIES, type CategoryId, type Phrase } from "../domain/types";

const CATEGORY_SET = new Set<string>(CATEGORIES);

function isPhrase(value: unknown): value is Phrase {
  if (!value || typeof value !== "object") return false;
  const phrase = value as Record<string, unknown>;
  const pronunciationOk = phrase.pronunciation === undefined || typeof phrase.pronunciation === "string";
  return (
    typeof phrase.id === "string" &&
    phrase.id.trim().length > 0 &&
    typeof phrase.es === "string" &&
    phrase.es.trim().length > 0 &&
    typeof phrase.en === "string" &&
    phrase.en.trim().length > 0 &&
    pronunciationOk &&
    (phrase.difficulty === 1 || phrase.difficulty === 2 || phrase.difficulty === 3) &&
    typeof phrase.category === "string" &&
    CATEGORY_SET.has(phrase.category) &&
    typeof phrase.needsNativeReview === "boolean"
  );
}

export function parseDeck(value: unknown, fileBase: string): Phrase[] {
  if (!Array.isArray(value)) {
    throw new Error(`Deck ${fileBase} must be a JSON array.`);
  }
  return value.map((item, index) => {
    if (!isPhrase(item)) {
      throw new Error(`Deck ${fileBase} phrase ${index + 1} is missing required fields.`);
    }
    const phrase: Phrase = {
      id: item.id,
      es: item.es,
      en: item.en,
      difficulty: item.difficulty,
      category: item.category as CategoryId,
      needsNativeReview: item.needsNativeReview,
      ...(item.pronunciation ? { pronunciation: item.pronunciation } : {}),
    };
    return phrase;
  });
}

export function validateDeck(phrases: readonly Phrase[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const spanish = new Set<string>();
  const english = new Set<string>();

  for (const phrase of phrases) {
    if (ids.has(phrase.id)) errors.push(`Duplicate id ${phrase.id}`);
    ids.add(phrase.id);
    if (spanish.has(phrase.es)) errors.push(`Duplicate Spanish: ${phrase.es}`);
    spanish.add(phrase.es);
    if (english.has(phrase.en)) errors.push(`Duplicate English: ${phrase.en}`);
    english.add(phrase.en);
  }
  return errors;
}
