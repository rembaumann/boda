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
    expect(normalized).toContain("alter table public.players enable row level security");
    expect(normalized).toContain("alter table public.players force row level security");
    expect(normalized).toContain("alter table public.daily_results enable row level security");
    expect(normalized).toContain("alter table public.daily_results force row level security");
    expect(normalized).toContain("grant select on table public.seasons to anon, authenticated");
    expect(normalized).toContain("grant select on table public.players to anon, authenticated");
    expect(normalized).toContain("grant select, insert on table public.daily_results to anon, authenticated");
    expect(normalized).toContain("player_id text not null references public.players (id)");
    expect(normalized).toContain("constraint players_id_format check (id ~ '^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$')");
    expect(normalized).toContain("for select");
    expect(normalized).toContain("for insert");
    expect(normalized).toContain("with check");
    expect(normalized).toContain("daily_results_one_play unique (player_id, played_on)");
    expect(normalized).not.toMatch(/for update/);
    expect(normalized).not.toMatch(/for delete/);
    expect(normalized).not.toMatch(/grant update/);
    expect(normalized).not.toMatch(/grant delete/);
    expect(normalized).not.toMatch(/grant all/);
    expect(normalized).not.toMatch(/grant insert on table public\.players/);
    expect(normalized).not.toMatch(/grant select, insert on table public\.players/);
    expect(normalized).toContain("revoke all on table public.players from public, anon, authenticated");
    expect(normalized).toContain("revoke all on table public.daily_results from public, anon, authenticated");
  });

  it("seeds the same player ids and names as the app config", () => {
    const match = sql.match(
      /insert into public\.players \(id, display_name\) values\s*((?:\s*\('[^']*', '[^']*'\),?)+)\s*;/,
    );
    expect(match, "players seed").not.toBeNull();
    const rows = [...(match?.[1] ?? "").matchAll(/\('([^']*)', '([^']*)'\)/g)].map((hit) => [hit[1], hit[2]]);
    expect(rows).toEqual(appConfig.players.map((player) => [player.id, player.name]));
  });

  it("seeds the same season ids and themes as the app config", () => {
    for (const season of appConfig.seasons) {
      expect(sql).toContain(`'${season.id}', '${season.theme}', ${season.order}`);
      if (season.deckFile) expect(sql).toContain(`'${season.deckFile}'`);
    }
    expect(appConfig.seasons.filter((season) => season.deckFile === null).length).toBeGreaterThan(0);
  });
});