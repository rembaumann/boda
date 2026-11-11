import { describe, expect, it } from "vitest";
import { pickVoice } from "./speech";

describe("pickVoice", () => {
  const voices = [
    { name: "Monica", lang: "es-ES" },
    { name: "Paulina", lang: "es-MX" },
  ];

  it("prefers the configured locale over another Spanish voice", () => {
    expect(pickVoice(voices, "es-MX", "es")?.name).toBe("Paulina");
  });

  it("falls back to any voice of the fallback language", () => {
    expect(pickVoice([{ name: "Monica", lang: "es-ES" }], "es-MX", "es")?.name).toBe("Monica");
    expect(pickVoice([{ name: "Paulina", lang: "es_MX" }], "es-MX", "es")?.name).toBe("Paulina");
  });

  it("does not treat a nearby language code as Spanish", () => {
    expect(pickVoice([{ name: "Alex", lang: "en-US" }], "es-MX", "es")).toBeNull();
    expect(
      pickVoice(
        [
          { name: "Est", lang: "est" },
          { name: "Eki", lang: "et-EE" },
        ],
        "es-MX",
        "es",
      ),
    ).toBeNull();
  });
});
