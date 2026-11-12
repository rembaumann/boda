import { allocateCounts } from "../lib/allocate";
import { SendFeedback } from "./FeedbackEntry";
import { FeedbackForm } from "./FeedbackForm";
import type { FeedbackFields } from "../lib/feedbackClient";
import { CopyResultButton } from "./ShareGrid";
import { DRILL_TYPES, type DrillMix, type PlayerConfig, type SeasonConfig } from "../domain/types";
import type { SessionRecord } from "../lib/progress";
import type { BoardView } from "../lib/scoring";

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
  practiceSeasons,
  practiceSeason,
  phraseCount,
  questionsPerSet,
  goalLabel,
  goalNote,
  board,
  statusText,
  deckReady,
  canPlay,
  canRetry,
  showReload,
  shareText,
  players,
  selectedPlayerId,
  lastSession,
  onSelectPlayer,
  onSelectSeason,
  onPractice,
  onDuel,
  onRetry,
  onReload,
  getFields,
}: {
  appName: string;
  tagline: string;
  practiceSeasons: readonly SeasonConfig[];
  practiceSeason: SeasonConfig;
  phraseCount: number;
  questionsPerSet: number;
  goalLabel: string;
  goalNote: string;
  board: BoardView;
  statusText: string;
  deckReady: boolean;
  canPlay: boolean;
  canRetry: boolean;
  showReload: boolean;
  shareText: string | null;
  players: readonly PlayerConfig[];
  selectedPlayerId: string;
  lastSession: SessionRecord | null;
  onSelectPlayer: (id: string) => void;
  onSelectSeason: (id: string) => void;
  onPractice: () => void;
  onDuel: () => void;
  onRetry: () => void;
  onReload: () => void;
  getFields: () => FeedbackFields;
}) {
  const standalone = isStandalone();
  const seasonNumber = String(board.seasonNumber).padStart(2, "0");
  const duelFirst = canPlay || canRetry;

  return (
    <main className="screen screen-home" data-screen="home">
      <header className="home-header">
        <h1 className="wordmark" translate="no">
          {appName}
        </h1>
        <p className="tagline">{tagline}</p>
      </header>

      {practiceSeasons.length > 1 ? (
        <div className="season-switch" role="group" aria-label="Practice season">
          {practiceSeasons.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === practiceSeason.id ? "chip is-selected" : "chip"}
              aria-pressed={item.id === practiceSeason.id}
              onClick={() => onSelectSeason(item.id)}
            >
              {item.theme}
            </button>
          ))}
        </div>
      ) : null}

      <section className="season-card" aria-label="Scoreboard" data-scoreboard>
        <p className="season-kicker">Season {seasonNumber}</p>
        <h2 className="season-title">{board.theme}</h2>
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
            <dd>{board.target}</dd>
          </div>
        </dl>
        <ul className="standings">
          {board.standings.map((row) => (
            <li key={row.id} className="standing">
              <span className="standing-name">{row.name}</span>
              <span className="standing-score">
                {row.points}
                <span className="standing-target">/{board.target}</span>
                <span className="trophy-count">
                  {row.trophies} {row.trophies === 1 ? "trophy" : "trophies"}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="today-line">{board.todayLabel}</p>
        <p className="goal-note">{goalNote}</p>
        {deckReady ? null : <p className="goal-note">This season's phrases aren't in the app yet.</p>}
        {practiceSeason.theme !== board.theme ? <p className="quiet">Practice uses {practiceSeason.theme}.</p> : null}
        <p className="quiet">{statusText}</p>
      </section>

      <section className="players">
        <h2 className="section-title">Who's playing?</h2>
        <div className="player-grid" role="group" aria-label="Who's playing?">
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
        {canPlay ? (
          <button type="button" className="primary" onClick={onDuel}>
            Play today's duel
          </button>
        ) : null}
        {canRetry ? (
          <button type="button" className="primary" onClick={onRetry}>
            Share today's result
          </button>
        ) : null}
        <button type="button" className={duelFirst ? "secondary" : "primary"} onClick={onPractice}>
          Start practice
        </button>
        <section className="suggest-card" aria-labelledby="suggest-title" data-feature-form>
          <h2 id="suggest-title" className="section-title">
            Suggest a feature
          </h2>
          <p className="suggest-note">What would you like to see?</p>
          <FeedbackForm
            kind="feature"
            getFields={() => ({
              playerId: selectedPlayerId,
              screen: "home",
              mode: null,
              seasonId: practiceSeason.id,
              deckFile: null,
              phraseId: null,
              drillType: null,
              lastAnswer: null,
            })}
          />
        </section>
        {shareText ? <CopyResultButton text={shareText} /> : null}
        {showReload ? (
          <button type="button" className="text-button wide" onClick={onReload}>
            Try the board again
          </button>
        ) : null}
        <p className="quiet">Practice works offline after the first visit.</p>
        {standalone ? null : (
          <p className="quiet">On iPhone, share this page and choose Add to Home Screen.</p>
        )}
        <SendFeedback getFields={getFields} />
      </div>
    </main>
  );
}
