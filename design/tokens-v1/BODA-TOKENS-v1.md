# Boda design tokens v1

**For:** Boda PM, to file as a Linear ticket in *Boda v1*. Nothing in this file has been posted to GitHub or Linear.
**Built from:** the v0.2 system Rem last saw (venue-grounded, anti-slop): `config/boda.theme.json`, `tokens.json`, `tokens.css`, `build-tokens.mjs` in the Boda design workspace.
**Intent:** warm, celebratory, no kitsch. The warmth comes from candle-glow gold, bougainvillea, brick and Shannon's ochre set on cool plaster and black steel, the way the flowers sit against stone and iron at Casa de la Bola and CASO. It doesn't come from a cream background. No sombreros, piñatas, clip-art papel picado, or emoji trophies.

---

## 1. How the system is organised

- **One base system.** Neutrals, ink (primary), brand, celebrate, correct/wrong, players, type, space, sizes, radius, motion and safe areas are shared by every season.
- **Four season variants.** Each overrides **only** the four season colour tokens (`season`, `on-season`, `season-text`, `season-soft`), in light and dark. Nothing else changes per season, so a new season can't break layout or contrast elsewhere.
- **Theme swap is ONE value.** `activeSeason` in `config/boda.theme.json` is the `:root` default. At runtime the app sets `<html data-season="…">` to the same id (later from the Supabase `seasons` row). Dark mode follows iOS, with an optional `data-theme="light|dark"` override.
- **Couple-specific values live in config.** That covers player names, initials, colours, shapes and patterns, the season names in English and Spanish, and their accents. Forkers edit one JSON file and run one command. The build fails if their colours break AA.
- **Build:** `node build-tokens.mjs [--config config/boda.theme.json] [--out src/styles]` (Node ≥ 18, zero dependencies) writes `tokens.json` (W3C DTCG, the format Style Dictionary v4 reads natively), `tokens.css`, `tailwind.theme.css`, `contrast-report.md` and `contrast.json`. Optional: `npx style-dictionary@4 build` with the config in §8 also compiles `tokens.json` (verified).

## 2. Major token choices (one line each)

