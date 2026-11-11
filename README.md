# boda

[![CI](https://github.com/rembaumann/boda/actions/workflows/ci.yml/badge.svg)](https://github.com/rembaumann/boda/actions/workflows/ci.yml)

A small installable web app for practicing Mexican Spanish. Two people pick their names, play the same daily set, and race to a season score. Practice sets still work on one phone with no account.

The interface is built for iPhone Safari, including a Home Screen icon that opens full screen.

## Setup

You need Node.js 22 or newer.

```bash
npm install
```

Copy [`.env.example`](.env.example) to `.env.local` when you want the shared scoreboard. The app runs without those variables: practice works, and a daily duel stays on that phone until Supabase is configured. Vite reads the variables at build time, so restart `npm run dev` after changing them.

## Local dev

```bash
npm run dev
```

Open the URL Vite prints. On an iPhone, use the same Wi-Fi and the network address, then Share → Add to Home Screen. The Home Screen icon opens without Safari’s toolbar.

Speech uses the Web Speech API. Tap **Hear it** or **Tap to listen** — iOS only speaks after a tap. The app asks for an `es-MX` voice and, if the phone doesn’t have one, any Spanish voice.

Other checks:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Running tests

GitHub Actions runs the same checks on every pull request and every push to `main`: install, lint, typecheck, unit tests, a production build, and one end-to-end smoke test.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` is the Vitest unit suite and does not need a browser. `npm run test:e2e` is Playwright. It serves the production build, so run `npm run build` first. The smoke tests use a 393×852 viewport. One finishes a practice set. The other plays today's duel, checks the share grid, and returns to the scoreboard. `npx playwright install chromium` downloads the browser once. On Linux, `npx playwright install --with-deps chromium` also installs the system libraries Chromium needs. The smoke tests do not call Supabase.

## Deploy to Vercel

The app is a static Vite build. Vercel detects that with no project settings to fill in.

1. Push the repository to GitHub.
2. In Vercel, import the repository.
3. Leave the framework preset on Vite. Build command: `npm run build`. Output directory: `dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from [`.env.example`](.env.example). Use the anon public key, never the service role key. Redeploy after changing them, because Vite bakes them into the build.

`vercel.json` only tells Vercel not to cache the service worker or the manifest, so an update can replace the installed copy. After the first online visit, the service worker keeps the drills available offline.

## Make it your own

Nothing about a particular couple is written into the screens. Edit the files below, then restart `npm run dev`.

### App, players, and seasons

[`src/config/app.config.ts`](src/config/app.config.ts) holds:

- App name, short name, tagline, and description. The document title, Home Screen label, and theme color are filled from this file at build time, so you don’t edit `index.html` for those.
- Colors. They become CSS variables. Icons in `public/` are separate images; replace them if you recolor the app (`node scripts/generate-icons.mjs` redraws the PNGs from the SVGs and needs the `sharp` package installed).
- `voice.locale` (default `es-MX`) and `voice.fallbackLanguage` (default `es`).
- `calendar.timeZone` — the IANA zone both phones use for “today”, so the daily set rolls over at the same local midnight.
- `session.questionsPerSet` — how many questions are in one practice set and in one daily duel.
- `session.seasonPointsTarget` — the season score a duel races to. The default is 21. First player to that many daily wins takes the season.
- `session.difficultyMix` — relative weights for easy, medium, and hard phrases in a set.
- `players` — id, display name, a short note, and a question-type mix. The mix is three relative weights: `multipleChoice`, `typeAnswer`, and `listen`. They don’t have to sum to 10. A more experienced player should carry more `typeAnswer` weight. A beginner should carry more `multipleChoice` weight. The home screen shows the resulting counts. There is no password: each person taps their name.
- `seasons` — id, theme, `deckFile` (the JSON file name without `.json`, or `null` until that deck exists), and `order`. The default list is Scouting Trip, Vendors & Planner, Family & Guests, then Toast & Vows. After the last theme, the next season starts again at the first theme.
- `storageKey` — the localStorage key, so two forks on one phone don’t overwrite each other.

Player ids in the config have to match a row in the migration's `players` table: lowercase letters, digits, and hyphens. If you change player ids, player names, season ids, or themes before applying the migration, edit the `insert into public.players` and `insert into public.seasons` rows in that file so they match. The app reads player names, themes, and the points target from this config, not from the database.

### Phrase decks

Add a season by dropping a JSON file in [`src/content/decks/`](src/content/decks/) and pointing a season’s `deckFile` at it. Each phrase needs:

| Field | Meaning |
| --- | --- |
| `id` | Stable id. Later review history keys off this. |
| `es` | Spanish, in the register you want to learn. |
| `en` | English. Keep it unique in the deck so multiple choice has one answer. |
| `pronunciation` | Optional hint, such as `keh PAH-dreh`. |
| `difficulty` | `1`, `2`, or `3`. |
| `category` | One of `greetings`, `restaurants`, `venues`, `getting-around`, `polite`. |
| `needsNativeReview` | `true` when the line is idiomatic, regional, or you aren’t sure a local would say it. |

Category labels live in [`src/content/categories.ts`](src/content/categories.ts). Adding a new category also means adding it to `CATEGORIES` in [`src/domain/types.ts`](src/domain/types.ts).

Season 1 is a Mexico City scouting trip: venues, restaurants, taxis, and the polite phrases you need with staff. It uses **ustedes** and Mexican vocabulary, not Spain Spanish. The later season themes are in the config so the race can move on, and their decks are not in the repo yet. Until a season's `deckFile` is set, that season shows on the scoreboard and the daily duel waits. Practice keeps using a season that has a deck.

## How practice works

A set is 10 questions, drawn with the selected player’s mix and the difficulty mix.

1. **Multiple choice.** Spanish prompt with English choices, or the reverse. Four options. Distractors come from the same category when the deck has enough.
2. **Type the answer.** English prompt, Spanish answer. Grading ignores accents, capitalization, extra spaces, and punctuation, including `¿` and `¡`. `ñ` still has to be right. A close answer counts, and the screen always shows the exact spelling.
3. **Listen and pick.** Tap to hear the phrase, then choose the Spanish line you heard.

Every question has a speaker control. Feedback is immediate, and the set ends on a summary. Finished sets are saved in localStorage under the storage key: the last 20 sessions, plus per-phrase seen/correct counts.

## How the daily duel works

Pick a player on the home screen. **Play today's duel** builds one shared set for the calendar date and the active season.

The phrase ids are the same for both players. They come from the active season's deck, the difficulty mix, and a seed of the date plus the season, via `buildDailyDuel` in [`src/lib/daily.ts`](src/lib/daily.ts). Each player then gets their own drill mix from the config, so a beginner sees more multiple choice and a more experienced player types more answers. Refreshing does not draw a new set.

The day is decided in [`src/lib/scoring.ts`](src/lib/scoring.ts). Higher accuracy wins. If accuracy matches, the faster elapsed time wins. Time starts when the set opens and stops when the last answer is submitted. An exact tie awards no point. Every configured player has to finish that calendar day; a day that never gets a full set of results awards no point. The winner gets 1 season point.

When a player's season points reach `seasonPointsTarget`, that player wins the season, both scores go back to zero, and the next theme becomes the active season. Season wins are the trophy count. The same rows produce the same board on both phones.

After a duel, the summary shows a Wordle-style grid (green for right, black for a miss) and copies it without the phrases. Practice does not add a season point. A duel does update the on-phone practice history.

The shared board is Supabase. [`supabase/migrations`](supabase/migrations) creates `players`, `seasons`, and `daily_results`. Row level security lets the anon key read those tables and insert a result only for a player in the allowlist, when the other fields match the checks (one row per player per day, marks that match the score, a sane elapsed time). Anon cannot add a player, and cannot update or delete. The app subscribes to new results and also reloads when the phone comes back to the foreground.

Without the env vars, the scoreboard says the duel is only on that phone. With a bad or missing migration, the duel waits and practice still runs.

### Apply the migration

Do this once, in the Boda project (`pkxgryaycnwpktsafodk`). The repo does not apply it for you.

1. Open the Supabase SQL editor for that project.
2. Paste [`supabase/migrations/20261111152507_daily_duel.sql`](supabase/migrations/20261111152507_daily_duel.sql) and run it.
   Or, with the Supabase CLI: `supabase link --project-ref pkxgryaycnwpktsafodk`, then `supabase db push`.
3. In Project Settings, copy the project URL and the anon public key (or the publishable key). Leave the service role key on the server.
4. Locally, put them in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. In Vercel, set those same two variables for Production, then redeploy. A new deploy is required because the values are compiled into the static build.

## What this version leaves open

Spaced repetition and streaks are still unused. Each phrase stat has `ease`, `intervalDays`, and `nextDueOn`. New phrases start at ease `2.5` and a due date of null. Practice and duels update seen/correct counts and leave the schedule fields alone, including a schedule a future version has already written. `streak` stays at zero until something else updates it.

## License

[MIT](LICENSE).
