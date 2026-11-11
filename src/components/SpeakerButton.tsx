import { useState } from "react";
import { speakSpanish } from "../lib/speech";

function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 9.2h3.1L12 5.4v13.2l-4.9-3.8H4V9.2zm9.8.4a4.2 4.2 0 0 1 0 4.8l-1.3-1a2.5 2.5 0 0 0 0-2.8l1.3-1zm2.5-2.2a7.4 7.4 0 0 1 0 9.2l-1.3-1a5.6 5.6 0 0 0 0-7.2l1.3-1z"
      />
    </svg>
  );
}

export function SpeakerButton({ text, size }: { text: string; size: "regular" | "large" }) {
  const [note, setNote] = useState<string | null>(null);
  const label = size === "large" ? "Tap to listen" : "Hear it";

  return (
    <div className={size === "large" ? "speaker-wrap is-large" : "speaker-wrap"}>
      <button
        type="button"
        className={size === "large" ? "speaker is-large" : "speaker"}
        data-action="speak"
        onClick={() => {
          const result = speakSpanish(text);
          setNote(result.ok ? null : result.reason);
        }}
      >
        <SpeakerIcon />
        <span>{label}</span>
      </button>
      {note ? (
        <p className="speaker-note" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}
