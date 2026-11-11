import { useMemo, useState } from "react";
import { appConfig } from "./config/app.config";
import { DrillScreen } from "./components/DrillScreen";
import { HomeScreen } from "./components/HomeScreen";
import { SummaryScreen } from "./components/SummaryScreen";
import { getDeck } from "./content/loadDeck";
import type { AnsweredQuestion, Question } from "./domain/types";
import { createSession } from "./lib/questions";
import { primeSpeech } from "./lib/speech";
import { applySession, createSessionRecord, type StoredProgress } from "./lib/progress";
import { loadProgress, saveProgress } from "./lib/storage";

type Screen =
  | { kind: "home" }
  | { kind: "drill"; questions: Question[]; index: number; results: AnsweredQuestion[] }
  | { kind: "summary"; results: AnsweredQuestion[] };

function remember(progress: StoredProgress, playerId: string, seasonId: string): StoredProgress {
  return { ...progress, lastPlayerId: playerId, lastSeasonId: seasonId };
}

export function App() {
  const seasons = [...appConfig.seasons].sort((a, b) => a.order - b.order);
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  const [playerId, setPlayerId] = useState(() => {
    const saved = loadProgress().lastPlayerId;
    if (saved && appConfig.players.some((player) => player.id === saved)) return saved;
    return appConfig.players[0]?.id ?? "";
  });
  const [seasonId, setSeasonId] = useState(() => {
    const saved = loadProgress().lastSeasonId;
    if (saved && seasons.some((season) => season.id === saved)) return saved;
    return seasons[0]?.id ?? "";
  });
  const [screen, setScreen] = useState<Screen>({ kind: "home" });

  const season = seasons.find((item) => item.id === seasonId) ?? seasons[0];
  const player = appConfig.players.find((item) => item.id === playerId) ?? appConfig.players[0];
  const deckFile = season?.deckFile ?? "";
  const deck = useMemo(() => (deckFile ? getDeck(deckFile) : []), [deckFile]);

  if (!season || !player) {
    return (
      <main className="screen">
        <h1 className="wordmark" translate="no">
          {appConfig.name}
        </h1>
        <p>Add at least one player and one season in the app config.</p>
      </main>
    );
  }

  const currentSeason = season;
  const currentPlayer = player;
  const lastSession =
    progress.players[currentPlayer.id]?.sessions.find((item) => item.seasonId === currentSeason.id) ?? null;

  function selectPlayer(id: string): void {
    setPlayerId(id);
    const next = remember(progress, id, currentSeason.id);
    setProgress(next);
    saveProgress(next);
  }

  function selectSeason(id: string): void {
    setSeasonId(id);
    const next = remember(progress, currentPlayer.id, id);
    setProgress(next);
    saveProgress(next);
  }

  function start(): void {
    primeSpeech();
    const questions = createSession({
      deck,
      mix: currentPlayer.mix,
      count: appConfig.session.questionsPerSet,
      difficultyMix: appConfig.session.difficultyMix,
    });
    window.scrollTo(0, 0);
    setScreen({ kind: "drill", questions, index: 0, results: [] });
  }

  function exit(): void {
    window.scrollTo(0, 0);
    setScreen({ kind: "home" });
  }

  function finish(result: { correct: boolean; response: string | null }): void {
    if (screen.kind !== "drill") return;
    const question = screen.questions[screen.index];
    if (!question) return;
    const answered: AnsweredQuestion = {
      phraseId: question.phraseId,
      drill: question.type,
      difficulty: question.difficulty,
      category: question.category,
      correct: result.correct,
      spanish: question.spanish,
      english: question.english,
      response: result.response,
    };
    const results = [...screen.results, answered];
    window.scrollTo(0, 0);
    if (screen.index + 1 >= screen.questions.length) {
      const completedAt = new Date().toISOString();
      const session = createSessionRecord({
        seasonId: currentSeason.id,
        questions: results,
        completedAt,
      });
      const saved = remember(
        applySession(progress, session, currentPlayer.id, completedAt),
        currentPlayer.id,
        currentSeason.id,
      );
      setProgress(saved);
      saveProgress(saved);
      setScreen({ kind: "summary", results });
      return;
    }
    setScreen({ kind: "drill", questions: screen.questions, index: screen.index + 1, results });
  }

  if (screen.kind === "drill") {
    const question = screen.questions[screen.index];
    if (!question) {
      return (
        <main className="screen">
          <p>This set is empty.</p>
          <button type="button" className="primary" onClick={exit}>
            Back home
          </button>
        </main>
      );
    }
    return (
      <DrillScreen
        question={question}
        index={screen.index}
        total={screen.questions.length}
        phraseLang={appConfig.voice.locale}
        isLast={screen.index + 1 >= screen.questions.length}
        onExit={exit}
        onResult={finish}
      />
    );
  }

  if (screen.kind === "summary") {
    return (
      <SummaryScreen
        playerName={currentPlayer.name}
        seasonTheme={currentSeason.theme}
        phraseLang={appConfig.voice.locale}
        results={screen.results}
        onAgain={start}
        onHome={exit}
      />
    );
  }

  return (
    <HomeScreen
      appName={appConfig.name}
      tagline={appConfig.tagline}
      seasons={seasons}
      season={currentSeason}
      phraseCount={deck.length}
      questionsPerSet={appConfig.session.questionsPerSet}
      seasonPointsTarget={appConfig.session.seasonPointsTarget}
      goalLabel={appConfig.session.goalLabel}
      goalNote={appConfig.session.goalNote}
      players={appConfig.players}
      selectedPlayerId={currentPlayer.id}
      lastSession={lastSession}
      onSelectPlayer={selectPlayer}
      onSelectSeason={selectSeason}
      onStart={start}
    />
  );
}
