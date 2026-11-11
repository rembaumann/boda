import type { AnsweredQuestion } from "../domain/types";
import { ShareGrid } from "./ShareGrid";

function headline(correct: number, total: number): string {
  if (total > 0 && correct === total) return "Clean sweep.";
  if (total > 0 && correct / total >= 0.7) return "Solid set.";
  return "Worth another pass.";
}

export function SummaryScreen({
  playerName,
  seasonTheme,
  phraseLang,
  results,
  title,
  shareText,
  syncNote,
  elapsedLabel,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  playerName: string;
  seasonTheme: string;
  phraseLang: string;
  results: readonly AnsweredQuestion[];
  title: string;
  shareText?: string | null;
  syncNote?: string | null;
  elapsedLabel?: string | null;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const total = results.length;
  const correctCount = results.filter((item) => item.correct).length;

  return (
    <main className="screen screen-summary" data-screen="summary">
      <p className="eyebrow">{seasonTheme}</p>
      <h1 className="summary-title">{title}</h1>
      <p className="for">{playerName}</p>
      <p className="score" data-score={`${correctCount}/${total}`}>
        <span className="score-number">{correctCount}</span>
        <span className="score-total">/{total}</span>
      </p>
      {elapsedLabel ? <p className="quiet">Time · {elapsedLabel}</p> : null}
      <p className="headline">{headline(correctCount, total)}</p>
      {shareText ? <ShareGrid text={shareText} /> : null}
      {syncNote ? <p className="quiet">{syncNote}</p> : null}
      <ol className="results">
        {results.map((item, index) => (
          <li key={`${item.phraseId}-${index}`} className={item.correct ? "result" : "result is-wrong"}>
            <span className={item.correct ? "pill is-correct" : "pill is-wrong"}>
              {item.correct ? "Right" : "Miss"}
            </span>
            <div className="result-copy">
              <p className="result-es" lang={phraseLang} translate="no">
                {item.spanish}
              </p>
              <p className="result-en">{item.english}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="actions">
        <button type="button" className="primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button type="button" className="text-button wide" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </main>
  );
}
