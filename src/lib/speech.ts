import { appConfig } from "../config/app.config";

export type VoiceLike = {
  lang: string;
  name: string;
};

export type SpeechResult = { ok: true } | { ok: false; reason: string };

export function normalizeLang(lang: string): string {
  return lang.toLowerCase().replaceAll("_", "-");
}

function matchesLanguage(lang: string, wanted: string): boolean {
  const value = normalizeLang(lang);
  const target = normalizeLang(wanted);
  return value === target || value.startsWith(`${target}-`);
}

export function pickVoice(
  voices: readonly VoiceLike[],
  preferredLocale: string,
  fallbackLanguage: string,
): VoiceLike | null {
  const preferred = voices.find((voice) => matchesLanguage(voice.lang, preferredLocale));
  if (preferred) return preferred;
  return voices.find((voice) => matchesLanguage(voice.lang, fallbackLanguage)) ?? null;
}

let listeningForVoices = false;

export function primeSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.getVoices();
  synth.resume();
  if (listeningForVoices) return;
  listeningForVoices = true;
  synth.addEventListener("voiceschanged", () => {
    synth.getVoices();
  });
}

export function speakSpanish(text: string): SpeechResult {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return { ok: false, reason: "Speech isn't available in this browser." };
  }

  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const picked = pickVoice(
    voices.map((voice) => ({ lang: voice.lang, name: voice.name })),
    appConfig.voice.locale,
    appConfig.voice.fallbackLanguage,
  );
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = picked?.lang ?? appConfig.voice.locale;
  if (picked) {
    const match = voices.find((voice) => voice.lang === picked.lang && voice.name === picked.name);
    if (match) utterance.voice = match;
  }
  utterance.rate = 0.92;
  synth.cancel();
  synth.resume();
  synth.speak(utterance);
  return { ok: true };
}
