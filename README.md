# boda

A small installable web app for practicing Mexican Spanish. Two people can each run a 10-question set, with a harder mix for the more experienced player. This version is single-player and stores progress on the phone. Daily duels and a shared scoreboard come later.

The interface is built for iPhone Safari, including a Home Screen icon that opens full screen.

## Setup

You need Node.js 22 or newer.

```bash
npm install
```

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

## Deploy to Vercel

The app is a static Vite build. Vercel detects that with no project settings to fill in.

1. Push the repository to GitHub.
2. In Vercel, import the repository.
3. Leave the framework preset on Vite. Build command: `npm run build`. Output directory: `dist`.
4. There are no environment variables.

`vercel.json` only tells Vercel not to cache the service worker or the manifest, so an update can replace the installed copy. After the first online visit, the service worker keeps the drills available offline.

## Make it your own

Nothing about a particular couple is written into the screens. Edit the files below, then restart `npm run dev`.

### App, players, and seasons

[`src/config/app.config.ts`](src/config/app.config.ts) holds:

- App name, short name, tagline, and description. The document title, Home Screen label, and theme color are filled from this file at build time, so you don’t edit `index.html` for those.
- Colors. They become CSS variables. Icons in `public/` are separate images; replace them if you recolor the app (`node scripts/generate-icons.mjs` redraws the PNGs from the SVGs and needs the `sharp` package installed).
- `voice.locale` (default `es-MX`) and `voice.fallbackLanguage` (default `es`).
- `session.questionsPerSet` — how many questions are in one practice set, and later in one daily duel.
- `session.seasonPointsTarget` — the season score a duel will race to. It is shown on the home screen now and not scored yet.
- `session.difficultyMix` — relative weights for easy, medium, and hard phrases in a set.
- `players` — id, display name, a short note, and a question-type mix. The mix is three relative weights: `multipleChoice`, `typeAnswer`, and `listen`. They don’t have to sum to 10. A more experienced player should carry more `typeAnswer` weight. A beginner should carry more `multipleChoice` weight. The home screen shows the resulting counts.
- `seasons` — id, theme, `deckFile` (the JSON file name without `.json`), and `order`.
- `storageKey` — the localStorage key, so two forks on one phone don’t overwrite each other.

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

Season 1 is a Mexico City scouting trip: venues, restaurants, taxis, and the polite phrases you need with staff. It uses **ustedes** and Mexican vocabulary, not Spain Spanish.

## How practice works

A set is 10 questions, drawn with the selected player’s mix and the difficulty mix.

1. **Multiple choice.** Spanish prompt with English choices, or the reverse. Four options. Distractors come from the same category when the deck has enough.
2. **Type the answer.** English prompt, Spanish answer. Grading ignores accents, capitalization, extra spaces, and punctuation, including `¿` and `¡`. `ñ` still has to be right. A close answer counts, and the screen always shows the exact spelling.
3. **Listen and pick.** Tap to hear the phrase, then choose the Spanish line you heard.

Every question has a speaker control. Feedback is immediate, and the set ends on a summary. Finished sets are saved in localStorage under the storage key: the last 20 sessions, plus per-phrase seen/correct counts.

## What this version leaves open

The saved record already has room for the next two steps, and this version does not fill those rooms:

- **Daily duels.** `DailyDuel` in `src/domain/types.ts` is the shared day: a date, the phrase ids, and a score per player. `seasonPointsTarget` is the race. Question generation can build each player’s copy from the same phrases and that player’s mix. A shared board would be Supabase, added later — there is no account and no server here.
- **Spaced repetition and streaks.** Each phrase stat has `ease`, `intervalDays`, and `nextDueOn`. New phrases start at ease `2.5` and a due date of null. Practice updates seen/correct counts and leaves the schedule fields alone, including a schedule a future version has already written. `streak` stays at zero until something else updates it.

## License

[MIT](LICENSE).
