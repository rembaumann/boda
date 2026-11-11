import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appConfig, THEME_COLORS } from "./app.config";

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function isScanned(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  if (!normalized.includes("/src/")) return false;
  if (normalized.includes("/src/config/")) return false;
  if (normalized.includes("/src/content/")) return false;
  if (normalized.endsWith(".test.ts")) return false;
  return normalized.endsWith(".ts") || normalized.endsWith(".tsx") || normalized.endsWith(".css");
}

function mentions(source: string, term: string): boolean {
  if (term.length <= 3) return new RegExp(`\\b${term}\\b`, "i").test(source);
  return source.includes(term);
}

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

describe("forkable copy", () => {
  it("keeps couple-specific strings in config and content, not in the interface", () => {
    const terms = [
      ...appConfig.players.flatMap((player) => [player.name, player.note, player.id]),
      ...appConfig.seasons.flatMap((season) => [season.theme, season.id, season.deckFile]),
      appConfig.voice.locale,
      appConfig.tagline,
      appConfig.description,
      appConfig.storageKey,
      appConfig.session.goalNote,
      appConfig.name,
      String(appConfig.session.seasonPointsTarget),
    ];
    const files = walk(join(process.cwd(), "src")).filter(isScanned);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const term of terms) {
        expect(mentions(source, term), `${file} contains ${term}`).toBe(false);
      }
    }
  });

  it("paints the interface from the theme tokens", () => {
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    for (const color of THEME_COLORS) {
      expect(css).toContain(`var(--${kebab(color)})`);
    }
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
