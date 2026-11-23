import { SpeakerHigh } from "@phosphor-icons/react";
import { useState } from "react";
import { speakSpanish } from "../lib/speech";

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
        <SpeakerHigh size={22} weight="bold" aria-hidden />
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
