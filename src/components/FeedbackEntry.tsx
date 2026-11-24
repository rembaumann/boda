import { Bug } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import type { FeedbackFields, FeedbackKind } from "../lib/feedbackClient";
import { FeedbackForm } from "./FeedbackForm";

function useEscape(open: boolean, close: () => void): void {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);
}

export function SendFeedback({ getFields }: { getFields: () => FeedbackFields }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const close = useCallback(() => setOpen(false), []);
  useEscape(open, close);

  return (
    <section className="suggest-card send-feedback" data-send-feedback>
      <button
        type="button"
        className="text-button wide"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Send feedback
      </button>
      {open ? (
        <div className="feedback-panel">
          <div className="kind-switch" role="group" aria-label="What are you sending?">
            <button
              type="button"
              className={kind === "bug" ? "chip is-selected" : "chip"}
              aria-pressed={kind === "bug"}
              onClick={() => setKind("bug")}
            >
              Bug
            </button>
            <button
              type="button"
              className={kind === "feature" ? "chip is-selected" : "chip"}
              aria-pressed={kind === "feature"}
              onClick={() => setKind("feature")}
            >
              Idea
            </button>
          </div>
          <p className="suggest-note">{kind === "bug" ? "What went wrong?" : "What would you like to see?"}</p>
          <FeedbackForm key={kind} kind={kind} autoFocus getFields={getFields} />
        </div>
      ) : null}
    </section>
  );
}

export function ReportBugButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="header-bug"
      data-bug-button
      aria-label="Report a bug"
      aria-expanded={open}
      onClick={onToggle}
    >
      <Bug size={22} weight="bold" aria-hidden />
    </button>
  );
}

export function BugReport({ getFields, onClose }: { getFields: () => FeedbackFields; onClose: () => void }) {
  useEscape(true, onClose);
  return (
    <div className="bug-report" data-bug-sheet>
      <h2 className="section-title">Report a bug</h2>
      <p className="suggest-note">What went wrong?</p>
      <FeedbackForm kind="bug" autoFocus getFields={getFields} />
    </div>
  );
}
