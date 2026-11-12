import { useCallback, useEffect, useState } from "react";
import type { FeedbackFields, FeedbackKind } from "../lib/feedbackClient";
import { FeedbackForm } from "./FeedbackForm";

function BugIcon() {
  return (
    <svg className="bug-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 7.2a2.2 2.2 0 1 0-2.2-2.2A2.2 2.2 0 0 0 12 7.2Zm0 1.3a5 5 0 0 0-5 5v.2a5 5 0 0 0 10 0v-.2a5 5 0 0 0-5-5Zm0 1.6a3.4 3.4 0 0 1 3.4 3.4v.2a3.4 3.4 0 0 1-6.8 0v-.2A3.4 3.4 0 0 1 12 10.1ZM5.2 12.2H3m18 0h-2.2M7.4 16.6 5.6 18.4M16.6 16.6l1.8 1.8M7.6 9.2 5.8 7.4M16.4 9.2l1.8-1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      <BugIcon />
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