| Token | Value (light / dark) | Why |
|---|---|---|
| `color.bg` | `#E9E9E4` / `#121411` | Cool lime plaster sampled from the steel-corridor photo at Casa de la Bola. Deliberately not the cream "AI default"; dark is steel-night, not grey. |
| `color.surface`, `surface-sunken` | `#F4F4F0`, `#DADAD3` / `#1B1E1A`, `#242823` | Plaster for the solid nav and sheets; cantera paving for empty window panes. No cards. |
| `color.text`, `text-muted` | `#1A1C19`, `#55564E` / `#EEEBE3`, `#ABA79A` | Iron-black with a green cast and mortar grey. Both pass AA on every ground. |
| `color.ink` → `primary` | `#1F2420` on `#F4F4F0` / `#EEEBE3` on `#121411` | Hierro forjado: the black steel frames both venues share. The one primary action, square, in the thumb zone. |
| `color.brand` | `#B4235A` (text `#A21E50`) / `#F28AB0` | Bugambilia from CASO's walls. Wordmark and rare brand moments only. |
| `color.celebrate` | `#F2A20C` (text `#7C4D00`) / `#F5B63A` | Candle-glow / cempasúchil gold. It means a win and nothing else. This is where the "celebratory" lives. |
| `color.correct` / `wrong` | `#13735E` / `#B3261E` (dark text `#6FD3B5` / `#FF9B91`) | Jade pushed toward blue so it separates from red for deuteranopes. Always paired with ✓ / ✕ icons. |
| `color.player-a` (Rem) | `#1D4FA3` / `#8DB1F7`, shape **circle**, pattern solid | Talavera cobalt (Bola's tiled stairs). |
| `color.player-b` (Shannon) | `#A36909` (text `#835300`) / `#D08812`, shape **diamond**, pattern hatch | Ocre: CASO's mustard velvet in shade. Stays ≥ 22 ΔE from Rem's cobalt in every colour-vision simulation and ≥ 12 from candlelight gold; shape and hatch mean colour is never the only cue. |
| `season.*` | see §3 | One painted wall per season, each a material you can touch at one of the two venues. An accent, never the button. |
| `font.family.sans` | **Archivo** (Google Fonts, OFL, variable `wdth` 62–125) | A grotesque from a Latin American foundry. Condensed for the 128px score and the season name, normal width for reading; tabular figures; full Spanish set. Replaces Inter and the PR's Outfit. |
| `font.family.serif` | **Alegreya** (Google Fonts, OFL) | Huerta Tipográfica, built for Spanish text. Exactly **one** invitation line per screen (the duel title), never italic. Replaces Fraunces. |
| `font.style.*` | caption 12 · body-sm 14 · body 16 · body-lg 18 · label 15 · title 20 · headline 24 · invitation 31 (serif) · season 32 @75% · score 128 @62% | Big size jumps (score is 8× body) give the screen one memorable element instead of uniform mid-size text. |
| `space.*` | 4pt scale, 0–80px, including `11`=44, `13`=52, `14`=56 | The three tap sizes are space steps, so tap targets can't drift off-grid. |
| `size.tap-min` / `nav` / `control` | `{space.11}` 44px / `{space.13}` 52px / `{space.14}` 56px | HIG / WCAG 2.5.5 minimum, tab height, primary button height. The build fails if any is under 44. |
| `radius.none` / `sm` / `md` | 0 / 2 / 4px | Steel frames, panes, the season wall and the CTA are square. 2px for inputs, 4px for sheets. **No pill radius exists.** |
| `shadow.overlay` | one tight long shadow | The only shadow, for sheets over content. Everything else is grouped by type and iron frames, not floating cards. |
| `motion.duration` / `easing` | 80 / 150 / 240 / 400 / 900ms; standard, decelerate, accelerate, spring | Motion answers a tap or a state change (tile flip, score change), plus one 900ms win moment. No fade-up-on-every-section. |
| `motion.reduced-duration` | 1ms | Under `prefers-reduced-motion`, every duration collapses to 1ms and `spring` becomes linear. State still changes; nothing travels. |
| `safe-area.*` | `env(safe-area-inset-*, 0px)` | Notch and home indicator in standalone PWA mode (needs `viewport-fit=cover`, which the PR already sets). |

## 3. Seasons (keys match the English names; Spanish labels in config)

| key (`data-season`) | English | Spanish (config `nameEs`) | Accent | Light | Dark |
|---|---|---|---|---|---|
| `scouting-mexico-city` | Scouting Trip CDMX | Viaje de exploración CDMX | Helecho (fern, Bola's garden) | `#3E5A34` (text `#3E5A34`, soft `#E3EADB`) | wall `#3E5A34`, text `#A9C79A`, soft `#1F2A1B` |
| `vendors-planner` | Vendors & Planner | Proveedores y planner | Ladrillo (CASO's weathered brick) | `#7B4E3C` (text `#7B4E3C`, soft `#EFE3DC`) | wall `#7B4E3C`, text `#D9A78F`, soft `#2E211B` |
| `family-guests` | Family & Guests | Familia e invitados | Buganvilia | `#B4235A` (text `#A21E50`, soft `#F9E3EB`) | wall `#B4235A`, text `#F28AB0`, soft `#3A1A26` |
| `toast-vows` | Toast & Vows | Brindis y votos | Cantera (Bola's patinated stone) | `#6A6226` (text `#5C5520`, soft `#ECEAD6`) | wall `#6A6226`, text `#CFC88A`, soft `#2A2914` |

The season wall keeps its daylight paint in dark mode (white text, same AA ratio), because a pale wall glared at night. `season-text` is the lighter, text-safe variant on dark grounds.

## 4. Players (config, forkable)

| slot | id | name | colour | shape | pattern |
|---|---|---|---|---|---|
| a | `rem` | Rem | `#1D4FA3` / dark `#8DB1F7` | circle | solid |
| b | `shannon` | Shannon | `#A36909` / dark `#D08812` | diamond | hatch |

Colour-blind separation between the two player fills (OKLab ΔE×100, Machado 2009 simulation; ≥ 10 is clearly different): light typical 29.4 · light protan 25.4 · light deutan 30.2 · light tritan 22.6 · dark typical 26.2 · dark protan 27.2 · dark deutan 25.5 · dark tritan 23.3. Correct vs wrong: light typical 25.7 · light protan 12.8 · light deutan 9.7 · light tritan 29.6 · dark typical 26.1 · dark protan 8.3 · dark deutan 11.2 · dark tritan 31.3. Red-green simulations get as low as 8.3, which is why ✓ / ✕ are mandatory.

**Decision (Shannon's colour): ochre replaces terracotta.** Rem asked to try an ochre. Three candidates were tested against the Barro terracotta baseline (`shannon/eval.json`, `shannon-ochre-options.png`): A Terciopelo `#9A6F0B` / dark `#C9920E`, **B Ocre `#A36909` / dark `#D08812` (picked)**, C Ámbar `#A8611A` / dark `#DC7A1E`. B is the only one that is ≥ 22 ΔE from Rem, ≥ 12 from candlelight gold (`#F2A20C` / `#F5B63A`) and ≈ 10 from the brick season accent in every vision type and both modes. A sat too close to gold and brick in dark mode (10.7 / 7.7). C drifted back toward orange and toward the Toast & Vows cantera. Terracotta's dark `#FFA668` was only 3.5 from dark gold. Light fill `#A36909` is a UI / large-text colour (≥ 3.26:1 on every ground, 4.58:1 under white). Body-size Shannon text uses `player-b-text` `#835300` (≥ 4.58:1). The 128px score numerals use the fill, under the 3:1 large-text rule. Against correct/wrong, protan/deutan go as low as 8.9 / 6.5, but Shannon's colour never fills an answer pane, and those panes always carry ✓ / ✕.

## 5. Fonts and icons

- **Fonts (free, self-hosted for offline PWA):** `npm i @fontsource-variable/archivo @fontsource/alegreya`, then in `src/main.tsx` import `@fontsource-variable/archivo/wdth.css` (width + weight axes) and `@fontsource/alegreya/latin-500.css` (plus `latin-ext` for full diacritics if needed).
- **Swap in PR #1:** remove the `@fontsource/outfit/*` and `@fontsource/fraunces/*` imports (including `latin-600-italic`). Replace `font-family: "Outfit", …` with `var(--boda-font-sans)` and the Fraunces rules with `var(--boda-font-serif)` on the one invitation line only, never italic.
- **Icons: Phosphor** (`@phosphor-icons/react`, MIT). Recommended over Lucide because its six weights, including *bold* and *fill*, let icons match the 2px iron line and show active state by filling, and because Lucide is the default glyph set of generated UIs (an anti-slop tell). Use icons sparingly (the nav is text-first); never put an icon in a tinted rounded square.

## 6. Contrast check (re-run for v1)

`node build-tokens.mjs` → **568 pairs checked across 4 seasons × light/dark, 0 failures.**
- Lowest text pair: **4.58:1**, `on-player-b` `#FFFFFF` on `player-b` `#A36909` (light). Needs 4.5.
- Lowest UI pair: **3.26:1**, `player-b` `#A36909` on `surface-sunken` `#DADAD3` (light). Needs 3.
- What's checked, per theme and mode: every text role (text, muted, ink, brand, celebrate, correct, wrong, both players, season) on bg, surface and sunken; `on-X` on every fill; `X-text` and body text on every soft tint; UI lines and fills (border-strong, focus, player fills, ink) at 3:1; and the two PR #1 pairs (`--on-primary` on `--correct` / `--incorrect`).
- The season wall is a decorative plane, not a UI component (WCAG 1.4.11), so its fill isn't checked against the ground. Its text is checked (`on-season` on `season`).
- The gate was tested: setting Shannon's text to `#D9702E` made the build exit 1 with 16 failures, and an unknown `activeSeason` also exits 1.

| theme | mode | pairs | failures | lowest text | lowest UI |
|---|---|---|---|---|---|
| scouting-mexico-city | light | 71 | 0 | 4.58:1 (on-player-b on player-b) | 3.26:1 (player-b on surface-sunken) |
| scouting-mexico-city | dark | 71 | 0 | 5.03:1 (player-b-text on player-b-soft) | 4.23:1 (border-strong on surface-sunken) |
| vendors-planner | light | 71 | 0 | 4.58:1 (on-player-b on player-b) | 3.26:1 (player-b on surface-sunken) |
| vendors-planner | dark | 71 | 0 | 5.03:1 (player-b-text on player-b-soft) | 4.23:1 (border-strong on surface-sunken) |
| family-guests | light | 71 | 0 | 4.58:1 (on-player-b on player-b) | 3.26:1 (player-b on surface-sunken) |
| family-guests | dark | 71 | 0 | 5.03:1 (player-b-text on player-b-soft) | 4.23:1 (border-strong on surface-sunken) |
| toast-vows | light | 71 | 0 | 4.58:1 (on-player-b on player-b) | 3.26:1 (player-b on surface-sunken) |
| toast-vows | dark | 71 | 0 | 5.03:1 (player-b-text on player-b-soft) | 4.23:1 (border-strong on surface-sunken) |

## 7. REM-5 / PR #1 alias map

> **Note:** this alias map was written against PR #1. PRs #3 to #7 have merged into `main` since, so map every alias below against the variables and files on current `main` before applying it. Var names, the config path or the season wiring may have moved.

PR #1 (`rembaumann/boda#1`, Vite + React, no Tailwind yet) sets CSS vars from `appConfig.colors` in `src/config/app.config.ts` and reads them in `src/styles.css`. `tokens.css` ends with an alias block so the PR's styles pick up the new system with no component changes. Afterwards, delete `appConfig.colors` (`#F3EEE4` cream / `#C6522A` terracotta / Fraunces, which is exactly the "cream + serif + terracotta" cluster Rem called slop) and stop writing the vars from TS, or the TS values will override the aliases.

| PR var | → v1 token | note |
|---|---|---|
| `--background` | `--boda-color-bg` | also feeds `theme_color` in the manifest: use `#E9E9E4` |
| `--surface` | `--boda-color-surface` | |
| `--ink` | `--boda-color-text` | PR "ink" is body text; v1 `ink` is the iron primary (named after the material) |
| `--muted` | `--boda-color-text-muted` | |
| `--primary` / `--on-primary` | `--boda-color-ink` / `--boda-color-on-ink` | |
| `--accent` | `--boda-color-season-text` | season-aware and text-safe. Remove the PR's `radial-gradient(... var(--accent) 18% ...)` body wash (decorative gradient tell) |
| `--gold` | `--boda-color-celebrate` | the PR uses `--gold` for the focus ring; switch that to `--boda-color-focus` |
| `--line` | `--boda-color-border` | |
| `--correct` / `--correct-bg` | `--boda-color-correct-text` / `--boda-color-correct-soft` | the text variant also works as a fill under `--on-primary` (checked) |
| `--incorrect` / `--incorrect-bg` | `--boda-color-wrong-text` / `--boda-color-wrong-soft` | same |

Season ids already match the PR and the live Supabase `seasons` table (`scouting-mexico-city`, `vendors-planner`, `family-guests`, `toast-vows`), so no alias or data migration is needed.

## 8. Files (paste into the repo)

### 8.1 `config/boda.theme.json`: the only file forkers edit
```json
{
  "$comment": "Everything couple-specific lives here. Forkers: change names, player colors, and seasons, then run `node build-tokens.mjs`. The build fails if any text/background pair drops below WCAG AA.",
  "app": {
    "name": "Boda",
    "tagline": "Duelo diario de español mexicano"
  },
  "activeSeason": "scouting-mexico-city",
  "$activeSeason": "THE one value that swaps the theme. The build writes it as the :root default; at runtime set <html data-season> to the same id (later: from the Supabase seasons row).",
  "ink": {
    "light": {
      "fill": "#1F2420",
      "on": "#F4F4F0",
      "text": "#1F2420",
      "soft": "#D5D6CF"
    },
    "dark": {
      "fill": "#EEEBE3",
      "on": "#121411",
      "text": "#EEEBE3",
      "soft": "#2C302A"
    },
    "$why": "Hierro forjado: the black steel window frames at both venues (CASO's glass canopy, Bola's steel-and-glass terrace). Primary buttons and active states."
  },
  "brand": {
    "light": {
      "fill": "#B4235A",
      "on": "#FFFFFF",
      "text": "#A21E50",
      "soft": "#F9E3EB"
    },
    "dark": {
      "fill": "#F28AB0",
      "on": "#2A0E19",
      "text": "#F28AB0",
      "soft": "#3A1A26"
    },
    "$why": "Bugambilia: the pink blooms climbing CASO's brick and the city's walls. Wordmark and rare brand moments only."
  },
  "celebrate": {
    "light": {
      "fill": "#F2A20C",
      "on": "#2A1D15",
      "text": "#7C4D00",
      "soft": "#FDEFD2"
    },
    "dark": {
      "fill": "#F5B63A",
      "on": "#2A1D15",
      "text": "#F5B63A",
      "soft": "#3A2B12"
    },
    "$why": "Luz de vela / cempasúchil gold: the warm candle and string-light glow of evening receptions in both patios. Wins and trophies only."
  },
  "players": [
    {
      "slot": "a",
      "id": "rem",
      "name": "Rem",
      "initial": "R",
      "colorName": "Talavera cobalt (Bola's talavera-tiled stairs)",
      "light": {
        "fill": "#1D4FA3",
        "on": "#FFFFFF",
        "text": "#1D4FA3",
        "soft": "#E2E9F7"
      },
      "dark": {
        "fill": "#8DB1F7",
        "on": "#0E1A33",
        "text": "#8DB1F7",
        "soft": "#1A2540"
      },
      "shape": "circle",
      "pattern": "solid"
    },
    {
      "slot": "b",
      "id": "shannon",
      "name": "Shannon",
      "initial": "S",
      "colorName": "Ocre (CASO's mustard velvet as it reads in shade, pushed toward yellow-ochre limewash)",
      "light": {
        "fill": "#A36909",
        "on": "#FFFFFF",
        "text": "#835300",
        "soft": "#FEE9D0"
      },
      "dark": {
        "fill": "#D08812",
        "on": "#1C1200",
        "text": "#D08812",
        "soft": "#33261A"
      },
      "shape": "diamond",
      "pattern": "hatch",
      "$decision": "2026-11-10: Rem picked ochre over terracotta (Barro #AD4309). Chosen from 3 candidates in shannon/eval.json; see BODA-TOKENS-v1.md §4."
    }
  ],
  "seasons": [
    {
      "id": "scouting-mexico-city",
      "order": 1,
      "nameEs": "Viaje de exploración CDMX",
      "nameEn": "Scouting Trip CDMX",
      "accentName": "Helecho (fern, Bola's garden)",
      "light": {
        "fill": "#3E5A34",
        "on": "#FFFFFF",
        "text": "#3E5A34",
        "soft": "#E3EADB"
      },
      "dark": {
        "fill": "#3E5A34",
        "on": "#FFFFFF",
        "text": "#A9C79A",
        "soft": "#1F2A1B",
        "$note": "v0.2: in dark mode the season wall keeps its daylight paint (a pale wall glared at night); dark text/soft variants unchanged"
      }
    },
    {
      "id": "vendors-planner",
      "order": 2,
      "nameEs": "Proveedores y planner",
      "nameEn": "Vendors & Planner",
      "accentName": "Ladrillo (CASO's weathered brick)",
      "light": {
        "fill": "#7B4E3C",
        "on": "#FFFFFF",
        "text": "#7B4E3C",
        "soft": "#EFE3DC"
      },
      "dark": {
        "fill": "#7B4E3C",
        "on": "#FFFFFF",
        "text": "#D9A78F",
        "soft": "#2E211B",
        "$note": "v0.2: in dark mode the season wall keeps its daylight paint (a pale wall glared at night); dark text/soft variants unchanged"
      }
    },
    {
      "id": "family-guests",
      "order": 3,
      "nameEs": "Familia e invitados",
      "nameEn": "Family & Guests",
      "accentName": "Buganvilia",
      "light": {
        "fill": "#B4235A",
        "on": "#FFFFFF",
        "text": "#A21E50",
        "soft": "#F9E3EB"
      },
      "dark": {
        "fill": "#B4235A",
        "on": "#FFFFFF",
        "text": "#F28AB0",
        "soft": "#3A1A26",
        "$note": "v0.2: in dark mode the season wall keeps its daylight paint (a pale wall glared at night); dark text/soft variants unchanged"
      }
    },
    {
      "id": "toast-vows",
      "order": 4,
      "nameEs": "Brindis y votos",
      "nameEn": "Toast & Vows",
      "accentName": "Cantera (Bola's patinated stone)",
      "light": {
        "fill": "#6A6226",
        "on": "#FFFFFF",
        "text": "#5C5520",
        "soft": "#ECEAD6"
      },
      "dark": {
        "fill": "#6A6226",
        "on": "#FFFFFF",
        "text": "#CFC88A",
        "soft": "#2A2914",
        "$note": "v0.2: in dark mode the season wall keeps its daylight paint (a pale wall glared at night); dark text/soft variants unchanged"
      }
    }
  ]
}
```

### 8.2 `src/styles/tokens.json`: generated, DTCG / Style Dictionary v4
```json
{
  "$description": "Boda design tokens v1. GENERATED by build-tokens.mjs from config/boda.theme.json; edit the config, not this file.",
  "color": {
    "light": {
      "bg": {"$type":"color","$value":"#E9E9E4","$description":"Cool lime plaster sampled from the steel-corridor photo at Casa de la Bola; deliberately not the cream AI default."},
      "surface": {"$type":"color","$value":"#F4F4F0","$description":"One step lighter plaster for the solid nav and sheets; no cards."},
      "surface-sunken": {"$type":"color","$value":"#DADAD3","$description":"Cantera paving tone for empty window panes."},
      "border": {"$type":"color","$value":"#BBBBB2","$description":"Plaster seam; decorative only (not relied on for meaning)."},
      "border-strong": {"$type":"color","$value":"#74746B","$description":"Weathered stone; the lowest-contrast line that still meets 3:1 for UI."},
      "text": {"$type":"color","$value":"#1A1C19","$description":"Iron-black with a green cast, from the steel frames, not pure black."},
      "text-muted": {"$type":"color","$value":"#55564E","$description":"Mortar grey for secondary sentences; passes AA on every ground."},
      "focus": {"$type":"color","$value":"#1D4FA3","$description":"Talavera cobalt ring; visible on plaster and steel-night."},
      "ink": {"$type":"color","$value":"#1F2420","$description":"Hierro forjado: the black steel frames both venues share; the one primary action."},
      "on-ink": {"$type":"color","$value":"#F4F4F0"},
      "ink-text": {"$type":"color","$value":"#1F2420"},
      "ink-soft": {"$type":"color","$value":"#D5D6CF"},
      "brand": {"$type":"color","$value":"#B4235A","$description":"Bugambilia from CASO's walls; wordmark and rare brand moments only."},
      "on-brand": {"$type":"color","$value":"#FFFFFF"},
      "brand-text": {"$type":"color","$value":"#A21E50"},
      "brand-soft": {"$type":"color","$value":"#F9E3EB"},
      "celebrate": {"$type":"color","$value":"#F2A20C","$description":"Luz de vela / cempasúchil: candle-glow gold that means a win and nothing else."},
      "on-celebrate": {"$type":"color","$value":"#2A1D15"},
      "celebrate-text": {"$type":"color","$value":"#7C4D00"},
      "celebrate-soft": {"$type":"color","$value":"#FDEFD2"},
      "correct": {"$type":"color","$value":"#13735E","$description":"Jade pushed toward blue so it separates from red for deuteranopes; always with ✓."},
      "on-correct": {"$type":"color","$value":"#FFFFFF"},
      "correct-text": {"$type":"color","$value":"#0F6A56"},
      "correct-soft": {"$type":"color","$value":"#DDF1EA"},
      "wrong": {"$type":"color","$value":"#B3261E","$description":"Chile red; always with ✕."},
      "on-wrong": {"$type":"color","$value":"#FFFFFF"},
      "wrong-text": {"$type":"color","$value":"#B3261E"},
      "wrong-soft": {"$type":"color","$value":"#FBE3E0"},
      "player-a": {"$type":"color","$value":"#1D4FA3","$description":"Rem: talavera cobalt + filled circle."},
      "on-player-a": {"$type":"color","$value":"#FFFFFF"},
      "player-a-text": {"$type":"color","$value":"#1D4FA3"},
      "player-a-soft": {"$type":"color","$value":"#E2E9F7"},
      "player-b": {"$type":"color","$value":"#A36909","$description":"Shannon: ocre (CASO mustard velvet) + diamond + hatch; blue vs ochre stays 22+ apart in every colour-vision simulation."},
      "on-player-b": {"$type":"color","$value":"#FFFFFF"},
      "player-b-text": {"$type":"color","$value":"#835300"},
      "player-b-soft": {"$type":"color","$value":"#FEE9D0"}
    },
    "dark": {
      "bg": {"$type":"color","$value":"#121411"},
      "surface": {"$type":"color","$value":"#1B1E1A"},
      "surface-sunken": {"$type":"color","$value":"#242823"},
      "border": {"$type":"color","$value":"#343A33"},
      "border-strong": {"$type":"color","$value":"#858A7E"},
      "text": {"$type":"color","$value":"#EEEBE3"},
      "text-muted": {"$type":"color","$value":"#ABA79A"},
      "focus": {"$type":"color","$value":"#8DB1F7"},
      "ink": {"$type":"color","$value":"#EEEBE3"},
      "on-ink": {"$type":"color","$value":"#121411"},
      "ink-text": {"$type":"color","$value":"#EEEBE3"},
      "ink-soft": {"$type":"color","$value":"#2C302A"},
      "brand": {"$type":"color","$value":"#F28AB0"},
      "on-brand": {"$type":"color","$value":"#2A0E19"},
      "brand-text": {"$type":"color","$value":"#F28AB0"},
      "brand-soft": {"$type":"color","$value":"#3A1A26"},
      "celebrate": {"$type":"color","$value":"#F5B63A"},
      "on-celebrate": {"$type":"color","$value":"#2A1D15"},
      "celebrate-text": {"$type":"color","$value":"#F5B63A"},
      "celebrate-soft": {"$type":"color","$value":"#3A2B12"},
      "correct": {"$type":"color","$value":"#13735E"},
      "on-correct": {"$type":"color","$value":"#FFFFFF"},
      "correct-text": {"$type":"color","$value":"#6FD3B5"},
      "correct-soft": {"$type":"color","$value":"#123029"},
      "wrong": {"$type":"color","$value":"#C2372E"},
      "on-wrong": {"$type":"color","$value":"#FFFFFF"},
      "wrong-text": {"$type":"color","$value":"#FF9B91"},
      "wrong-soft": {"$type":"color","$value":"#3D1A17"},
      "player-a": {"$type":"color","$value":"#8DB1F7"},
      "on-player-a": {"$type":"color","$value":"#0E1A33"},
      "player-a-text": {"$type":"color","$value":"#8DB1F7"},
      "player-a-soft": {"$type":"color","$value":"#1A2540"},
      "player-b": {"$type":"color","$value":"#D08812"},
      "on-player-b": {"$type":"color","$value":"#1C1200"},
      "player-b-text": {"$type":"color","$value":"#D08812"},
      "player-b-soft": {"$type":"color","$value":"#33261A"}
    }
  },
  "season": {
    "scouting-mexico-city": {
      "$description": "Scouting Trip CDMX (Viaje de exploración CDMX), Helecho (fern, Bola's garden). Overrides only the four season colour tokens.",
      "light": {
        "season": {"$type":"color","$value":"#3E5A34"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#3E5A34"},
        "season-soft": {"$type":"color","$value":"#E3EADB"}
      },
      "dark": {
        "season": {"$type":"color","$value":"#3E5A34"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#A9C79A"},
        "season-soft": {"$type":"color","$value":"#1F2A1B"}
      }
    },
    "vendors-planner": {
      "$description": "Vendors & Planner (Proveedores y planner), Ladrillo (CASO's weathered brick). Overrides only the four season colour tokens.",
      "light": {
        "season": {"$type":"color","$value":"#7B4E3C"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#7B4E3C"},
        "season-soft": {"$type":"color","$value":"#EFE3DC"}
      },
      "dark": {
        "season": {"$type":"color","$value":"#7B4E3C"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#D9A78F"},
        "season-soft": {"$type":"color","$value":"#2E211B"}
      }
    },
    "family-guests": {
      "$description": "Family & Guests (Familia e invitados), Buganvilia. Overrides only the four season colour tokens.",
      "light": {
        "season": {"$type":"color","$value":"#B4235A"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#A21E50"},
        "season-soft": {"$type":"color","$value":"#F9E3EB"}
      },
      "dark": {
        "season": {"$type":"color","$value":"#B4235A"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#F28AB0"},
        "season-soft": {"$type":"color","$value":"#3A1A26"}
      }
    },
    "toast-vows": {
      "$description": "Toast & Vows (Brindis y votos), Cantera (Bola's patinated stone). Overrides only the four season colour tokens.",
      "light": {
        "season": {"$type":"color","$value":"#6A6226"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#5C5520"},
        "season-soft": {"$type":"color","$value":"#ECEAD6"}
      },
      "dark": {
        "season": {"$type":"color","$value":"#6A6226"},
        "on-season": {"$type":"color","$value":"#FFFFFF"},
        "season-text": {"$type":"color","$value":"#CFC88A"},
        "season-soft": {"$type":"color","$value":"#2A2914"}
      }
    }
  },
  "player": {
    "a": {
      "$description": "Rem: Talavera cobalt (Bola's talavera-tiled stairs). Identity = colour + shape + pattern; never colour alone.",
      "id": {"$value":"rem"},
      "name": {"$value":"Rem"},
      "initial": {"$value":"R"},
      "shape": {"$value":"circle"},
      "pattern": {"$value":"solid"}
    },
    "b": {
      "$description": "Shannon: Ocre (CASO's mustard velvet as it reads in shade, pushed toward yellow-ochre limewash). Identity = colour + shape + pattern; never colour alone.",
      "id": {"$value":"shannon"},
      "name": {"$value":"Shannon"},
      "initial": {"$value":"S"},
      "shape": {"$value":"diamond"},
      "pattern": {"$value":"hatch"}
    }
  },
  "font": {
    "family": {
      "sans": {"$type":"fontFamily","$value":"'Archivo Variable', 'Archivo', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif","$description":"Archivo (Omnibus-Type, Google Fonts, OFL): grotesque with a width axis, condensed for scores and signage, normal for reading; tabular figures; full Spanish set."},
      "serif": {"$type":"fontFamily","$value":"'Alegreya', Georgia, 'Times New Roman', serif","$description":"Alegreya (Huerta Tipográfica, Google Fonts, OFL): built for Spanish text; used for ONE invitation line per screen, never italic."}
    },
    "style": {
      "caption": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"12px","lineHeight":1.33,"fontWeight":500,"letterSpacing":"0em","fontStretch":"100%"}},
      "body-sm": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"14px","lineHeight":1.43,"fontWeight":400,"letterSpacing":"0em","fontStretch":"100%"}},
      "body": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"16px","lineHeight":1.5,"fontWeight":400,"letterSpacing":"0em","fontStretch":"100%"}},
      "body-lg": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"18px","lineHeight":1.45,"fontWeight":400,"letterSpacing":"0em","fontStretch":"100%"}},
      "label": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"15px","lineHeight":1.3,"fontWeight":600,"letterSpacing":"0em","fontStretch":"100%"}},
      "title": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"20px","lineHeight":1.3,"fontWeight":600,"letterSpacing":"0em","fontStretch":"100%"}},
      "headline": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"24px","lineHeight":1.2,"fontWeight":700,"letterSpacing":"-0.005em","fontStretch":"100%"}},
      "invitation": {"$type":"typography","$value":{"fontFamily":"{font.family.serif}","fontSize":"31px","lineHeight":1.1,"fontWeight":500,"letterSpacing":"0em","fontStretch":"100%"}},
      "season": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"32px","lineHeight":1,"fontWeight":700,"letterSpacing":"-0.01em","fontStretch":"75%"}},
      "score": {"$type":"typography","$value":{"fontFamily":"{font.family.sans}","fontSize":"128px","lineHeight":0.86,"fontWeight":800,"letterSpacing":"-0.02em","fontStretch":"62%"}}
    }
  },
  "space": {
    "0": {"$type":"dimension","$value":"0px"},
    "1": {"$type":"dimension","$value":"4px"},
    "2": {"$type":"dimension","$value":"8px"},
    "3": {"$type":"dimension","$value":"12px"},
    "4": {"$type":"dimension","$value":"16px"},
    "5": {"$type":"dimension","$value":"20px"},
    "6": {"$type":"dimension","$value":"24px"},
    "8": {"$type":"dimension","$value":"32px"},
    "9": {"$type":"dimension","$value":"36px"},
    "10": {"$type":"dimension","$value":"40px"},
    "11": {"$type":"dimension","$value":"44px"},
    "12": {"$type":"dimension","$value":"48px"},
    "13": {"$type":"dimension","$value":"52px"},
    "14": {"$type":"dimension","$value":"56px"},
    "16": {"$type":"dimension","$value":"64px"},
    "20": {"$type":"dimension","$value":"80px"},
    "px": {"$type":"dimension","$value":"1px"},
    "0.5": {"$type":"dimension","$value":"2px"}
  },
  "size": {
    "tap-min": {"$type":"dimension","$value":"{space.11}","$description":"Apple HIG / WCAG 2.5.5 minimum: every tappable thing is at least this tall and wide."},
    "nav": {"$type":"dimension","$value":"{space.13}","$description":"Bottom tab height (before the safe-area inset)."},
    "control": {"$type":"dimension","$value":"{space.14}","$description":"Primary iron button height, in the thumb zone."}
  },
  "radius": {
    "none": {"$type":"dimension","$value":"0px","$description":"Default: steel frames, panes, the season wall, the CTA."},
    "sm": {"$type":"dimension","$value":"2px","$description":"Inputs, so the caret area reads as a field."},
    "md": {"$type":"dimension","$value":"4px","$description":"Sheets and dialogs only."}
  },
  "shadow": {
    "overlay": {"$type":"shadow","$value":"0 24px 48px -24px rgb(18 20 17 / 0.45)","$description":"The only shadow: sheets over content. Everything else is flat, grouped by type and iron rules."}
  },
  "motion": {
    "duration": {
      "instant": {"$type":"duration","$value":"80ms"},
      "fast": {"$type":"duration","$value":"150ms"},
      "base": {"$type":"duration","$value":"240ms"},
      "slow": {"$type":"duration","$value":"400ms"},
      "celebrate": {"$type":"duration","$value":"900ms"}
    },
    "easing": {
      "standard": {"$type":"cubicBezier","$value":[0.2,0,0,1]},
      "decelerate": {"$type":"cubicBezier","$value":[0.05,0.7,0.1,1]},
      "accelerate": {"$type":"cubicBezier","$value":[0.3,0,0.8,0.15]},
      "spring": {"$type":"cubicBezier","$value":[0.34,1.56,0.64,1]}
    },
    "reduced-duration": {"$type":"duration","$value":"1ms","$description":"Every duration collapses to this under prefers-reduced-motion: state still changes, nothing travels."}
  },
  "safe-area": {
    "top": {"$value":"env(safe-area-inset-top, 0px)","$description":"iOS notch / home indicator; needs viewport-fit=cover."},
    "right": {"$value":"env(safe-area-inset-right, 0px)","$description":"iOS notch / home indicator; needs viewport-fit=cover."},
    "bottom": {"$value":"env(safe-area-inset-bottom, 0px)","$description":"iOS notch / home indicator; needs viewport-fit=cover."},
    "left": {"$value":"env(safe-area-inset-left, 0px)","$description":"iOS notch / home indicator; needs viewport-fit=cover."}
  }
}
```

Optional Style Dictionary build (free, verified with style-dictionary 4; it warns that `letterSpacing` and `fontStretch` don't fit the CSS `font` shorthand, which is expected):
```js
// sd.config.mjs   →   npx style-dictionary@4 build --config sd.config.mjs
export default { source: ['src/styles/tokens.json'], usesDtcg: true,
  platforms: { css: { transformGroup: 'css', buildPath: 'src/styles/sd/', files: [{ destination: 'sd-vars.css', format: 'css/variables' }] } } };
```

### 8.3 `src/styles/tokens.css`: generated; `:root` base, dark, one block per season, reduced motion, PR aliases
```css
/* Boda design tokens v1. GENERATED by build-tokens.mjs from config/boda.theme.json. Do not edit by hand.
   Theme switch: ONE value, config.activeSeason ("scouting-mexico-city"), which is also the :root default.
   At runtime: document.documentElement.dataset.season = activeSeason. Optional data-theme="light|dark" overrides the OS. */

:root {
  color-scheme: light dark;

  /* colour: light (base) */
  --boda-color-bg: #E9E9E4;
  --boda-color-surface: #F4F4F0;
  --boda-color-surface-sunken: #DADAD3;
  --boda-color-border: #BBBBB2;
  --boda-color-border-strong: #74746B;
  --boda-color-text: #1A1C19;
  --boda-color-text-muted: #55564E;
  --boda-color-focus: #1D4FA3;
  --boda-color-ink: #1F2420;
  --boda-color-on-ink: #F4F4F0;
  --boda-color-ink-text: #1F2420;
  --boda-color-ink-soft: #D5D6CF;
  --boda-color-brand: #B4235A;
  --boda-color-on-brand: #FFFFFF;
  --boda-color-brand-text: #A21E50;
  --boda-color-brand-soft: #F9E3EB;
  --boda-color-celebrate: #F2A20C;
  --boda-color-on-celebrate: #2A1D15;
  --boda-color-celebrate-text: #7C4D00;
  --boda-color-celebrate-soft: #FDEFD2;
  --boda-color-correct: #13735E;
  --boda-color-on-correct: #FFFFFF;
  --boda-color-correct-text: #0F6A56;
  --boda-color-correct-soft: #DDF1EA;
  --boda-color-wrong: #B3261E;
  --boda-color-on-wrong: #FFFFFF;
  --boda-color-wrong-text: #B3261E;
  --boda-color-wrong-soft: #FBE3E0;
  --boda-color-player-a: #1D4FA3;
  --boda-color-on-player-a: #FFFFFF;
  --boda-color-player-a-text: #1D4FA3;
  --boda-color-player-a-soft: #E2E9F7;
  --boda-color-player-b: #A36909;
  --boda-color-on-player-b: #FFFFFF;
  --boda-color-player-b-text: #835300;
  --boda-color-player-b-soft: #FEE9D0;

  /* season: default = activeSeason (Scouting Trip CDMX) */
  --boda-color-season: #3E5A34;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #3E5A34;
  --boda-color-season-soft: #E3EADB;

  /* roles */
  --boda-color-primary: var(--boda-color-ink);
  --boda-color-on-primary: var(--boda-color-on-ink);
  --boda-color-accent: var(--boda-color-season-text);

  /* type: Archivo (sans) + Alegreya (serif, one line per screen) */
  --boda-font-sans: 'Archivo Variable', 'Archivo', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  --boda-font-serif: 'Alegreya', Georgia, 'Times New Roman', serif;
  --boda-text-caption: 0.75rem;
  --boda-leading-caption: 1.33;
  --boda-weight-caption: 500;
  --boda-tracking-caption: 0em;
  --boda-stretch-caption: 100%;
  --boda-family-caption: var(--boda-font-sans);
  --boda-text-body-sm: 0.875rem;
  --boda-leading-body-sm: 1.43;
  --boda-weight-body-sm: 400;
  --boda-tracking-body-sm: 0em;
  --boda-stretch-body-sm: 100%;
  --boda-family-body-sm: var(--boda-font-sans);
  --boda-text-body: 1rem;
  --boda-leading-body: 1.5;
  --boda-weight-body: 400;
  --boda-tracking-body: 0em;
  --boda-stretch-body: 100%;
  --boda-family-body: var(--boda-font-sans);
  --boda-text-body-lg: 1.125rem;
  --boda-leading-body-lg: 1.45;
  --boda-weight-body-lg: 400;
  --boda-tracking-body-lg: 0em;
  --boda-stretch-body-lg: 100%;
  --boda-family-body-lg: var(--boda-font-sans);
  --boda-text-label: 0.9375rem;
  --boda-leading-label: 1.3;
  --boda-weight-label: 600;
  --boda-tracking-label: 0em;
  --boda-stretch-label: 100%;
  --boda-family-label: var(--boda-font-sans);
  --boda-text-title: 1.25rem;
  --boda-leading-title: 1.3;
  --boda-weight-title: 600;
  --boda-tracking-title: 0em;
  --boda-stretch-title: 100%;
  --boda-family-title: var(--boda-font-sans);
  --boda-text-headline: 1.5rem;
  --boda-leading-headline: 1.2;
  --boda-weight-headline: 700;
  --boda-tracking-headline: -0.005em;
  --boda-stretch-headline: 100%;
  --boda-family-headline: var(--boda-font-sans);
  --boda-text-invitation: 1.9375rem;
  --boda-leading-invitation: 1.1;
  --boda-weight-invitation: 500;
  --boda-tracking-invitation: 0em;
  --boda-stretch-invitation: 100%;
  --boda-family-invitation: var(--boda-font-serif);
  --boda-text-season: 2rem;
  --boda-leading-season: 1;
  --boda-weight-season: 700;
  --boda-tracking-season: -0.01em;
  --boda-stretch-season: 75%;
  --boda-family-season: var(--boda-font-sans);
  --boda-text-score: 8rem;
  --boda-leading-score: 0.86;
  --boda-weight-score: 800;
  --boda-tracking-score: -0.02em;
  --boda-stretch-score: 62%;
  --boda-family-score: var(--boda-font-sans);

  /* space (4pt) */
  --boda-space-0: 0;
  --boda-space-1: 0.25rem;
  --boda-space-2: 0.5rem;
  --boda-space-3: 0.75rem;
  --boda-space-4: 1rem;
  --boda-space-5: 1.25rem;
  --boda-space-6: 1.5rem;
  --boda-space-8: 2rem;
  --boda-space-9: 2.25rem;
  --boda-space-10: 2.5rem;
  --boda-space-11: 2.75rem;
  --boda-space-12: 3rem;
  --boda-space-13: 3.25rem;
  --boda-space-14: 3.5rem;
  --boda-space-16: 4rem;
  --boda-space-20: 5rem;
  --boda-space-px: 1px;
  --boda-space-0_5: 0.125rem;

  /* sizes (tap targets) */
  --boda-size-tap-min: var(--boda-space-11);
  --boda-size-nav: var(--boda-space-13);
  --boda-size-control: var(--boda-space-14);

  /* radius */
  --boda-radius-none: 0px;
  --boda-radius-sm: 2px;
  --boda-radius-md: 4px;

  /* elevation */
  --boda-shadow-overlay: 0 24px 48px -24px rgb(18 20 17 / 0.45);

  /* motion */
  --boda-duration-instant: 80ms;
  --boda-duration-fast: 150ms;
  --boda-duration-base: 240ms;
  --boda-duration-slow: 400ms;
  --boda-duration-celebrate: 900ms;
  --boda-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --boda-ease-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --boda-ease-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  --boda-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* iOS safe areas */
  --boda-safe-top: env(safe-area-inset-top, 0px);
  --boda-safe-right: env(safe-area-inset-right, 0px);
  --boda-safe-bottom: env(safe-area-inset-bottom, 0px);
  --boda-safe-left: env(safe-area-inset-left, 0px);

  /* player identity (shape/pattern names for components; colours above) */
  --boda-player-a-shape: circle;
  --boda-player-a-pattern: solid;
  --boda-player-b-shape: diamond;
  --boda-player-b-pattern: hatch;
}

/* seasons: each overrides only the four season colours */
:root[data-season="scouting-mexico-city"] { /* Scouting Trip CDMX / Viaje de exploración CDMX: Helecho (fern, Bola's garden) */
  --boda-color-season: #3E5A34;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #3E5A34;
  --boda-color-season-soft: #E3EADB;
}
:root[data-season="vendors-planner"] { /* Vendors & Planner / Proveedores y planner: Ladrillo (CASO's weathered brick) */
  --boda-color-season: #7B4E3C;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #7B4E3C;
  --boda-color-season-soft: #EFE3DC;
}
:root[data-season="family-guests"] { /* Family & Guests / Familia e invitados: Buganvilia */
  --boda-color-season: #B4235A;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #A21E50;
  --boda-color-season-soft: #F9E3EB;
}
:root[data-season="toast-vows"] { /* Toast & Vows / Brindis y votos: Cantera (Bola's patinated stone) */
  --boda-color-season: #6A6226;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #5C5520;
  --boda-color-season-soft: #ECEAD6;
}

/* dark: follows the OS unless data-theme="light" */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --boda-color-bg: #121411;
    --boda-color-surface: #1B1E1A;
    --boda-color-surface-sunken: #242823;
    --boda-color-border: #343A33;
    --boda-color-border-strong: #858A7E;
    --boda-color-text: #EEEBE3;
    --boda-color-text-muted: #ABA79A;
    --boda-color-focus: #8DB1F7;
    --boda-color-ink: #EEEBE3;
    --boda-color-on-ink: #121411;
    --boda-color-ink-text: #EEEBE3;
    --boda-color-ink-soft: #2C302A;
    --boda-color-brand: #F28AB0;
    --boda-color-on-brand: #2A0E19;
    --boda-color-brand-text: #F28AB0;
    --boda-color-brand-soft: #3A1A26;
    --boda-color-celebrate: #F5B63A;
    --boda-color-on-celebrate: #2A1D15;
    --boda-color-celebrate-text: #F5B63A;
    --boda-color-celebrate-soft: #3A2B12;
    --boda-color-correct: #13735E;
    --boda-color-on-correct: #FFFFFF;
    --boda-color-correct-text: #6FD3B5;
    --boda-color-correct-soft: #123029;
    --boda-color-wrong: #C2372E;
    --boda-color-on-wrong: #FFFFFF;
    --boda-color-wrong-text: #FF9B91;
    --boda-color-wrong-soft: #3D1A17;
    --boda-color-player-a: #8DB1F7;
    --boda-color-on-player-a: #0E1A33;
    --boda-color-player-a-text: #8DB1F7;
    --boda-color-player-a-soft: #1A2540;
    --boda-color-player-b: #D08812;
    --boda-color-on-player-b: #1C1200;
    --boda-color-player-b-text: #D08812;
    --boda-color-player-b-soft: #33261A;
    --boda-color-season: #3E5A34;
    --boda-color-on-season: #FFFFFF;
    --boda-color-season-text: #A9C79A;
    --boda-color-season-soft: #1F2A1B;
  }
  :root:not([data-theme="light"])[data-season="scouting-mexico-city"] {
    --boda-color-season: #3E5A34;
    --boda-color-on-season: #FFFFFF;
    --boda-color-season-text: #A9C79A;
    --boda-color-season-soft: #1F2A1B;
  }
  :root:not([data-theme="light"])[data-season="vendors-planner"] {
    --boda-color-season: #7B4E3C;
    --boda-color-on-season: #FFFFFF;
    --boda-color-season-text: #D9A78F;
    --boda-color-season-soft: #2E211B;
  }
  :root:not([data-theme="light"])[data-season="family-guests"] {
    --boda-color-season: #B4235A;
    --boda-color-on-season: #FFFFFF;
    --boda-color-season-text: #F28AB0;
    --boda-color-season-soft: #3A1A26;
  }
  :root:not([data-theme="light"])[data-season="toast-vows"] {
    --boda-color-season: #6A6226;
    --boda-color-on-season: #FFFFFF;
    --boda-color-season-text: #CFC88A;
    --boda-color-season-soft: #2A2914;
  }
}
:root[data-theme="dark"] {
  --boda-color-bg: #121411;
  --boda-color-surface: #1B1E1A;
  --boda-color-surface-sunken: #242823;
  --boda-color-border: #343A33;
  --boda-color-border-strong: #858A7E;
  --boda-color-text: #EEEBE3;
  --boda-color-text-muted: #ABA79A;
  --boda-color-focus: #8DB1F7;
  --boda-color-ink: #EEEBE3;
  --boda-color-on-ink: #121411;
  --boda-color-ink-text: #EEEBE3;
  --boda-color-ink-soft: #2C302A;
  --boda-color-brand: #F28AB0;
  --boda-color-on-brand: #2A0E19;
  --boda-color-brand-text: #F28AB0;
  --boda-color-brand-soft: #3A1A26;
  --boda-color-celebrate: #F5B63A;
  --boda-color-on-celebrate: #2A1D15;
  --boda-color-celebrate-text: #F5B63A;
  --boda-color-celebrate-soft: #3A2B12;
  --boda-color-correct: #13735E;
  --boda-color-on-correct: #FFFFFF;
  --boda-color-correct-text: #6FD3B5;
  --boda-color-correct-soft: #123029;
  --boda-color-wrong: #C2372E;
  --boda-color-on-wrong: #FFFFFF;
  --boda-color-wrong-text: #FF9B91;
  --boda-color-wrong-soft: #3D1A17;
  --boda-color-player-a: #8DB1F7;
  --boda-color-on-player-a: #0E1A33;
  --boda-color-player-a-text: #8DB1F7;
  --boda-color-player-a-soft: #1A2540;
  --boda-color-player-b: #D08812;
  --boda-color-on-player-b: #1C1200;
  --boda-color-player-b-text: #D08812;
  --boda-color-player-b-soft: #33261A;
  --boda-color-season: #3E5A34;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #A9C79A;
  --boda-color-season-soft: #1F2A1B;
}
:root[data-theme="dark"][data-season="scouting-mexico-city"] {
  --boda-color-season: #3E5A34;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #A9C79A;
  --boda-color-season-soft: #1F2A1B;
}
:root[data-theme="dark"][data-season="vendors-planner"] {
  --boda-color-season: #7B4E3C;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #D9A78F;
  --boda-color-season-soft: #2E211B;
}
:root[data-theme="dark"][data-season="family-guests"] {
  --boda-color-season: #B4235A;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #F28AB0;
  --boda-color-season-soft: #3A1A26;
}
:root[data-theme="dark"][data-season="toast-vows"] {
  --boda-color-season: #6A6226;
  --boda-color-on-season: #FFFFFF;
  --boda-color-season-text: #CFC88A;
  --boda-color-season-soft: #2A2914;
}

/* reduced motion: state changes stay, travel/flip/confetti go */
@media (prefers-reduced-motion: reduce) {
  :root {
    --boda-duration-instant: 1ms;
    --boda-duration-fast: 1ms;
    --boda-duration-base: 1ms;
    --boda-duration-slow: 1ms;
    --boda-duration-celebrate: 1ms;
    --boda-ease-spring: linear;
  }
}

/* compatibility with REM-5 / PR #1 (src/config/app.config.ts -> CSS vars). Remove once components use --boda-* */
:root {
  --background: var(--boda-color-bg);
  --surface: var(--boda-color-surface);
  --ink: var(--boda-color-text);
  --muted: var(--boda-color-text-muted);
  --primary: var(--boda-color-ink);
  --on-primary: var(--boda-color-on-ink);
  --accent: var(--boda-color-season-text);
  --gold: var(--boda-color-celebrate);
  --line: var(--boda-color-border);
  --correct: var(--boda-color-correct-text);
  --correct-bg: var(--boda-color-correct-soft);
  --incorrect: var(--boda-color-wrong-text);
  --incorrect-bg: var(--boda-color-wrong-soft);
}
```

### 8.4 `src/styles/tailwind.theme.css`: Tailwind v4 `@theme` mapping (generated)
```css
/* Tailwind v4 bridge. GENERATED. In your CSS entry:
   @import "tailwindcss"; @import "./tokens.css"; @import "./tailwind.theme.css";
   Utilities: bg-bg, text-text-muted, bg-ink text-on-ink, bg-season, text-player-b-text, text-score, font-serif, rounded-none, min-h-tap, pb-safe ... */
@theme inline {
  --color-bg: var(--boda-color-bg);
  --color-surface: var(--boda-color-surface);
  --color-surface-sunken: var(--boda-color-surface-sunken);
  --color-border: var(--boda-color-border);
  --color-border-strong: var(--boda-color-border-strong);
  --color-text: var(--boda-color-text);
  --color-text-muted: var(--boda-color-text-muted);
  --color-focus: var(--boda-color-focus);
  --color-ink: var(--boda-color-ink);
  --color-on-ink: var(--boda-color-on-ink);
  --color-ink-text: var(--boda-color-ink-text);
  --color-ink-soft: var(--boda-color-ink-soft);
  --color-brand: var(--boda-color-brand);
  --color-on-brand: var(--boda-color-on-brand);
  --color-brand-text: var(--boda-color-brand-text);
  --color-brand-soft: var(--boda-color-brand-soft);
  --color-celebrate: var(--boda-color-celebrate);
  --color-on-celebrate: var(--boda-color-on-celebrate);
  --color-celebrate-text: var(--boda-color-celebrate-text);
  --color-celebrate-soft: var(--boda-color-celebrate-soft);
  --color-correct: var(--boda-color-correct);
  --color-on-correct: var(--boda-color-on-correct);
  --color-correct-text: var(--boda-color-correct-text);
  --color-correct-soft: var(--boda-color-correct-soft);
  --color-wrong: var(--boda-color-wrong);
  --color-on-wrong: var(--boda-color-on-wrong);
  --color-wrong-text: var(--boda-color-wrong-text);
  --color-wrong-soft: var(--boda-color-wrong-soft);
  --color-player-a: var(--boda-color-player-a);
  --color-on-player-a: var(--boda-color-on-player-a);
  --color-player-a-text: var(--boda-color-player-a-text);
  --color-player-a-soft: var(--boda-color-player-a-soft);
  --color-player-b: var(--boda-color-player-b);
  --color-on-player-b: var(--boda-color-on-player-b);
  --color-player-b-text: var(--boda-color-player-b-text);
  --color-player-b-soft: var(--boda-color-player-b-soft);
  --color-season: var(--boda-color-season);
  --color-on-season: var(--boda-color-on-season);
  --color-season-text: var(--boda-color-season-text);
  --color-season-soft: var(--boda-color-season-soft);
  --color-primary: var(--boda-color-primary);
  --color-on-primary: var(--boda-color-on-primary);
  --color-accent: var(--boda-color-accent);
  --font-sans: var(--boda-font-sans);
  --font-serif: var(--boda-font-serif);
  --text-caption: var(--boda-text-caption);
  --text-caption--line-height: var(--boda-leading-caption);
  --text-caption--letter-spacing: var(--boda-tracking-caption);
  --text-caption--font-weight: var(--boda-weight-caption);
  --text-body-sm: var(--boda-text-body-sm);
  --text-body-sm--line-height: var(--boda-leading-body-sm);
  --text-body-sm--letter-spacing: var(--boda-tracking-body-sm);
  --text-body-sm--font-weight: var(--boda-weight-body-sm);
  --text-body: var(--boda-text-body);
  --text-body--line-height: var(--boda-leading-body);
  --text-body--letter-spacing: var(--boda-tracking-body);
  --text-body--font-weight: var(--boda-weight-body);
  --text-body-lg: var(--boda-text-body-lg);
  --text-body-lg--line-height: var(--boda-leading-body-lg);
  --text-body-lg--letter-spacing: var(--boda-tracking-body-lg);
  --text-body-lg--font-weight: var(--boda-weight-body-lg);
  --text-label: var(--boda-text-label);
  --text-label--line-height: var(--boda-leading-label);
  --text-label--letter-spacing: var(--boda-tracking-label);
  --text-label--font-weight: var(--boda-weight-label);
  --text-title: var(--boda-text-title);
  --text-title--line-height: var(--boda-leading-title);
  --text-title--letter-spacing: var(--boda-tracking-title);
  --text-title--font-weight: var(--boda-weight-title);
  --text-headline: var(--boda-text-headline);
  --text-headline--line-height: var(--boda-leading-headline);
  --text-headline--letter-spacing: var(--boda-tracking-headline);
  --text-headline--font-weight: var(--boda-weight-headline);
  --text-invitation: var(--boda-text-invitation);
  --text-invitation--line-height: var(--boda-leading-invitation);
  --text-invitation--letter-spacing: var(--boda-tracking-invitation);
  --text-invitation--font-weight: var(--boda-weight-invitation);
  --text-season: var(--boda-text-season);
  --text-season--line-height: var(--boda-leading-season);
  --text-season--letter-spacing: var(--boda-tracking-season);
  --text-season--font-weight: var(--boda-weight-season);
  --text-score: var(--boda-text-score);
  --text-score--line-height: var(--boda-leading-score);
  --text-score--letter-spacing: var(--boda-tracking-score);
  --text-score--font-weight: var(--boda-weight-score);
  --spacing: 0.25rem;
  --radius-none: var(--boda-radius-none);
  --radius-sm: var(--boda-radius-sm);
  --radius-md: var(--boda-radius-md);
  --shadow-overlay: var(--boda-shadow-overlay);
  --ease-standard: var(--boda-ease-standard);
  --ease-decelerate: var(--boda-ease-decelerate);
  --ease-accelerate: var(--boda-ease-accelerate);
  --ease-spring: var(--boda-ease-spring);
}
@utility min-h-tap { min-height: var(--boda-size-tap-min); }
@utility min-w-tap { min-width: var(--boda-size-tap-min); }
@utility h-control { height: var(--boda-size-control); }
@utility pt-safe { padding-top: var(--boda-safe-top); }
@utility pb-safe { padding-bottom: var(--boda-safe-bottom); }
@utility stretch-score { font-stretch: var(--boda-stretch-score); }
@utility stretch-season { font-stretch: var(--boda-stretch-season); }
```

## 9. Ticket

**Title:** Design tokens v1: venue-grounded base system + 4 season themes (replace Outfit/Fraunces/cream)

**Summary:** Add Boda's first design token set: one shared base (plaster, iron, bugambilia, candle gold, jade/chile, Rem/Shannon identity, Archivo + Alegreya, 4pt space, square radius, motion with reduced-motion, 44px tap sizes, safe areas) plus four season variants (Scouting Trip CDMX, Vendors & Planner, Family & Guests, Toast & Vows). Each variant overrides only the season accent. Couple-specific values live in `config/boda.theme.json`. A zero-dependency build generates JSON, CSS and the Tailwind v4 theme, and fails on any WCAG AA contrast regression. Wire it into PR #1's styles through the alias map, so the current screens move off the cream/terracotta/Fraunces/Outfit look without a rewrite.

**Scope**
- Add `config/boda.theme.json`, `scripts/build-tokens.mjs` (Appendix A) and generated `src/styles/tokens.json`, `tokens.css`, `tailwind.theme.css`. Add `"tokens": "node scripts/build-tokens.mjs --out src/styles"` to `package.json` and run it in CI before `build`.
- Import `tokens.css` first in `src/main.tsx`. Set `document.documentElement.dataset.season` from config `activeSeason`.
- Remove `appConfig.colors` and the code that writes them as CSS vars. Rely on the alias block (§7).
- Swap fonts: remove Outfit and Fraunces (including italic), add `@fontsource-variable/archivo` + `@fontsource/alegreya` (§5).
- Remove the radial-gradient accent wash on `body`. Point the focus ring at `--boda-color-focus`.
- Update `index.html` / manifest `theme_color` and `background_color` to `#E9E9E4`.
- Add `@phosphor-icons/react` only when the first icon is needed.
- Document "Make it your own → colours, players, seasons" in the README (edit config, run `npm run tokens`).

**Acceptance criteria**
1. **Tokens compile.** `npm run tokens` (= `node scripts/build-tokens.mjs --out src/styles`, Node ≥ 18, no dependencies) regenerates `tokens.json`, `tokens.css` and `tailwind.theme.css` with no diff against what's committed. `tokens.json` parses as JSON and `npx style-dictionary@4 build --config sd.config.mjs` succeeds. `tokens.css` passes `npx lightningcss-cli` and compiles under Tailwind v4 if Tailwind is adopted.
2. **Themes swap via one config value.** Changing only `activeSeason` in `config/boda.theme.json` (to any of `scouting-mexico-city`, `vendors-planner`, `family-guests`, `toast-vows`) and rebuilding changes the `:root` season tokens. Setting `<html data-season>` swaps at runtime with no other code change. An unknown id fails the build.
3. **Contrast passes WCAG AA everywhere, or the build fails.** Every text/background pair in all 4 seasons × light and dark meets 4.5:1, and UI lines and fills meet 3:1. `npm run tokens` exits non-zero on any failure, and CI runs it. Currently: 568 pairs, 0 failures, lowest text 4.58:1, lowest UI 3.26:1.
4. **Tap targets ≥ 44px from the spacing scale.** `--boda-size-tap-min` = `--boda-space-11` = 44px, `--boda-size-nav` = `--boda-space-13` = 52px, `--boda-size-control` = `--boda-space-14` = 56px. The build fails if any `size.*` token is under 44px. Every button, link and tab in PR #1 uses `min-height: var(--boda-size-tap-min)` or larger.
5. iPhone screenshots in the PR show light and dark, plus one non-default season, with no Outfit, Fraunces, cream background or terracotta-on-cream chrome left.

**Out of scope**
- Redesigning the screens themselves: the home layout from `home-plan.md` (season wall, 128px score, steel-window panes) is a separate ticket.
- A native app / TestFlight theme, and an Android-specific theme.
- Custom pictograms (season marks, win mark), the app icon and splash: separate design ticket.
- Shipping venue photography: the reference photos are copyrighted and internal only. Real season photos will come from Rem and Shannon's Dec 9–13 trip.
- Migrating PR #1 to Tailwind. The v4 snippet is ready, but adopting Tailwind is its own decision.

**Decided:** Shannon's colour is ochre `#A36909` (text `#835300`, dark `#D08812`), replacing terracotta. See §4.

**Resolved (PM, REM-22):** season ids use the live Supabase `seasons` table ids (`scouting-mexico-city`, `vendors-planner`, `family-guests`, `toast-vows`), so no data migration is needed. Display labels are unchanged.

**Open design questions (Rem)**
1. Is the cool plaster background (`#E9E9E4`) warm enough for "warm, celebratory"? The warmth currently lives in gold, bugambilia, brick and the season photos.
2. In dark mode the iron button flips to plaster (`#EEEBE3`). OK, or keep it dark with an outline?
3. Should Season 4 (Toast & Vows) get its own serif moment (e.g. vows set in Alegreya), or keep one serif line per screen everywhere?

## 10. Changes vs v0.2

- **Season keys aligned with the live Supabase `seasons` table** (PM decision, REM-22): `scouting-cdmx` → `scouting-mexico-city`. `vendors-planner`, `family-guests` and `toast-vows` match v0.2. The interim long-form ids from the first v1 draft are retired. English and Spanish labels are both in config. Added `activeSeason` as the single theme switch.
- **Players:** `mark` → `shape` (circle / diamond), plus a new `pattern` (solid / hatch) in config and tokens.
- **Type tokens realigned to the v0.2 mock:** the stale v0 styles (display/score in a serif) are replaced by Archivo styles with width tokens (`stretch-score` 62%, `stretch-season` 75%) and one serif `invitation` style. New `label` style.
- **Spacing:** added `9` (36), `11` (44), `13` (52), `14` (56). New `size.tap-min` / `nav` / `control` reference them, and the build gates them at ≥ 44px.
- **Radius:** removed `pill` (and the `lg`/`tile` aliases). Now none 0 / sm 2 / md 4.
- **Shadows:** sm/md/lg removed. One `overlay` shadow only.
- **Contrast gate:** now runs per season × mode (568 pairs, was 162), adds PR-compat pairs and the tap-size gate, and fails on an unknown `activeSeason`.
- **CSS:** added the PR #1 alias block, `--boda-color-primary` / `on-primary` / `accent` roles, player shape/pattern vars, and the `--boda-stretch-*` / `--boda-family-*` per-style vars. Season-name comments are now English / Spanish.
- **Tailwind:** v4 `@theme` regenerated (new `font-serif`, `h-control`, `stretch-*` utilities). The v3 preset is retired (moved to `v0.2/`) since nothing uses Tailwind v3.
- **Shannon's colour: terracotta → ochre.** `player-b` light fill `#AD4309` → `#A36909`, text `#A23E07` → `#835300`, soft `#FBE5D6` → `#FEE9D0`. Dark: fill/text `#FFA668` → `#D08812`, on `#331503` → `#1C1200`, soft `#3D2416` → `#33261A`. Every other colour value carries over from v0.2 unchanged.

---

## Appendix A: `scripts/build-tokens.mjs` (zero-dependency build + AA gate)
```js
#!/usr/bin/env node
// Boda design tokens v1 build.
//   in:  config/boda.theme.json  (couple-specific: players, seasons, activeSeason, brand roles)
//   out: tokens.json (DTCG / Style Dictionary v4 format), tokens.css, tailwind.theme.css,
//        contrast-report.md, contrast.json
// Exits 1 if any text pair is below WCAG AA (4.5:1) or UI pair below 3:1, in ANY season x mode,
// or if a tap-target size token is below 44px.
import fs from 'node:fs';
import path from 'node:path';
// usage: node build-tokens.mjs [--config config/boda.theme.json] [--out .]   (paths relative to cwd)
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const CONFIG = arg('--config', 'config/boda.theme.json'), OUT = arg('--out', '.');
fs.mkdirSync(OUT, { recursive: true });
const out = f => path.join(OUT, f);
const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const seasonIds = cfg.seasons.map(s => s.id);
if (!seasonIds.includes(cfg.activeSeason)) { console.error(`activeSeason "${cfg.activeSeason}" is not one of ${seasonIds.join(', ')}`); process.exit(1); }

// ---------- Base system (shared by every season) ----------
const neutrals = {
  light: { bg: '#E9E9E4', surface: '#F4F4F0', 'surface-sunken': '#DADAD3', border: '#BBBBB2', 'border-strong': '#74746B', text: '#1A1C19', 'text-muted': '#55564E', focus: '#1D4FA3' },
  dark:  { bg: '#121411', surface: '#1B1E1A', 'surface-sunken': '#242823', border: '#343A33', 'border-strong': '#858A7E', text: '#EEEBE3', 'text-muted': '#ABA79A', focus: '#8DB1F7' },
};
const feedback = {
  correct: { light: { fill: '#13735E', on: '#FFFFFF', text: '#0F6A56', soft: '#DDF1EA' }, dark: { fill: '#13735E', on: '#FFFFFF', text: '#6FD3B5', soft: '#123029' } },
  wrong:   { light: { fill: '#B3261E', on: '#FFFFFF', text: '#B3261E', soft: '#FBE3E0' }, dark: { fill: '#C2372E', on: '#FFFFFF', text: '#FF9B91', soft: '#3D1A17' } },
};
const why = {
  bg: 'Cool lime plaster sampled from the steel-corridor photo at Casa de la Bola; deliberately not the cream AI default.',
  surface: 'One step lighter plaster for the solid nav and sheets; no cards.',
  'surface-sunken': 'Cantera paving tone for empty window panes.',
  border: 'Plaster seam; decorative only (not relied on for meaning).',
  'border-strong': 'Weathered stone; the lowest-contrast line that still meets 3:1 for UI.',
  text: 'Iron-black with a green cast, from the steel frames, not pure black.',
  'text-muted': 'Mortar grey for secondary sentences; passes AA on every ground.',
  focus: 'Talavera cobalt ring; visible on plaster and steel-night.',
  ink: 'Hierro forjado: the black steel frames both venues share; the one primary action.',
  brand: 'Bugambilia from CASO\'s walls; wordmark and rare brand moments only.',
  celebrate: 'Luz de vela / cempasúchil: candle-glow gold that means a win and nothing else.',
  correct: 'Jade pushed toward blue so it separates from red for deuteranopes; always with ✓.',
  wrong: 'Chile red; always with ✕.',
  'player-a': 'Rem: talavera cobalt + filled circle.',
  'player-b': 'Shannon: ocre (CASO mustard velvet) + diamond + hatch; blue vs ochre stays 22+ apart in every colour-vision simulation.',
};
const fonts = {
  sans: { value: "'Archivo Variable', 'Archivo', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", why: 'Archivo (Omnibus-Type, Google Fonts, OFL): grotesque with a width axis, condensed for scores and signage, normal for reading; tabular figures; full Spanish set.' },
  serif: { value: "'Alegreya', Georgia, 'Times New Roman', serif", why: 'Alegreya (Huerta Tipográfica, Google Fonts, OFL): built for Spanish text; used for ONE invitation line per screen, never italic.' },
};
// [px, line-height, weight, tracking(em), stretch(%), family]
const type = {
  caption:    [12, 1.33, 500, 0, 100, 'sans'],
  'body-sm':  [14, 1.43, 400, 0, 100, 'sans'],
  body:       [16, 1.5, 400, 0, 100, 'sans'],
  'body-lg':  [18, 1.45, 400, 0, 100, 'sans'],
  label:      [15, 1.3, 600, 0, 100, 'sans'],
  title:      [20, 1.3, 600, 0, 100, 'sans'],
  headline:   [24, 1.2, 700, -0.005, 100, 'sans'],
  invitation: [31, 1.1, 500, 0, 100, 'serif'],
  season:     [32, 1.0, 700, -0.01, 75, 'sans'],
  score:      [128, 0.86, 800, -0.02, 62, 'sans'],
};
const space = { 0: 0, px: 1, '0.5': 2, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 13: 52, 14: 56, 16: 64, 20: 80 };
const size = { // all interactive sizes are space-scale references; build fails if any is < 44px
  'tap-min': ['11', 'Apple HIG / WCAG 2.5.5 minimum: every tappable thing is at least this tall and wide.'],
  nav: ['13', 'Bottom tab height (before the safe-area inset).'],
  control: ['14', 'Primary iron button height, in the thumb zone.'],
};
const radius = { none: [0, 'Default: steel frames, panes, the season wall, the CTA.'], sm: [2, 'Inputs, so the caret area reads as a field.'], md: [4, 'Sheets and dialogs only.'] };
const shadow = { light: 'none', dark: 'none', overlay: '0 24px 48px -24px rgb(18 20 17 / 0.45)' };
const motion = {
  duration: { instant: 80, fast: 150, base: 240, slow: 400, celebrate: 900 },
  easing: { standard: [0.2, 0, 0, 1], decelerate: [0.05, 0.7, 0.1, 1], accelerate: [0.3, 0, 0.8, 0.15], spring: [0.34, 1.56, 0.64, 1] },
};

// ---------- colour math ----------
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = hex2rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const oklab = v => { const [r, g, b] = v.map(x => Math.min(1, Math.max(0, x)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
const sim = (h, M) => { const v = hex2rgb(h).map(lin); return M ? M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]) : v; };
const dE = (a, b, M) => { const [p, q] = [oklab(sim(a, M)), oklab(sim(b, M))]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 100; };

// ---------- semantic palette per mode ----------
const [pa, pb] = cfg.players;
const roleSrc = mode => ({ ink: cfg.ink[mode], brand: cfg.brand[mode], celebrate: cfg.celebrate[mode], correct: feedback.correct[mode], wrong: feedback.wrong[mode], 'player-a': pa[mode], 'player-b': pb[mode] });
function palette(mode) {
  const c = { ...neutrals[mode] };
  for (const [r, v] of Object.entries(roleSrc(mode))) { c[r] = v.fill; c[`on-${r}`] = v.on; c[`${r}-text`] = v.text; c[`${r}-soft`] = v.soft; }
  return c;
}
const pal = { light: palette('light'), dark: palette('dark') };
const seasonVars = a => ({ season: a.fill, 'on-season': a.on, 'season-text': a.text, 'season-soft': a.soft });

// ---------- checks: every season x every mode ----------
const checks = [];
const add = (theme, mode, fg, fgHex, bg, bgHex, min, kind) => checks.push({ theme, mode, fg, bg, fgHex, bgHex, ratio: +ratio(fgHex, bgHex).toFixed(2), min, kind });
for (const s of cfg.seasons) for (const mode of ['light', 'dark']) {
  const c = { ...pal[mode], ...seasonVars(s[mode]) };
  const grounds = ['bg', 'surface', 'surface-sunken'];
  const textRoles = ['text', 'text-muted', 'ink-text', 'brand-text', 'celebrate-text', 'correct-text', 'wrong-text', 'player-a-text', 'player-b-text', 'season-text'];
  for (const g of grounds) {
    for (const t of textRoles) add(s.id, mode, t, c[t], g, c[g], 4.5, 'text');
    // the season wall is a decorative plane, not a UI component (WCAG 1.4.11); its text is checked as on-season
    for (const u of ['border-strong', 'focus', 'player-a', 'player-b', 'ink']) add(s.id, mode, u, c[u], g, c[g], 3, 'ui');
  }
  for (const r of ['ink', 'brand', 'celebrate', 'correct', 'wrong', 'player-a', 'player-b', 'season']) {
    add(s.id, mode, `on-${r}`, c[`on-${r}`], r, c[r], 4.5, 'text');
    add(s.id, mode, `${r}-text`, c[`${r}-text`], `${r}-soft`, c[`${r}-soft`], 4.5, 'text');
    add(s.id, mode, 'text', c.text, `${r}-soft`, c[`${r}-soft`], 4.5, 'text');
  }
  // PR #1 compatibility pairs: it paints var(--on-primary) text on var(--correct) / var(--incorrect)
  add(s.id, mode, 'on-ink (PR --on-primary)', c['on-ink'], 'correct-text (PR --correct)', c['correct-text'], 4.5, 'text');
  add(s.id, mode, 'on-ink (PR --on-primary)', c['on-ink'], 'wrong-text (PR --incorrect)', c['wrong-text'], 4.5, 'text');
}
const fails = checks.filter(x => x.ratio < x.min);
const sizeFails = Object.entries(size).filter(([, [k]]) => space[k] < 44);
const cvd = [], cw = [];
for (const mode of ['light', 'dark']) for (const t of [null, 'protan', 'deutan', 'tritan']) {
  cvd.push({ mode, vision: t || 'typical', dE: +dE(pa[mode].fill, pb[mode].fill, t && CVD[t]).toFixed(1) });
  cw.push({ mode, vision: t || 'typical', dE: +dE(feedback.correct[mode].fill, feedback.wrong[mode].fill, t && CVD[t]).toFixed(1) });
}

// ---------- tokens.json (DTCG; Style Dictionary v4 reads it as-is) ----------
const tok = (type, value, description) => ({ $type: type, $value: value, ...(description ? { $description: description } : {}) });
const colorGroup = mode => Object.fromEntries(Object.entries(pal[mode]).map(([k, v]) => [k, tok('color', v, mode === 'light' ? (why[k] || why[k.replace(/^on-|-text$|-soft$/g, '')] && undefined) ?? why[k] : undefined)]));
const tokens = {
  $description: 'Boda design tokens v1. GENERATED by build-tokens.mjs from config/boda.theme.json; edit the config, not this file.',
  color: { light: colorGroup('light'), dark: colorGroup('dark') },
  season: Object.fromEntries(cfg.seasons.map(s => [s.id, {
    $description: `${s.nameEn} (${s.nameEs}), ${s.accentName}. Overrides only the four season colour tokens.`,
    light: Object.fromEntries(Object.entries(seasonVars(s.light)).map(([k, v]) => [k, tok('color', v)])),
    dark: Object.fromEntries(Object.entries(seasonVars(s.dark)).map(([k, v]) => [k, tok('color', v)])),
  }])),
  player: Object.fromEntries(cfg.players.map(p => [p.slot, {
    $description: `${p.name}: ${p.colorName}. Identity = colour + shape + pattern; never colour alone.`,
    id: { $value: p.id }, name: { $value: p.name }, initial: { $value: p.initial }, shape: { $value: p.shape }, pattern: { $value: p.pattern },
  }])),
  font: {
    family: { sans: tok('fontFamily', fonts.sans.value, fonts.sans.why), serif: tok('fontFamily', fonts.serif.value, fonts.serif.why) },
    style: Object.fromEntries(Object.entries(type).map(([k, [px, lh, w, tr, st, fam]]) => [k, tok('typography', { fontFamily: `{font.family.${fam}}`, fontSize: `${px}px`, lineHeight: lh, fontWeight: w, letterSpacing: `${tr}em`, fontStretch: `${st}%` })])),
  },
  space: Object.fromEntries(Object.entries(space).map(([k, v]) => [k, tok('dimension', `${v}px`)])),
  size: Object.fromEntries(Object.entries(size).map(([k, [ref, d]]) => [k, tok('dimension', `{space.${ref}}`, d)])),
  radius: Object.fromEntries(Object.entries(radius).map(([k, [v, d]]) => [k, tok('dimension', `${v}px`, d)])),
  shadow: { overlay: tok('shadow', shadow.overlay, 'The only shadow: sheets over content. Everything else is flat, grouped by type and iron rules.') },
  motion: {
    duration: Object.fromEntries(Object.entries(motion.duration).map(([k, v]) => [k, tok('duration', `${v}ms`)])),
    easing: Object.fromEntries(Object.entries(motion.easing).map(([k, v]) => [k, tok('cubicBezier', v)])),
    'reduced-duration': tok('duration', '1ms', 'Every duration collapses to this under prefers-reduced-motion: state still changes, nothing travels.'),
  },
  'safe-area': Object.fromEntries(['top', 'right', 'bottom', 'left'].map(s => [s, { $value: `env(safe-area-inset-${s}, 0px)`, $description: 'iOS notch / home indicator; needs viewport-fit=cover.' }])),
};
// drop undefined descriptions
const clean = o => JSON.parse(JSON.stringify(o));

// ---------- tokens.css ----------
const P = '--boda';
const cv = (c, ind = '  ') => Object.entries(c).map(([k, v]) => `${ind}${P}-color-${k}: ${v};`).join('\n');
const sv = (a, ind = '  ') => cv(seasonVars(a), ind);
const active = cfg.seasons.find(s => s.id === cfg.activeSeason);
const pxr = v => (v === 0 ? '0' : `${v / 16}rem`);
const css = `/* Boda design tokens v1. GENERATED by build-tokens.mjs from config/boda.theme.json. Do not edit by hand.
   Theme switch: ONE value, config.activeSeason ("${cfg.activeSeason}"), which is also the :root default.
   At runtime: document.documentElement.dataset.season = activeSeason. Optional data-theme="light|dark" overrides the OS. */

:root {
  color-scheme: light dark;

  /* colour: light (base) */
${cv(pal.light)}

  /* season: default = activeSeason (${active.nameEn}) */
${sv(active.light)}

  /* roles */
  ${P}-color-primary: var(${P}-color-ink);
  ${P}-color-on-primary: var(${P}-color-on-ink);
  ${P}-color-accent: var(${P}-color-season-text);

  /* type: Archivo (sans) + Alegreya (serif, one line per screen) */
  ${P}-font-sans: ${fonts.sans.value};
  ${P}-font-serif: ${fonts.serif.value};
${Object.entries(type).map(([k, [px, lh, w, tr, st, fam]]) => `  ${P}-text-${k}: ${pxr(px)};\n  ${P}-leading-${k}: ${lh};\n  ${P}-weight-${k}: ${w};\n  ${P}-tracking-${k}: ${tr}em;\n  ${P}-stretch-${k}: ${st}%;\n  ${P}-family-${k}: var(${P}-font-${fam});`).join('\n')}

  /* space (4pt) */
${Object.entries(space).map(([k, v]) => `  ${P}-space-${String(k).replace('.', '_')}: ${k === 'px' ? '1px' : pxr(v)};`).join('\n')}

  /* sizes (tap targets) */
${Object.entries(size).map(([k, [ref]]) => `  ${P}-size-${k}: var(${P}-space-${ref});`).join('\n')}

  /* radius */
${Object.entries(radius).map(([k, [v]]) => `  ${P}-radius-${k}: ${v}px;`).join('\n')}

  /* elevation */
  ${P}-shadow-overlay: ${shadow.overlay};

  /* motion */
${Object.entries(motion.duration).map(([k, v]) => `  ${P}-duration-${k}: ${v}ms;`).join('\n')}
${Object.entries(motion.easing).map(([k, v]) => `  ${P}-ease-${k}: cubic-bezier(${v.join(', ')});`).join('\n')}

  /* iOS safe areas */
${['top', 'right', 'bottom', 'left'].map(s => `  ${P}-safe-${s}: env(safe-area-inset-${s}, 0px);`).join('\n')}

  /* player identity (shape/pattern names for components; colours above) */
${cfg.players.map(p => `  ${P}-player-${p.slot}-shape: ${p.shape};\n  ${P}-player-${p.slot}-pattern: ${p.pattern};`).join('\n')}
}

/* seasons: each overrides only the four season colours */
${cfg.seasons.map(s => `:root[data-season="${s.id}"] { /* ${s.nameEn} / ${s.nameEs}: ${s.accentName} */\n${sv(s.light)}\n}`).join('\n')}

/* dark: follows the OS unless data-theme="light" */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${cv(pal.dark, '    ')}
${sv(active.dark, '    ')}
  }
${cfg.seasons.map(s => `  :root:not([data-theme="light"])[data-season="${s.id}"] {\n${sv(s.dark, '    ')}\n  }`).join('\n')}
}
:root[data-theme="dark"] {
${cv(pal.dark)}
${sv(active.dark)}
}
${cfg.seasons.map(s => `:root[data-theme="dark"][data-season="${s.id}"] {\n${sv(s.dark)}\n}`).join('\n')}

/* reduced motion: state changes stay, travel/flip/confetti go */
@media (prefers-reduced-motion: reduce) {
  :root {
${Object.keys(motion.duration).map(k => `    ${P}-duration-${k}: 1ms;`).join('\n')}
    ${P}-ease-spring: linear;
  }
}

/* compatibility with REM-5 / PR #1 (src/config/app.config.ts -> CSS vars). Remove once components use --boda-* */
:root {
  --background: var(${P}-color-bg);
  --surface: var(${P}-color-surface);
  --ink: var(${P}-color-text);
  --muted: var(${P}-color-text-muted);
  --primary: var(${P}-color-ink);
  --on-primary: var(${P}-color-on-ink);
  --accent: var(${P}-color-season-text);
  --gold: var(${P}-color-celebrate);
  --line: var(${P}-color-border);
  --correct: var(${P}-color-correct-text);
  --correct-bg: var(${P}-color-correct-soft);
  --incorrect: var(${P}-color-wrong-text);
  --incorrect-bg: var(${P}-color-wrong-soft);
}
`;

// ---------- Tailwind v4 ----------
const twColors = [...Object.keys(pal.light), 'season', 'on-season', 'season-text', 'season-soft', 'primary', 'on-primary', 'accent'];
const tw = `/* Tailwind v4 bridge. GENERATED. In your CSS entry:
   @import "tailwindcss"; @import "./tokens.css"; @import "./tailwind.theme.css";
   Utilities: bg-bg, text-text-muted, bg-ink text-on-ink, bg-season, text-player-b-text, text-score, font-serif, rounded-none, min-h-tap, pb-safe ... */
@theme inline {
${twColors.map(k => `  --color-${k}: var(${P}-color-${k});`).join('\n')}
  --font-sans: var(${P}-font-sans);
  --font-serif: var(${P}-font-serif);
${Object.keys(type).map(k => `  --text-${k}: var(${P}-text-${k});\n  --text-${k}--line-height: var(${P}-leading-${k});\n  --text-${k}--letter-spacing: var(${P}-tracking-${k});\n  --text-${k}--font-weight: var(${P}-weight-${k});`).join('\n')}
  --spacing: 0.25rem;
${Object.keys(radius).map(k => `  --radius-${k}: var(${P}-radius-${k});`).join('\n')}
  --shadow-overlay: var(${P}-shadow-overlay);
${Object.keys(motion.easing).map(k => `  --ease-${k}: var(${P}-ease-${k});`).join('\n')}
}
@utility min-h-tap { min-height: var(${P}-size-tap-min); }
@utility min-w-tap { min-width: var(${P}-size-tap-min); }
@utility h-control { height: var(${P}-size-control); }
@utility pt-safe { padding-top: var(${P}-safe-top); }
@utility pb-safe { padding-bottom: var(${P}-safe-bottom); }
@utility stretch-score { font-stretch: var(${P}-stretch-score); }
@utility stretch-season { font-stretch: var(${P}-stretch-season); }
`;

// ---------- report ----------
const tx = checks.filter(c => c.kind === 'text'), ui = checks.filter(c => c.kind === 'ui');
const low = arr => arr.reduce((m, c) => (c.ratio < m.ratio ? c : m));
const lt = low(tx), lu = low(ui);
const perTheme = cfg.seasons.flatMap(s => ['light', 'dark'].map(m => { const a = checks.filter(c => c.theme === s.id && c.mode === m); return { theme: s.id, mode: m, pairs: a.length, fails: a.filter(c => c.ratio < c.min).length, minText: low(a.filter(c => c.kind === 'text')), minUi: low(a.filter(c => c.kind === 'ui')) }; }));
const summary = { pairs: checks.length, failures: fails.length, lowestText: lt, lowestUi: lu, perTheme, cvd, correctWrong: cw, sizeFails: sizeFails.length };
const report = `# Boda contrast report v1 (generated)

${checks.length} pairs checked (${cfg.seasons.length} seasons x light/dark) · ${fails.length} failures
Lowest text: ${lt.ratio}:1 (${lt.fg} ${lt.fgHex} on ${lt.bg} ${lt.bgHex}, ${lt.theme}/${lt.mode}) · Lowest UI: ${lu.ratio}:1 (${lu.fg} ${lu.fgHex} on ${lu.bg} ${lu.bgHex})

| theme | mode | pairs | failures | lowest text | lowest UI |
|---|---|---|---|---|---|
${perTheme.map(p => `| ${p.theme} | ${p.mode} | ${p.pairs} | ${p.fails} | ${p.minText.ratio} (${p.minText.fg} on ${p.minText.bg}) | ${p.minUi.ratio} (${p.minUi.fg} on ${p.minUi.bg}) |`).join('\n')}

## All pairs
| theme | mode | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
${checks.map(c => `| ${c.theme} | ${c.mode} | ${c.fg} ${c.fgHex} | ${c.bg} ${c.bgHex} | ${c.ratio} | ${c.min} | ${c.ratio >= c.min ? 'pass' : '**FAIL**'} |`).join('\n')}
`;

// one token per line keeps the file reviewable; still plain JSON
const fmt = (o, ind = '') => {
  if (o === null || typeof o !== 'object' || Array.isArray(o) || '$value' in o) return JSON.stringify(o);
  const n = ind + '  ';
  return '{\n' + Object.entries(o).map(([k, v]) => `${n}${JSON.stringify(k)}: ${fmt(v, n)}`).join(',\n') + `\n${ind}}`;
};
fs.writeFileSync(out('tokens.json'), fmt(clean(tokens)) + '\n');
fs.writeFileSync(out('tokens.css'), css);
fs.writeFileSync(out('tailwind.theme.css'), tw);
fs.writeFileSync(out('contrast-report.md'), report);
fs.writeFileSync(out('contrast.json'), JSON.stringify({ summary, checks }, null, 2));
console.log(`checked ${checks.length} pairs across ${perTheme.length} theme/mode combos, ${fails.length} failures; lowest text ${lt.ratio}, lowest UI ${lu.ratio}; tap sizes ${sizeFails.length ? 'FAIL' : 'ok'}`);
for (const f of fails) console.log(`FAIL ${f.theme}/${f.mode} ${f.fg} ${f.fgHex} on ${f.bg} ${f.bgHex}: ${f.ratio} < ${f.min}`);
for (const [k] of sizeFails) console.log(`FAIL size.${k} < 44px`);
process.exit(fails.length || sizeFails.length ? 1 : 0);
```
