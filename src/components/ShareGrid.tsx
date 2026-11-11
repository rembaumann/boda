import { useState } from "react";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyResultButton({
  text,
  className,
  onResult,
}: {
  text: string;
  className?: string;
  onResult?: (copied: boolean) => void;
}) {
  const [label, setLabel] = useState("Copy result");

  return (
    <button
      type="button"
      className={className ?? "text-button wide"}
      onClick={() => {
        void writeClipboard(text).then((copied) => {
          setLabel(copied ? "Copied" : "Copy failed");
          onResult?.(copied);
        });
      }}
    >
      {label}
    </button>
  );
}

export function ShareGrid({ text }: { text: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="share-block">
      <p className="section-title">Share</p>
      <pre className="share-grid" data-share-grid>
        {text}
      </pre>
      {failed ? (
        <textarea className="answer-input share-fallback" readOnly value={text} aria-label="Result to copy" />
      ) : null}
      <CopyResultButton text={text} className="secondary" onResult={(copied) => setFailed(!copied)} />
      {failed ? <p className="quiet">Select the result and copy it.</p> : null}
    </div>
  );
}
