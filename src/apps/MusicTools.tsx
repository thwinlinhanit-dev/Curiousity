import { useCallback, useEffect, useRef, useState } from "react";

type Voice = "left" | "right";
type ClickEvent = { time: number; voice: Voice; used: boolean };

const PATTERNS = [
  { key: "3:2", a: 3, b: 2, label: "Three against two" },
  { key: "2:3", a: 2, b: 3, label: "Two against three" },
  { key: "4:3", a: 4, b: 3, label: "Four against three" },
  { key: "3:4", a: 3, b: 4, label: "Three against four" },
  { key: "5:4", a: 5, b: 4, label: "Five against four" },
];

function useAudio() {
  const ref = useRef<AudioContext | null>(null);
  const get = useCallback(() => {
    if (!ref.current) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ref.current = new C();
    }
    if (ref.current.state === "suspended") void ref.current.resume();
    return ref.current;
  }, []);
  useEffect(() => () => { void ref.current?.close(); }, []);
  return get;
}

export default function MusicTools() {
  const audio = useAudio();
  const [tab, setTab] = useState<"metro" | "rhythm">("metro");

  // Metronome
  const [bpm, setBpm] = useState(90);
  const [beats, setBeats] = useState(4);
  const [div, setDiv] = useState(1);
  const [metroOn, setMetroOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const metroRef = useRef({ next: 0, step: 0 });

  // Rhythm trainer
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [rBpm, setRBpm] = useState(72);
  const [playing, setPlaying] = useState(false);
  const [tapMode, setTapMode] = useState(false);
  const [errors, setErrors] = useState<number[]>([]);
  const [lit, setLit] = useState<Voice | null>(null);
  const evRef = useRef<ClickEvent[]>([]);
  const cycleRef = useRef(0);
  const nextCycleRef = useRef(0);

  const click = (time: number, high: boolean, voice: Voice = "left") => {
    const ctx = audio(); const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = high ? "square" : "sine";
    o.frequency.value = voice === "left" ? (high ? 1200 : 800) : (high ? 660 : 440);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.09, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
    o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time + 0.09);
  };

  useEffect(() => {
    if (!metroOn) return;
    const ctx = audio();
    metroRef.current.next = ctx.currentTime + 0.05; metroRef.current.step = 0;
    const tick = () => {
      const now = ctx.currentTime;
      while (metroRef.current.next < now + 0.12) {
        const step = metroRef.current.step;
        const inBeat = step % div;
        click(metroRef.current.next, inBeat === 0 && step / div % beats === 0, inBeat === 0 ? "left" : "right");
        setBeat(Math.floor(step / div) % beats);
        metroRef.current.next += 60 / bpm / div;
        metroRef.current.step++;
      }
    };
    tick();
    const id = setInterval(tick, 25);
    return () => clearInterval(id);
  }, [metroOn, bpm, beats, div]);

  useEffect(() => {
    if (!playing) return;
    const ctx = audio();
    const cycle = (60 / rBpm) * 4;
    cycleRef.current = cycle;
    nextCycleRef.current = ctx.currentTime + 0.1;
    evRef.current = [];
    const fill = () => {
      const start = nextCycleRef.current;
      for (let i = 0; i < pattern.a; i++) evRef.current.push({ time: start + (i * cycle) / pattern.a, voice: "left", used: false });
      for (let j = 0; j < pattern.b; j++) evRef.current.push({ time: start + (j * cycle) / pattern.b, voice: "right", used: false });
      nextCycleRef.current += cycle;
    };
    fill();
    const id = setInterval(() => {
      const now = ctx.currentTime;
      while (nextCycleRef.current < now + 0.3) fill();
      const soon = evRef.current.find((e) => !e.used && Math.abs(e.time - now) < 0.045);
      if (soon) { setLit(soon.voice); click(now + 0.005, false, soon.voice); soon.used = true; }
      else setLit(null);
      evRef.current = evRef.current.filter((e) => e.time > now - 0.5);
    }, 20);
    return () => clearInterval(id);
  }, [playing, pattern, rBpm]);

  const tap = (voice: Voice) => {
    if (!tapMode || !playing) return;
    const now = audio().currentTime;
    const candidates = evRef.current.filter((e) => !e.used && e.voice === voice);
    if (!candidates.length) return;
    candidates.sort((a, b) => Math.abs(a.time - now) - Math.abs(b.time - now));
    const err = Math.abs(candidates[0].time - now) * 1000;
    candidates[0].used = true;
    setErrors((e) => [...e.slice(-19), Math.round(err)]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.toLowerCase() === "a") tap("left");
      if (e.key.toLowerCase() === "l") tap("right");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tapMode, playing, audio, pattern.a, pattern.b]);

  const avg = errors.length ? Math.round(errors.reduce((a, b) => a + b, 0) / errors.length) : null;

  return (
    <section className="app-section" aria-labelledby="music-title">
      <p className="eyebrow">MUSIC · PRACTICE TOOLS</p>
      <h2 id="music-title" className="app-heading">Keep steady time</h2>
      <p className="app-lead">A metronome for any exercise, and a two-hand rhythm trainer for patterns like three against two. Nothing plays until you press start, and all the sounds are made in your browser.</p>

      <div className="app-toolbar" role="group" aria-label="Music tool">
        <button className={tab === "metro" ? "chip active" : "chip"} aria-pressed={tab === "metro"} onClick={() => { setMetroOn(false); setTab("metro"); }}>Metronome</button>
        <button className={tab === "rhythm" ? "chip active" : "chip"} aria-pressed={tab === "rhythm"} onClick={() => { setPlaying(false); setTab("rhythm"); }}>Rhythm trainer</button>
      </div>

      {tab === "metro" && (
        <div className="app-panel mt-panel">
          <div className="app-toolbar">
            <label>Tempo <input type="number" min={40} max={240} value={bpm} onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 90)))} /> bpm</label>
            <label>Beats per bar
              <select value={beats} onChange={(e) => setBeats(Number(e.target.value))}>{[2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
            <label>Subdivision
              <select value={div} onChange={(e) => setDiv(Number(e.target.value))}>
                <option value={1}>Quarters</option><option value={2}>Eighths</option><option value={3}>Triplets</option><option value={4}>Sixteenths</option>
              </select></label>
            <button className="btn-primary" onClick={() => setMetroOn(!metroOn)}>{metroOn ? "Stop" : "Start"}</button>
          </div>
          <div className="mt-beats" aria-hidden="true">
            {Array.from({ length: beats }, (_, i) => <span key={i} className={metroOn && i === beat ? "on" : ""}>{i + 1}</span>)}
          </div>
          <p className="app-muted">Accent on the first beat of the bar. Use headphones if you are practising in a group.</p>
        </div>
      )}

      {tab === "rhythm" && (
        <div className="app-panel">
          <div className="app-toolbar">
            <label>Pattern
              <select value={pattern.key} onChange={(e) => { setPlaying(false); setPattern(PATTERNS.find((p) => p.key === e.target.value)!); setErrors([]); }}>
                {PATTERNS.map((p) => <option key={p.key} value={p.key}>{p.label} ({p.key})</option>)}
              </select></label>
            <label>Tempo <input type="number" min={50} max={160} value={rBpm} onChange={(e) => setRBpm(Math.max(50, Math.min(160, Number(e.target.value) || 72)))} /> bpm</label>
            <button className="btn-primary" onClick={() => setPlaying(!playing)}>{playing ? "Stop" : "Play pattern"}</button>
            <button className={tapMode ? "btn btn-primary" : "btn"} aria-pressed={tapMode} onClick={() => { setTapMode(!tapMode); setErrors([]); }}>Tap along</button>
          </div>
          <p style={{ color: "var(--ink-2)" }}>{pattern.label}: the left hand plays {pattern.a} even beats across the bar, the right hand plays {pattern.b}. They meet at the start and end of each bar.</p>
          <div className="rh-voices">
            {(["left", "right"] as const).map((v) => (
              <button key={v} className={`rh-voice ${lit === v ? "lit" : ""}`} onClick={() => tap(v)} disabled={!tapMode || !playing}>
                <span className="app-kicker">{v === "left" ? "A · LEFT HAND" : "L · RIGHT HAND"}</span>
                <b>{v === "left" ? pattern.a : pattern.b} beats per bar</b>
              </button>
            ))}
          </div>
          {tapMode && <div className="rh-score" role="status">
            <span className="app-kicker">Timing</span>
            <b className="tabular">{avg === null ? "—" : `${avg} ms`}</b>
            <span className="app-muted">average error · {errors.length} taps (lower is better)</span>
            <button className="btn" onClick={() => setErrors([])}>Reset score</button>
          </div>}
        </div>
      )}

      <p className="app-attribution">
        Practice ideas adapted from <a href="https://teddyrookbook.com/music/" target="_blank" rel="noreferrer">Teddy Rook Book — Music</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
