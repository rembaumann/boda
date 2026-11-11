import { useId, useRef, useState, type FormEvent } from "react";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  OFFLINE_MESSAGE,
  RETRY_MESSAGE,
  UNCONFIGURED_MESSAGE,
  deviceId,
  postFeedback,
  type FeedbackFields,
  type FeedbackKind,
} from "../lib/feedbackClient";

export function FeedbackForm({
  kind,
  getFields,
  autoFocus = false,
}: {
  kind: FeedbackKind;
  getFields: () => FeedbackFields;
  autoFocus?: boolean;
}) {
  const fieldId = useId();
  const hintId = useId();
  const statusId = useId();
  const sendingRef = useRef(false);
  const requestRef = useRef<{ id: string; description: string } | null>(null);
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const trimmed = description.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < DESCRIPTION_MIN;
  const ready = trimmed.length >= DESCRIPTION_MIN && trimmed.length <= DESCRIPTION_MAX;
  const describedBy = [hintId, confirmation || problem ? statusId : ""].filter(Boolean).join(" ");

  function requestIdFor(text: string): string {
    if (!requestRef.current || requestRef.current.description !== text) {
      requestRef.current = { id: crypto.randomUUID(), description: text };
    }
    return requestRef.current.id;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const text = description.trim();
    if (text.length < DESCRIPTION_MIN || text.length > DESCRIPTION_MAX) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setProblem(null);
    setConfirmation(null);
    const honey = event.currentTarget.querySelector("input[name='hp_field']");
    const companyValue = honey instanceof HTMLInputElement && honey.value.trim() ? honey.value : company;
    const requestId = requestIdFor(text);
    const fields = getFields();
    void postFeedback({
      ...fields,
      kind,
      description: text,
      company: companyValue,
      deviceId: deviceId(),
      clientRequestId: requestId,
      online: typeof navigator === "undefined" ? true : navigator.onLine,
    })
      .then((result) => {
        if (result.status === "sent") {
          setConfirmation(result.identifier ? `Got it, ${result.identifier}` : "Got it.");
          setDescription("");
          requestRef.current = null;
          return;
        }
        if (result.status === "offline") {
          setProblem(OFFLINE_MESSAGE);
          return;
        }
        if (result.status === "unconfigured") {
          setProblem(UNCONFIGURED_MESSAGE);
          return;
        }
        setProblem(RETRY_MESSAGE);
      })
      .catch(() => {
        setProblem(RETRY_MESSAGE);
      })
      .finally(() => {
        sendingRef.current = false;
        setSending(false);
      });
  }

  return (
    <form className="feedback-form" noValidate onSubmit={onSubmit} data-feedback-kind={kind}>
      <div className="honeypot" data-honeypot="" aria-hidden="true">
        <label>
          Company
          <input
            name="hp_field"
            value={company}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>
      </div>
      <label className="feedback-label" htmlFor={fieldId}>
        Description
        <textarea
          id={fieldId}
          className="answer-input feedback-input"
          value={description}
          rows={4}
          required
          maxLength={DESCRIPTION_MAX}
          autoFocus={autoFocus}
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck
          enterKeyHint="done"
          aria-invalid={tooShort || problem !== null}
          aria-describedby={describedBy}
          disabled={sending}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <div className="feedback-meta" id={hintId}>
        <span>{tooShort ? "Write at least 5 characters." : "At least 5 characters."}</span>
        <span>
          {trimmed.length}/{DESCRIPTION_MAX}
        </span>
      </div>
      {confirmation ? (
        <p className="form-note is-ok" role="status" id={statusId}>
          {confirmation}
        </p>
      ) : null}
      {problem ? (
        <p className="form-note is-error" role="alert" id={statusId}>
          {problem}
        </p>
      ) : null}
      <button type="submit" className="primary" disabled={!ready || sending} aria-busy={sending}>
        {sending ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
