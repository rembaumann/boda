import { allocateCounts } from "../lib/allocate";
import { DRILL_TYPES, type DrillMix, type PlayerConfig, type SeasonConfig } from "../domain/types";
import type { SessionRecord } from "../lib/progress";

function mixLine(mix: DrillMix, total: number): string {
  const counts = allocateCounts(mix, total, DRILL_TYPES);
  return `${counts.multipleChoice ?? 0} choice · ${counts.typeAnswer ?? 0} type · ${counts.listen ?? 0} listen`;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function HomeScreen({
  appName,
  tagline,
  seasons,
  season,
  phraseCount,
  questionsPerSet,
  seasonPointsTarget,
  goalLabel,
  goalNote,
  players,
  selectedPlayerId,
  lastSession,
  onSelectPlayer,
  onSelectSeason,
  onStart,
}: {
  appName: string;
  tagline: string;
  seasons: readonly SeasonConfig[];
  season: SeasonConfig;
  phraseCount: number;
  questionsPerSet: number;
  seasonPointsTarget: number;
  goalLabel: string;
  goalNote: string;
  players: readonly PlayerConfig[];
  selectedPlayerId: string;
  lastSession: SessionRecord | null;
  onSelectPlayer: (id: string) => void;
  onSelectSeason: (id: string) => void;
  onStart: () => void;
}) {
  const standalone = isStandalone();
  const seasonNumber = String(season.order).padStart(2, "0");

  return (
    <main className="screen screen-home" data-screen="home">
      <header className="home-header">
        <h1 className="wordmark" translate="no">
          {appName}
        </h1>
        <p className="tagline">{tagline}</p>
      </header>

      {seasons.length > 1 ? (
        <div className="season-switch" role="group" aria-label="Season">
          {seasons.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === season.id ? "chip is-selected" : "chip"}
              aria-pressed={item.id === season.id}
              onClick={() => onSelectSeason(item.id)}
            >
              {item.theme}
            </button>
          ))}
        </div>
      ) : null}

      <section className="season-card" aria-label={season.theme}>
        <p className="season-kicker">Season {seasonNumber}</p>
        <h2 className="season-title">{season.theme}</h2>
        <dl className="stats">
          <div>
            <dt>Phrases</dt>
            <dd>{phraseCount}</dd>
          </div>
          <div>
            <dt>A set</dt>
            <dd>{questionsPerSet}</dd>
          </div>
          <div>
            <dt>{goalLabel}</dt>
            <dd>{seasonPointsTarget}</dd>
          </div>
        </dl>
        <p className="goal-note">{goalNote}</p>
      </section>

      <section className="players">
        <h2 className="section-title">Who's practicing?</h2>
        <div className="player-grid" role="group" aria-label="Who's practicing?">
          {players.map((player) => {
            const selected = player.id === selectedPlayerId;
            return (
              <button
                key={player.id}
                type="button"
                className={selected ? "player is-selected" : "player"}
                aria-pressed={selected}
                onClick={() => onSelectPlayer(player.id)}
              >
                <span className="player-name">{player.name}</span>
                <span className="player-note">{player.note}</span>
                <span className="mix">{mixLine(player.mix, questionsPerSet)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="actions">
        {lastSession ? (
          <p className="last-set">
            Last set · {lastSession.correctCount}/{lastSession.total}
          </p>
        ) : null}
        <button type="button" className="primary" onClick={onStart}>
          Start practice
        </button>
        <p className="quiet">Works offline after the first visit.</p>
        {standalone ? null : (
          <p className="quiet">On iPhone, share this page and choose Add to Home Screen.</p>
        )}
      </div>
    </main>
  );
}
