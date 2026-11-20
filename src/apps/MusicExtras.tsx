import { useEffect, useRef, useState } from "react";

const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
function noteOf(freq: number) {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const cents = Math.round((69 + 12 * Math.log2(freq / 440) - midi) * 100);
  return { name: NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1), cents };
}

function Tuner() {
  const [active, setActive] = useState(false), [reading, setReading] = useState<{ name: string; cents: number } | null>(null), [error, setError] = useState("");
  const ctx = useRef<AudioContext | null>(null), stream = useRef<MediaStream | null>(null), raf = useRef(0);
  const stop = () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null;
    void ctx.current?.close(); ctx.current = null; setActive(false); setReading(null);
  };
  useEffect(() => () => stop(), []);
  const start = async () => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.current = s;
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new C(); ctx.current = c;
      const src = c.createMediaStreamSource(s), an = c.createAnalyser(); an.fftSize = 4096; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const tick = () => {
        an.getFloatTimeDomainData(buf);
        let best = 0, bestI = 0;
        for (let i = 2; i < buf.length / 2; i++) { const v = Math.abs(buf[i] - buf[i - 1]); if (v > best) { best = v; bestI = i; } }
        if (best > 0.01) { const f = c.sampleRate / an.fftSize * bestI; if (f > 60 && f < 2000) setReading(noteOf(f)); }
        raf.current = requestAnimationFrame(tick);
      };
      tick(); setActive(true);
    } catch { setError("Microphone access was denied. Nothing is recorded or sent anywhere — the tuner runs entirely in your browser."); }
  };
  return <>
    <p className="app-muted">Play a note and the needle shows how close you are. The microphone is used only to detect pitch in this tab — nothing is recorded, stored or sent.</p>
    <div className="app-toolbar"><button className="btn-primary" onClick={active ? stop : start}>{active ? "Stop tuner" : "Start the tuner"}</button></div>
    {error && <p className="app-feedback no">{error}</p>}
    {reading && <div className="tn-read"><b>{reading.name}</b><div className="tn-meter"><span style={{ left: `${Math.max(0, Math.min(100, 50 + reading.cents / 2))}%` }} /></div><span className="app-muted">{reading.cents > 0 ? "+" : ""}{reading.cents} cents</span></div>}
  </>;
}

const CHORDS: Record<string, { frets: number[]; label: string }> = {
  C: { frets: [-1, 3, 2, 0, 1, 0], label: "x32010" }, G: { frets: [3, 2, 0, 0, 0, 3], label: "320003" },
  D: { frets: [-1, -1, 0, 2, 3, 2], label: "xx0232" }, A: { frets: [-1, 0, 2, 2, 2, 0], label: "x02220" },
  E: { frets: [0, 2, 2, 1, 0, 0], label: "022100" }, Am: { frets: [-1, 0, 2, 2, 1, 0], label: "x02210" },
  Em: { frets: [0, 2, 2, 0, 0, 0], label: "022000" }, Dm: { frets: [-1, -1, 0, 2, 3, 1], label: "xx0231" },
  F: { frets: [1, 3, 3, 2, 1, 1], label: "133211" },
};
function ChordFinder() {
  const [name, setName] = useState("C"), [picked, setPicked] = useState("");
  const c = CHORDS[name];
  return <>
    <p className="app-muted">Finger a chord and see its shape, or tap a shape to name it. Numbers are frets; “x” means don't play that string.</p>
    <div className="app-toolbar"><label>Chord <select value={name} onChange={(e) => setName(e.target.value)}>{Object.keys(CHORDS).map((k) => <option key={k}>{k}</option>)}</select></label>
      <span className="app-tag">{c.label}</span></div>
    <div className="chord-grid">{Object.keys(CHORDS).map((k) => <button key={k} className={picked === k ? "chord-tile active" : "chord-tile"} onClick={() => { setName(k); setPicked(k); }}>
      <svg viewBox="0 0 80 100" width="70" aria-label={`${k} chord: ${CHORDS[k].label}`}>
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="10" x2="70" y1={15 + i * 18} y2={15 + i * 18} stroke="currentColor" strokeWidth="1" />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={10 + i * 12} x2={10 + i * 12} y1="15" y2="87" stroke="currentColor" strokeWidth="1" />)}
        {CHORDS[k].frets.map((f, i) => f > 0 ? <circle key={i} cx={16 + i * 12} cy={24 + (f - 1) * 18} r="4" fill="currentColor" /> : null)}
        {CHORDS[k].frets.map((f, i) => f < 0 ? <text key={i} x={13 + i * 12} y="11" fontSize="10">x</text> : null)}
      </svg><b>{k}</b></button>)}</div>
    {picked && <p className="app-feedback ok" role="status">That shape is {picked}.</p>}
  </>;
}

