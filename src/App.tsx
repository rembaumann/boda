import { useMemo, useState } from "react";
import { appConfig } from "./config/app.config";
import { DrillScreen } from "./components/DrillScreen";
import { HomeScreen } from "./components/HomeScreen";
import { SummaryScreen } from "./components/SummaryScreen";
import { getDeck, listDeckFiles } from "./content/loadDeck";
import type { AnsweredQuestion, Question, SeasonConfig } from "./domain/types";
import { calendarDate, formatDuelDate, formatElapsed } from "./lib/calendar";
import { buildDailyDuel, dailyQuestions } from "./lib/daily";
import { applySession, createSessionRecord, type StoredProgress } from "./lib/progress";
import { createSession } from "./lib/questions";
import { MAX_ELAPSED_MS } from "./lib/scoreboard";
import type { DuelResult } from "./lib/scoring";
import { booleansToMarks, shareMessage } from "./lib/share";
import { primeSpeech } from "./lib/speech";
import { loadProgress, saveProgress } from "./lib/storage";
import { useScoreboard } from "./lib/useScoreboard";

type Screen =
  | { kind: "home" }
  | {
      kind: "drill";
      mode: "practice" | "duel";
      questions: Question[];
      index: number;
      results: AnsweredQuestion[];
      startedAt: number;
      date: string;
      seasonNumber: number;
      seasonId: string;
      seasonTheme: string;
    }
  | {
      kind: "summary";
      mode: "practice" | "duel";
      results: AnsweredQuestion[];
      seasonTheme: string;
      shareText: string | null;
      elapsedLabel: string | null;
      syncNote: string | null;
    };

function remember(progress: StoredProgress, playerId: string, seasonId: string): StoredProgress {
  return { ...progress, lastPlayerId: playerId, lastSeasonId: seasonId };
}

function loadDeck(file: string | null) {
  if (!file || !listDeckFiles().includes(file)) return [];
  return getDeck(file);
}

