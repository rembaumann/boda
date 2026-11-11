import { describe, expect, it } from "vitest";
import { gradeTypedAnswer, normalizeAnswer, typeAnswerLead } from "./grading";

describe("gradeTypedAnswer", () => {
  it("forgives accents, case, spacing, and punctuation, and keeps the exact form", () => {
    const graded = gradeTypedAnswer("como esta usted", "¿Cómo está usted?");
    expect(graded).toEqual({ correct: true, expected: "¿Cómo está usted?" });
    expect(typeAnswerLead("como esta usted", "¿Cómo está usted?", graded.correct)).toBe("close");
    expect(typeAnswerLead("¿Cómo está usted?", "¿Cómo está usted?", true)).toBe("correct");
  });

  it("treats inverted marks and repeated spaces as the same phrase", () => {
    expect(gradeTypedAnswer("que padre", "¡Qué padre!").correct).toBe(true);
    expect(gradeTypedAnswer("  Hola,   mucho   gusto! ", "Hola, mucho gusto.").correct).toBe(true);
    expect(normalizeAnswer("¿Me trae la cuenta, por favor?")).toBe("me trae la cuenta por favor");
  });

  it("keeps ñ as a letter and still forgives the diaeresis", () => {
    expect(gradeTypedAnswer("nino", "niño").correct).toBe(false);
    expect(gradeTypedAnswer("senor", "señor").correct).toBe(false);
    expect(gradeTypedAnswer("NIÑO", "niño").correct).toBe(true);
    expect(gradeTypedAnswer("Señor", "señor").correct).toBe(true);
    expect(gradeTypedAnswer("pinguino", "pingüino").correct).toBe(true);
  });

  it("rejects a different phrase, an empty answer, and digits standing in for words", () => {
    expect(gradeTypedAnswer("hola amigo", "Hola").correct).toBe(false);
    expect(gradeTypedAnswer("", "Hola").correct).toBe(false);
    expect(gradeTypedAnswer("120", "ciento veinte").correct).toBe(false);
    expect(typeAnswerLead("hola amigo", "Hola", false)).toBe("incorrect");
  });
});
