import { describe, expect, it } from "vitest";
import { calendarDate, formatDuelDate, formatElapsed } from "./calendar";

describe("shared calendar", () => {
  it("uses the configured time zone for the duel date", () => {
    expect(calendarDate(new Date("2026-11-11T03:30:00Z"), "America/New_York")).toBe("2026-11-10");
    expect(calendarDate(new Date("2026-11-11T15:00:00Z"), "America/New_York")).toBe("2026-11-11");
    expect(formatDuelDate("2026-11-11", "en")).toBe("Nov 11");
    expect(formatElapsed(65_000)).toBe("1:05");
    expect(formatElapsed(3_600_000)).toBe("60:00");
  });

  it("rejects an unknown time zone", () => {
    expect(() => calendarDate(new Date("2026-11-11T15:00:00Z"), "Not/AZone")).toThrow(/time zone/i);
  });
});
