import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FeedbackFields } from "../lib/feedbackClient";
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

export function BugButton({ getFields }: { getFields: () => FeedbackFields }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);
  const [open, setOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const vv = viewport;
    function update(): void {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
      setKeyboard(inset > 80);
    }
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--keyboard-inset");
    };
  }, []);

  useEffect(() => {
    function update(): void {
      const active = document.activeElement;
      const editing =
        (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
        !active.closest("[data-bug-sheet], [data-honeypot]");
      setTyping(editing);
    }
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }
    const scroll = document.querySelector(".app-scroll");
    const previous = scroll instanceof HTMLElement ? scroll.style.overflow : "";
    if (scroll instanceof HTMLElement) scroll.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      if (scroll instanceof HTMLElement) scroll.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      opened.current = true;
      return;
    }
    if (!opened.current) return;
    opened.current = false;
    buttonRef.current?.focus();
  }, [open]);

  const conceal = keyboard || typing;

  return (
    <>
      <div className={conceal && !open ? "bug-dock is-concealed" : "bug-dock"} hidden={open}>
        <button
          ref={buttonRef}
          type="button"
          className="bug-button"
          data-bug-button
          aria-label="Report a bug"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <BugIcon />
        </button>
      </div>
      {open ? (
        <div className="bug-layer">
          <button type="button" className="bug-backdrop" aria-label="Close bug report" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bug-sheet-title"
            className="bug-sheet"
            data-bug-sheet
          >
            <div className="bug-sheet-head">
              <h2 id="bug-sheet-title" className="section-title">
                Report a bug
              </h2>
              <button type="button" className="text-button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <p className="suggest-note">What went wrong?</p>
            <FeedbackForm kind="bug" autoFocus getFields={getFields} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AppFrame({
  getFields,
  children,
}: {
  getFields: () => FeedbackFields;
  children: ReactNode;
}) {
  return (
    <div className="app-frame">
      <div className="app-scroll">{children}</div>
      <BugButton getFields={getFields} />
    </div>
  );
}
