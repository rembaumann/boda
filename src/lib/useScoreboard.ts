import { useCallback, useEffect, useMemo, useState } from "react";
import type { SeasonConfig } from "../domain/types";
import { formatDuelDate } from "./calendar";
import { loadLocalResults, saveLocalResult } from "./duelStore";
import { getScoreboardGateway } from "./scoreboard";
import { marksToBooleans, shareMessage } from "./share";
import { presentBoard, resultKey, type BoardView, type DuelResult } from "./scoring";

export type BoardPhase = "local" | "loading" | "live" | "error";

export function useScoreboard(input: {
  today: string;
  youId: string;
  playerName: string;
  players: readonly { id: string; name: string }[];
  themes: readonly SeasonConfig[];
  target: number;
  appName: string;
  locale: string;
}): {
  view: BoardView;
  phase: BoardPhase;
  statusText: string;
  shareText: string | null;
  pending: boolean;
  submit: (result: DuelResult) => Promise<string>;
  retry: () => Promise<string>;
  refresh: () => Promise<void>;
} {
  const gateway = getScoreboardGateway();
  const [remote, setRemote] = useState<DuelResult[]>([]);
  const [local, setLocal] = useState<DuelResult[]>(() => loadLocalResults());
  const [phase, setPhase] = useState<BoardPhase>(gateway.configured ? "loading" : "local");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!gateway.configured) {
      setPhase("local");
      setLocal(loadLocalResults());
      return;
    }
    try {
      const rows = await gateway.fetchResults();
      setRemote(rows);
      setPhase("live");
      setError(null);
    } catch (caught) {
      setPhase("error");
      setError(caught instanceof Error ? caught.message : "Couldn't load the shared board.");
    }
  }, [gateway]);

  useEffect(() => {
    let cancelled = false;
    if (!gateway.configured) return undefined;
    const load = () => {
      void gateway.fetchResults().then(
        (rows) => {
          if (cancelled) return;
          setRemote(rows);
          setPhase("live");
          setError(null);
        },
        (caught: unknown) => {
          if (cancelled) return;
          setPhase("error");
          setError(caught instanceof Error ? caught.message : "Couldn't load the shared board.");
        },
      );
    };
    load();
    const stop = gateway.subscribe(load);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [gateway, input.today]);

  const pendingResult = useMemo(() => {
    if (phase === "local") return null;
    const remoteKeys = new Set(remote.map((result) => resultKey(result)));
    return (
      local.find(
        (result) =>
          result.playerId === input.youId &&
          result.playedOn === input.today &&
          !remoteKeys.has(resultKey(result)),
      ) ?? null
    );
  }, [input.today, input.youId, local, phase, remote]);

  const official = phase === "local" ? local : remote;
  const view = useMemo(() => {
    const presented = presentBoard({
      results: official,
      players: input.players,
      themes: input.themes,
      target: input.target,
      today: input.today,
      youId: input.youId,
    });
    if (phase === "loading") {
      return { ...presented, todayLabel: "Loading the shared board." };
    }
    if (pendingResult) {
      return {
        ...presented,
        todayLabel: "Saved on this phone. Not on the shared board yet.",
        youPlayed: true,
        yourMarks: pendingResult.marks,
      };
    }
    return presented;
  }, [input.players, input.target, input.themes, input.today, input.youId, official, pendingResult, phase]);

  const shareText = useMemo(() => {
    if (!view.youPlayed) return null;
    const marks = marksToBooleans(view.yourMarks ?? "");
    if (!marks) return null;
    return shareMessage({
      appName: input.appName,
      dateLabel: formatDuelDate(input.today, input.locale),
      playerName: input.playerName,
      marks,
    });
  }, [input.appName, input.locale, input.playerName, input.today, view.youPlayed, view.yourMarks]);

  const submit = useCallback(
    async (result: DuelResult) => {
      saveLocalResult(result);
      setLocal(loadLocalResults());
      if (!gateway.configured) return "Saved on this phone.";
      try {
        const outcome = await gateway.submit(result);
        await refresh();
        return outcome === "duplicate" ? "Already on the shared board." : "On the shared board.";
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "The shared board rejected this duel.";
        setPhase("error");
        setError(message);
        return `Saved on this phone. ${message}`;
      }
    },
    [gateway, refresh],
  );

  const retry = useCallback(() => {
    if (!pendingResult) return Promise.resolve("Nothing to share.");
    return submit(pendingResult);
  }, [pendingResult, submit]);

  const statusText =
    phase === "loading"
      ? "Loading the shared board."
      : phase === "live"
        ? "Both phones share this board."
        : phase === "local"
          ? "On this phone until Supabase env vars are set."
          : (error ?? "Couldn't load the shared board.");

  return {
    view,
    phase,
    statusText,
    shareText,
    pending: Boolean(pendingResult),
    submit,
    retry,
    refresh,
  };
}
