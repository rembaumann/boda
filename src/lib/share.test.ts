import { describe, expect, it } from "vitest";
import { booleansToMarks, marksToBooleans, shareMessage } from "./share";

describe("share grid", () => {
  it("builds a wordle-style grid without the phrases", () => {
    const marks = [true, true, false, true, true, false, true, true, true, false];
    expect(booleansToMarks(marks)).toBe("1101101110");
    expect(marksToBooleans("1101101110")).toEqual(marks);
    expect(marksToBooleans("10x")).toBeNull();
    expect(
      shareMessage({
        appName: "sample",
        dateLabel: "Nov 11",
        playerName: "Ada",
        marks,
      }),
    ).toBe("sample · Nov 11\nAda · 7/10\n\n🟩🟩⬛🟩🟩\n⬛🟩🟩🟩⬛");
    expect(shareMessage({ appName: "sample", dateLabel: "Nov 11", playerName: "Ada", marks })).not.toMatch(/hola|phrase/i);
  });
});
