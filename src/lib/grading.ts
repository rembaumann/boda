// Acute, grave, and diaeresis. The tilde in ñ stays, because ñ is its own letter.
const FORGIVEN_MARKS = /[\u0300\u0301\u0308]/g;
const NOT_WORD = /[^\p{L}\p{N}\s]/gu;
const EXTRA_SPACE = /\s+/g;

export type GradeResult = {
  correct: boolean;
  expected: string;
};

export type AnswerLead = "correct" | "close" | "incorrect";

export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(FORGIVEN_MARKS, "")
    .normalize("NFC")
    .replace(NOT_WORD, " ")
    .replace(EXTRA_SPACE, " ")
    .trim();
}

export function gradeTypedAnswer(input: string, expected: string): GradeResult {
  const normalExpected = normalizeAnswer(expected);
  return {
    correct: normalExpected.length > 0 && normalizeAnswer(input) === normalExpected,
    expected,
  };
}

export function typeAnswerLead(input: string, expected: string, correct: boolean): AnswerLead {
  if (!correct) return "incorrect";
  if (input.trim() === expected.trim()) return "correct";
  return "close";
}
