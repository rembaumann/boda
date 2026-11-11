const CORRECT = "🟩";
const MISS = "⬛";

export function marksToBooleans(marks: string): boolean[] | null {
  if (!/^[01]+$/.test(marks)) return null;
  return [...marks].map((mark) => mark === "1");
}

export function booleansToMarks(marks: readonly boolean[]): string {
  return marks.map((mark) => (mark ? "1" : "0")).join("");
}

export function shareMessage(input: {
  appName: string;
  dateLabel: string;
  playerName: string;
  marks: readonly boolean[];
  columns?: number;
}): string {
  const columns = input.columns ?? 5;
  const rows: string[] = [];
  for (let index = 0; index < input.marks.length; index += columns) {
    rows.push(
      input.marks
        .slice(index, index + columns)
        .map((correct) => (correct ? CORRECT : MISS))
        .join(""),
    );
  }
  const correct = input.marks.filter(Boolean).length;
  const grid = rows.join("\n");
  return `${input.appName} · ${input.dateLabel}\n${input.playerName} · ${correct}/${input.marks.length}\n\n${grid}`;
}
