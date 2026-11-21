import { useEffect, useState } from "react";
import { t, useT } from "../i18n";

// Browser SpeechSynthesis: zero-cost, no API key, works offline with local voices.
// (Deviation from the spec's pre-generated mp3 — logged as D12.)
export default function NarrationBar({ text, rate }: { text: string; rate: number }) {
  useT();
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices().filter((v) => v.localService));
    load(); window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => { window.speechSynthesis.removeEventListener("voiceschanged", load); window.speechSynthesis.cancel(); };
  }, [supported]);

  if (!supported) return null;

  const speak = () => {
    window.speechSynthesis.cancel();
    const clean = text.replace(/\$[^$]*\$/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    const chosen = voices.find((v) => v.voiceURI === voiceURI);
    if (chosen) u.voice = chosen;
    u.rate = Math.max(0.5, Math.min(1.5, rate));
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const stop = () => { window.speechSynthesis.cancel(); setSpeaking(false); };
  const cleanText = () => text.replace(/\$[^$]*\$/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const transcript = () => {
    const url = URL.createObjectURL(new Blob([`${cleanText()}\n`], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = url; a.download = "lesson-transcript.txt"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="narration-bar" role="group" aria-label="Narration">
      <button className="btn" onClick={speaking ? stop : speak} aria-pressed={speaking}>
        {speaking ? t("lesson.stopNarration") : t("lesson.narrate")}
      </button>
      <select aria-label="Narration voice" value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
        <option value="">Browser default</option>
        {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
      </select>
      <button className="btn-link" onClick={transcript}>Download transcript</button>
      <span style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>local voice · {rate}×</span>
    </div>
  );
}