export function App() {
  const themes = useMemo(
    () => [...appConfig.seasons].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    [],
  );
  const practiceSeasons = useMemo(
    () => themes.filter((season) => season.deckFile && listDeckFiles().includes(season.deckFile)),
    [themes],
  );
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  const [playerId, setPlayerId] = useState(() => {
    const saved = loadProgress().lastPlayerId;
    if (saved && appConfig.players.some((player) => player.id === saved)) return saved;
    return appConfig.players[0]?.id ?? "";
  });
  const [seasonId, setSeasonId] = useState(() => {
    const saved = loadProgress().lastSeasonId;
    if (saved && practiceSeasons.some((season) => season.id === saved)) return saved;
    return practiceSeasons[0]?.id ?? "";
  });
  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  const today = calendarDate(new Date(), appConfig.calendar.timeZone);
  const player = appConfig.players.find((item) => item.id === playerId) ?? appConfig.players[0];
  const scoreboard = useScoreboard({
    today,
    youId: player?.id ?? "",
    playerName: player?.name ?? "",
    players: appConfig.players,
    themes,
    target: appConfig.session.seasonPointsTarget,
    appName: appConfig.name,
    locale: appConfig.uiLanguage,
  });

  const practiceSeason =
    practiceSeasons.find((item) => item.id === seasonId) ?? practiceSeasons[0] ?? null;
  const practiceDeck = useMemo(() => loadDeck(practiceSeason?.deckFile ?? null), [practiceSeason]);
  const duelDeck = useMemo(() => loadDeck(scoreboard.view.deckFile), [scoreboard.view.deckFile]);
  const deckReady = duelDeck.length > 0;

  if (!practiceSeason || !player || practiceSeasons.length === 0) {
    return (
      <main className="screen">
        <h1 className="wordmark" translate="no">
          {appConfig.name}
        </h1>
        <p>Add at least one player and one season with a deck in the app config.</p>
      </main>
    );
  }

  const currentSeason = practiceSeason;
  const currentPlayer = player;
  const lastSession =
    progress.players[currentPlayer.id]?.sessions.find((item) => item.seasonId === currentSeason.id) ?? null;
  const canPlay =
    deckReady &&
    scoreboard.phase !== "loading" &&
    scoreboard.phase !== "error" &&
    !scoreboard.view.youPlayed &&
    !scoreboard.pending;
  const canRetry = scoreboard.pending && scoreboard.phase !== "loading";

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

  function openDrill(mode: "practice" | "duel", questions: Question[], date: string, season: SeasonConfig, seasonNumber: number): void {
    primeSpeech();
    window.scrollTo(0, 0);
    setScreen({
      kind: "drill",
      mode,
      questions,
      index: 0,
      results: [],
      startedAt: Date.now(),
      date,
      seasonNumber,
      seasonId: season.id,
      seasonTheme: season.theme,
    });
  }

  function startPractice(): void {
    openDrill(
      "practice",
      createSession({
        deck: practiceDeck,
        mix: currentPlayer.mix,
        count: appConfig.session.questionsPerSet,
        difficultyMix: appConfig.session.difficultyMix,
      }),
      today,
      currentSeason,
      currentSeason.order,
    );
  }

  function startDuel(): void {
    if (!canPlay) return;
    const duel = buildDailyDuel({
      deck: duelDeck,
      date: today,
      seasonId: scoreboard.view.seasonId,
      seasonNumber: scoreboard.view.seasonNumber,
      count: appConfig.session.questionsPerSet,
      difficultyMix: appConfig.session.difficultyMix,
    });
    openDrill(
      "duel",
      dailyQuestions({
        deck: duelDeck,
        duel,
        playerId: currentPlayer.id,
        mix: currentPlayer.mix,
        difficultyMix: appConfig.session.difficultyMix,
      }),
      today,
      { ...currentSeason, id: scoreboard.view.seasonId, theme: scoreboard.view.theme, deckFile: scoreboard.view.deckFile },
      scoreboard.view.seasonNumber,
    );
  }

  function exit(): void {
    window.scrollTo(0, 0);
    setScreen({ kind: "home" });
  }

  function record(results: AnsweredQuestion[], seasonPlayed: string): void {
    const completedAt = new Date().toISOString();
    const session = createSessionRecord({
      seasonId: seasonPlayed,
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
    if (screen.index + 1 < screen.questions.length) {
      setScreen({ ...screen, index: screen.index + 1, results });
      return;
    }
    record(results, screen.seasonId);
    if (screen.mode === "practice") {
      setScreen({
        kind: "summary",
        mode: "practice",
        results,
        seasonTheme: screen.seasonTheme,
        shareText: null,
        elapsedLabel: null,
        syncNote: null,
      });
      return;
    }
    const elapsedMs = Math.min(MAX_ELAPSED_MS, Math.max(1, Date.now() - screen.startedAt));
    const marks = results.map((item) => item.correct);
    const duelResult: DuelResult = {
      playerId: currentPlayer.id,
      playedOn: screen.date,
      seasonId: screen.seasonId,
      seasonNumber: screen.seasonNumber,
      correctCount: marks.filter(Boolean).length,
      questionCount: marks.length,
      elapsedMs,
      marks: booleansToMarks(marks),
      createdAt: new Date().toISOString(),
    };
    const shareText = shareMessage({
      appName: appConfig.name,
      dateLabel: formatDuelDate(screen.date, appConfig.uiLanguage),
      playerName: currentPlayer.name,
      marks,
    });
    setScreen({
      kind: "summary",
      mode: "duel",
      results,
      seasonTheme: screen.seasonTheme,
      shareText,
      elapsedLabel: formatElapsed(elapsedMs),
      syncNote: scoreboard.phase === "local" ? "Saved on this phone." : "Sending to the shared board.",
    });
    void scoreboard.submit(duelResult).then((message) => {
      setScreen((current) =>
        current.kind === "summary" && current.mode === "duel" ? { ...current, syncNote: message } : current,
      );
    });
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
    const duel = screen.mode === "duel";
    return (
      <SummaryScreen
        playerName={currentPlayer.name}
        seasonTheme={screen.seasonTheme}
        phraseLang={appConfig.voice.locale}
        results={screen.results}
        title={duel ? "Today's duel" : "Set complete"}
        shareText={screen.shareText}
        syncNote={screen.syncNote}
        elapsedLabel={screen.elapsedLabel}
        primaryLabel={duel ? "Back home" : "Practice again"}
        onPrimary={duel ? exit : startPractice}
        secondaryLabel={duel ? undefined : "Back home"}
        onSecondary={duel ? undefined : exit}
      />
    );
  }

  return (
    <HomeScreen
      appName={appConfig.name}
      tagline={appConfig.tagline}
      practiceSeasons={practiceSeasons}
      practiceSeason={currentSeason}
      phraseCount={duelDeck.length}
      questionsPerSet={appConfig.session.questionsPerSet}
      goalLabel={appConfig.session.goalLabel}
      goalNote={appConfig.session.goalNote}
      board={scoreboard.view}
      statusText={scoreboard.statusText}
      deckReady={deckReady}
      canPlay={canPlay}
      canRetry={canRetry}
      showReload={scoreboard.phase === "error"}
      shareText={scoreboard.shareText}
      players={appConfig.players}
      selectedPlayerId={currentPlayer.id}
      lastSession={lastSession}
      onSelectPlayer={selectPlayer}
      onSelectSeason={selectSeason}
      onPractice={startPractice}
      onDuel={startDuel}
      onRetry={() => {
        void scoreboard.retry();
      }}
      onReload={() => {
        void scoreboard.refresh();
      }}
    />
  );
}
