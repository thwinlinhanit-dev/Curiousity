import { useEffect, useState } from "react";
import { t, useT } from "../i18n";

// Browser SpeechSynthesis: zero-cost, no API key, works offline with local voices.
// (Deviation from the spec's pre-generated mp3 — logged as D12.)
export default function NarrationBar({ text, rate }: { text: string; rate: number }) {
  useT();
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  if (!supported) return null;

  const speak = () => {
    window.speechSynthesis.cancel();
    const clean = text.replace(/\$[^$]*\$/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = Math.max(0.5, Math.min(1.5, rate));
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const stop = () => { window.speechSynthesis.cancel(); setSpeaking(false); };

  return (
    <div className="narration-bar" role="group" aria-label="Narration">
      <button className="btn" onClick={speaking ? stop : speak} aria-pressed={speaking}>
        {speaking ? t("lesson.stopNarration") : t("lesson.narrate")}
      </button>
      <span style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>voice · browser · {rate}×</span>
    </div>
  );
}
