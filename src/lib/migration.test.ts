import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appConfig } from "../config/app.config";

const migrationsDir = join(process.cwd(), "supabase", "migrations");

describe("daily duel migration", () => {
  const files = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql"));
  const sql = files.map((name) => readFileSync(join(migrationsDir, name), "utf8")).join("\n");
  const normalized = sql.toLowerCase();

  it("enables rls, lets anon read, and lets anon insert only validated results", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(normalized).toContain("alter table public.seasons enable row level security");
    expect(normalized).toContain("alter table public.seasons force row level security");
    expect(normalized).toContain("alter table public.daily_results enable row level security");
    expect(normalized).toContain("alter table public.daily_results force row level security");
    expect(normalized).toContain("grant select on table public.seasons to anon, authenticated");
    expect(normalized).toContain("grant select, insert on table public.daily_results to anon, authenticated");
    expect(normalized).toContain("for select");
    expect(normalized).toContain("for insert");
    expect(normalized).toContain("with check");
    expect(normalized).toContain("daily_results_one_play unique (player_id, played_on)");
    expect(normalized).not.toMatch(/for update/);
    expect(normalized).not.toMatch(/for delete/);
    expect(normalized).not.toMatch(/grant update/);
    expect(normalized).not.toMatch(/grant delete/);
    expect(normalized).not.toMatch(/grant all/);
    expect(normalized).toContain("revoke all on table public.daily_results from public, anon, authenticated");
  });

  it("seeds the same season ids and themes as the app config", () => {
    for (const season of appConfig.seasons) {
      expect(sql).toContain(`'${season.id}', '${season.theme}', ${season.order}`);
      if (season.deckFile) expect(sql).toContain(`'${season.deckFile}'`);
    }
    expect(appConfig.seasons.filter((season) => season.deckFile === null).length).toBeGreaterThan(0);
  });
});