const DRILLS = [
  ["E", "bottom line of the treble staff"], ["G", "second line"], ["B", "middle line"], ["D", "fourth line"], ["F", "top line"],
  ["F", "first space"], ["A", "second space"], ["C", "third space"], ["E", "top space"],
];
function ReadingDrills() {
  const [i, setI] = useState(0), [answer, setAnswer] = useState(""), [score, setScore] = useState(0), [done, setDone] = useState(false);
  const best = () => { try { return Number(localStorage.getItem("trb-reading-best") || 0); } catch { return 0; } };
  const submit = () => {
    if (answer.trim().toUpperCase() === DRILLS[i][0]) setScore(score + 1);
    if (i + 1 >= DRILLS.length) { setDone(true); const b = Math.max(best(), score); try { localStorage.setItem("trb-reading-best", String(b)); } catch { /* private */ } }
    else { setI(i + 1); setAnswer(""); }
  };
  const restart = () => { setI(0); setScore(0); setAnswer(""); setDone(false); };
  return <>
    <p className="app-muted">Ten short rounds: name the note from its place on the treble staff. Your best score is kept in this browser.</p>
    {!done ? <div className="app-panel"><span className="app-kicker">QUESTION {i + 1} / {DRILLS.length}</span>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)" }}>{DRILLS[i][1]}</p>
      <div className="word-input-row"><input aria-label="Note name" value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <button className="btn-primary" onClick={submit}>Check</button></div>
      <p className="app-muted">Score {score} · best {best()}</p>
    </div> : <div className="app-feedback ok" role="status"><p>{score} / {DRILLS.length} correct · best {best()}</p><button className="btn" onClick={restart}>Another round</button></div>}
  </>;
}

const TOOLS = [
  { id: "tuner", name: "Tuner", icon: "🎚️", comp: Tuner },
  { id: "chords", name: "Chord finder", icon: "🎸", comp: ChordFinder },
  { id: "drills", name: "Reading drills", icon: "🎼", comp: ReadingDrills },
];
export default function MusicExtras() {
  const [id, setId] = useState("tuner");
  const Comp = TOOLS.find((t) => t.id === id)!.comp;
  return (
    <section className="app-section" aria-labelledby="mex-title">
      <p className="eyebrow">MUSIC · PRACTICE TOOLS</p>
      <h2 id="mex-title" className="app-heading">Tune, find chords, read notes</h2>
      <p className="app-lead">Three more tools for the music room, alongside the metronome and rhythm trainer. All work offline; the tuner uses your microphone only while it is running.</p>
      <div className="app-toolbar" role="group" aria-label="Music tool">{TOOLS.map((t) => <button key={t.id} className={id === t.id ? "chip active" : "chip"} aria-pressed={id === t.id} onClick={() => setId(t.id)}>{t.icon} {t.name}</button>)}</div>
      <div className="app-panel"><Comp key={id} /></div>
      <p className="app-attribution">Adapted from <a href="https://teddyrookbook.com/music/" target="_blank" rel="noreferrer">Teddy Rook Book — Music</a> · CC BY-NC 4.0</p>
    </section>
  );
}
