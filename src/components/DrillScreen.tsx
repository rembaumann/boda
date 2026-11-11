import { useRef, useState, type FormEvent } from "react";
import { categoryLabels } from "../content/categories";
import { gradeTypedAnswer, normalizeAnswer, typeAnswerLead, type AnswerLead } from "../lib/grading";
import type { Choice, ListenQuestion, MultipleChoiceQuestion, Question } from "../domain/types";
import { SpeakerButton } from "./SpeakerButton";

const LEADS: Record<AnswerLead, string> = {
  correct: "Correct.",
  close: "Close enough.",
  incorrect: "Not quite.",
};

function DrillHeader({
  index,
  total,
  onExit,
}: {
  index: number;
  total: number;
  onExit: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="drill-head">
      <button type="button" className="text-button" onClick={() => setConfirming(true)}>
        Close
      </button>
      <p className="count">
        {index + 1} of {total}
      </p>
      {confirming ? (
        <div className="confirm" role="group" aria-label="End practice">
          <p>End this set? It won't be saved.</p>
          <div className="confirm-actions">
            <button type="button" className="text-button" onClick={() => setConfirming(false)}>
              Keep going
            </button>
            <button type="button" className="primary slim" onClick={onExit}>
              End
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChoiceButtons({
  choices,
  phraseLang,
  choiceLang,
  revealed,
  pickedId,
  correctChoiceId,
  onPick,
}: {
  choices: readonly Choice[];
  phraseLang: string;
  choiceLang: string;
  revealed: boolean;
  pickedId: string | null;
  correctChoiceId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="choices" role="group" aria-label="Answer choices">
      {choices.map((choice, index) => {
        const letter = String.fromCharCode(65 + index);
        const state = !revealed
          ? "idle"
          : choice.id === correctChoiceId
            ? "correct"
            : choice.id === pickedId
              ? "wrong"
              : "idle";
        return (
          <button
            key={choice.id}
            type="button"
            className={state === "idle" ? "choice" : `choice is-${state}`}
            data-choice=""
            lang={choiceLang === "en" ? "en" : phraseLang}
            translate={choiceLang === "en" ? undefined : "no"}
            aria-disabled={revealed}
            onClick={() => {
              if (revealed) return;
              onPick(choice.id);
            }}
          >
            <span className="choice-letter" aria-hidden="true">
              {letter}
            </span>
            <span className="choice-text">{choice.text}</span>
            {state === "correct" ? <span className="mark">Correct</span> : null}
            {state === "wrong" ? <span className="mark">Your pick</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function Feedback({
  lead,
  correct,
  spanish,
  english,
  phraseLang,
  pronunciation,
  typed,
}: {
  lead: string;
  correct: boolean;
  spanish: string;
  english: string;
  phraseLang: string;
  pronunciation?: string;
  typed: string | null;
}) {
  return (
    <div className={correct ? "feedback is-correct" : "feedback is-incorrect"} role="status">
      <p className="feedback-lead">{lead}</p>
      <p className="exact" lang={phraseLang} translate="no">
        {spanish}
      </p>
      {pronunciation ? <p className="pronunciation">{pronunciation}</p> : null}
      <p className="gloss">{english}</p>
      {typed && lead !== LEADS.correct ? <p className="yours">You typed: {typed}</p> : null}
    </div>
  );
}

function QuestionView({
  question,
  phraseLang,
  isLast,
  onResult,
}: {
  question: Question;
  phraseLang: string;
  isLast: boolean;
  onResult: (result: { correct: boolean; response: string | null }) => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [needAnswer, setNeedAnswer] = useState(false);
  const sent = useRef(false);

  const graded = question.type === "typeAnswer" ? gradeTypedAnswer(typed, question.spanish) : null;
  const correct =
    question.type === "typeAnswer" ? (graded?.correct ?? false) : pickedId === question.correctChoiceId;
  const leadKey: AnswerLead =
    question.type === "typeAnswer" && graded
      ? typeAnswerLead(typed, question.spanish, graded.correct)
      : correct
        ? "correct"
        : "incorrect";
  const lead = LEADS[leadKey];
  const nextLabel = isLast ? "See results" : "Next";

  function responseText(): string | null {
    if (question.type === "typeAnswer") return typed;
    const choice = question.choices.find((item) => item.id === pickedId);
    return choice ? choice.text : null;
  }

  function submitResult(): void {
    if (sent.current) return;
    sent.current = true;
    onResult({ correct, response: responseText() });
  }

  function onPick(id: string): void {
    setPickedId(id);
    setRevealed(true);
  }

  function onTypeSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!revealed) {
      if (normalizeAnswer(typed).length === 0) {
        setNeedAnswer(true);
        return;
      }
      setNeedAnswer(false);
      setRevealed(true);
      return;
    }
    submitResult();
  }

  const promptIsSpanish = question.type === "multipleChoice" && question.promptLang === "es";
  const prompt =
    question.type === "listen"
      ? "Which phrase did you hear?"
      : question.type === "multipleChoice"
        ? promptIsSpanish
          ? question.spanish
          : question.english
        : question.english;
  const promptLanguage = promptIsSpanish ? phraseLang : "en";
  const ask =
    question.type === "listen"
      ? null
      : question.type === "typeAnswer"
        ? "How do you say this in Spanish?"
        : promptIsSpanish
          ? "What does it mean?"
          : "How do you say it?";

  const choiceQuestion: MultipleChoiceQuestion | ListenQuestion | null =
    question.type === "typeAnswer" ? null : question;
  const choiceLang =
    question.type === "listen" || (question.type === "multipleChoice" && question.promptLang === "en")
      ? phraseLang
      : "en";

  return (
    <section className="question" data-drill={question.type}>
      <p className="eyebrow">{categoryLabels[question.category]}</p>
      {ask ? <p className="ask">{ask}</p> : null}
      <h2 className="prompt" lang={promptLanguage} translate={promptIsSpanish ? "no" : undefined}>
        {prompt}
      </h2>
      {question.type === "listen" ? (
        <div className="listen-hero">
          <SpeakerButton text={question.spanish} size="large" />
        </div>
      ) : (
        <SpeakerButton text={question.spanish} size="regular" />
      )}
      {promptIsSpanish && question.pronunciation ? (
        <p className="pronunciation">{question.pronunciation}</p>
      ) : null}
      {question.type === "typeAnswer" && question.pronunciation && !revealed ? (
        showHint ? (
          <p className="pronunciation">{question.pronunciation}</p>
        ) : (
          <button type="button" className="text-button hint" onClick={() => setShowHint(true)}>
            Show pronunciation
          </button>
        )
      ) : null}

      {question.type === "typeAnswer" ? (
        <form className="type-form" onSubmit={onTypeSubmit}>
          <label className="field">
            <span>Spanish</span>
            <input
              className="answer-input"
              value={typed}
              lang={phraseLang}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="done"
              disabled={revealed}
              onChange={(event) => {
                setTyped(event.target.value);
                if (needAnswer) setNeedAnswer(false);
              }}
            />
          </label>
          {needAnswer ? (
            <p className="need-answer" role="status">
              Type the Spanish first.
            </p>
          ) : null}
          {revealed && graded ? (
            <Feedback
              lead={lead}
              correct={graded.correct}
              spanish={graded.expected}
              english={question.english}
              phraseLang={phraseLang}
              pronunciation={question.pronunciation}
              typed={typed}
            />
          ) : null}
          <button type="submit" className="primary" data-action={revealed ? "next" : "check"}>
            {revealed ? nextLabel : "Check"}
          </button>
        </form>
      ) : null}

      {choiceQuestion ? (
        <>
          <ChoiceButtons
            choices={choiceQuestion.choices}
            phraseLang={phraseLang}
            choiceLang={choiceLang}
            revealed={revealed}
            pickedId={pickedId}
            correctChoiceId={choiceQuestion.correctChoiceId}
            onPick={onPick}
          />
          {revealed ? (
            <>
              <Feedback
                lead={lead}
                correct={correct}
                spanish={question.spanish}
                english={question.english}
                phraseLang={phraseLang}
                pronunciation={question.pronunciation}
                typed={null}
              />
              <button type="button" className="primary" data-action="next" onClick={submitResult}>
                {nextLabel}
              </button>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function DrillScreen({
  question,
  index,
  total,
  phraseLang,
  isLast,
  onExit,
  onResult,
}: {
  question: Question;
  index: number;
  total: number;
  phraseLang: string;
  isLast: boolean;
  onExit: () => void;
  onResult: (result: { correct: boolean; response: string | null }) => void;
}) {
  const percent = total === 0 ? 0 : ((index + 1) / total) * 100;

  return (
    <main className="screen screen-drill" data-screen="drill">
      <DrillHeader key={index} index={index} total={total} onExit={onExit} />
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label="Practice progress"
      >
        <span className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <QuestionView
        key={question.id}
        question={question}
        phraseLang={phraseLang}
        isLast={isLast}
        onResult={onResult}
      />
    </main>
  );
}
