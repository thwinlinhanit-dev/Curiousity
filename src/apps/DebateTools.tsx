import { useEffect, useMemo, useRef, useState } from "react";

type Speech = { short: string; name: string; side: string; seconds: number; kind: string; job: string };
type Format = { key: string; name: string; short: string; team: string; summary: string; prep: { seconds: number; per: string; note: string } | null; speeches: Speech[] };
type FormatData = { formats: Format[] };
type Resolution = { title: string; meta: { key: string; resolution: string; summary: string; sides?: { aff?: { label: string; stance: string }; neg?: { label: string; stance: string } }; strawmen?: { target: string; steelman: string }[]; cx?: { aff: string[]; neg: string[] } } };
type DebateData = { items: Resolution[] };

const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const load = (url: string) => fetch(`${import.meta.env.BASE_URL}${url}`).then((r) => r.json());

export default function DebateTools() {
  const [tab, setTab] = useState<"timer" | "flow" | "case">("timer");
  const [formats, setFormats] = useState<Format[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [fkey, setFkey] = useState("policy");
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(480);
  const [running, setRunning] = useState(false);
  const [prep, setPrep] = useState<"off" | "aff" | "neg">("off");
  const [prepLeft, setPrepLeft] = useState({ aff: 480, neg: 480 });
  const [rkey, setRkey] = useState("");
  const [flow, setFlow] = useState<Record<string, string>>({});
  const [caseText, setCaseText] = useState<Record<string, string>>({});
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    load("content/apps/debate-formats.json").then((d: FormatData) => setFormats(d.formats)).catch(() => undefined);
    load("content/data/debate.json").then((d: DebateData) => { setResolutions(d.items); setRkey(d.items[0]?.meta.key ?? ""); }).catch(() => undefined);
  }, []);

  const format = formats.find((f) => f.key === fkey) ?? formats[0];
  const speech = format?.speeches[idx];
  const total = speech?.seconds ?? 480;

  useEffect(() => { if (format) { setIdx(0); setRemaining(format.speeches[0]?.seconds ?? 480); setRunning(false); } }, [format]);

  const deadline = useRef(0);
  const beeped = useRef(false);
  useEffect(() => {
    if (!running) return;
    // Wall-clock deadline: a 1 s decrement drifts badly in a throttled tab.
    const secondsLeft = prep === "off" ? remaining : prepLeft[prep];
    deadline.current = Date.now() + secondsLeft * 1000;
    beeped.current = false;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      if (prep === "off") setRemaining(left);
      else setPrepLeft((p) => ({ ...p, [prep]: left }));
      if (left === 0 && !beeped.current) { beeped.current = true; beep(); setRunning(false); }
    }, 200);
    return () => clearInterval(t);
  }, [running, prep]);
  useEffect(() => () => { void audio.current?.close(); }, []);

  const beep = () => {
    try {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio.current ??= new C();
      const o = audio.current.createOscillator(), g = audio.current.createGain();
      o.frequency.value = 660; g.gain.value = 0.08; o.connect(g); g.connect(audio.current.destination);
      o.start(); o.stop(audio.current.currentTime + 0.25);
    } catch { /* audio optional */ }
  };
  const advance = () => {
    if (!format) return;
    beep(); setRunning(false); setPrep("off");
    if (idx < format.speeches.length - 1) { setIdx(idx + 1); setRemaining(format.speeches[idx + 1].seconds); }
  };
  const reset = () => { setRunning(false); setPrep("off"); setRemaining(total); };

  const resolution = resolutions.find((r) => r.meta.key === rkey);
  const storeKey = (prefix: string) => `trb-debate-${prefix}-${rkey}`;
  useEffect(() => {
    if (!rkey) return;
    try {
      setFlow(JSON.parse(localStorage.getItem(storeKey("flow")) || "{}"));
      setCaseText(JSON.parse(localStorage.getItem(storeKey("case")) || "{}"));
    } catch { setFlow({}); setCaseText({}); }
  }, [rkey]);
  const save = (prefix: string, value: Record<string, string>) => {
    try { localStorage.setItem(storeKey(prefix), JSON.stringify(value)); } catch { /* private mode */ }
  };
  const setFlowField = (k: string, v: string) => { const n = { ...flow, [k]: v }; setFlow(n); save("flow", n); };
  const setCaseField = (k: string, v: string) => { const n = { ...caseText, [k]: v }; setCaseText(n); save("case", n); };

  const flowRows = useMemo(() => {
    if (!format) return [];
    return format.speeches.map((s) => s.short);
  }, [format]);

  return (
    <section className="app-section" aria-labelledby="debate-title">
      <p className="eyebrow">DEBATE · TOOLS</p>
      <h2 id="debate-title" className="app-heading">A timer, a flow sheet and a case builder</h2>
      <p className="app-lead">Everything a new debater needs for practice: the speech times of each format, a place to flow a round, and both sides of 50 resolutions at their strongest. Your notes stay in this browser.</p>

      <div className="app-toolbar" role="group" aria-label="Debate tool">
        {(["timer", "flow", "case"] as const).map((x) => (
          <button key={x} className={tab === x ? "chip active" : "chip"} aria-pressed={tab === x} onClick={() => setTab(x)}>
            {x === "timer" ? "Timer" : x === "flow" ? "Flow sheet" : "Case builder"}
          </button>
        ))}
      </div>

      {tab === "timer" && (
        <div className="app-grid-2">
          <div className="app-panel">
            <div className="app-toolbar"><label>Format
              <select value={fkey} onChange={(e) => setFkey(e.target.value)}>
                {formats.map((f) => <option key={f.key} value={f.key}>{f.name} ({f.short})</option>)}
              </select></label></div>
            <div className="db-clock" role="timer" aria-live="off">
              <span className="app-kicker">{prep !== "off" ? `${prep.toUpperCase()} PREP` : `${speech?.short ?? ""} · ${speech?.name ?? ""}`}</span>
              <strong>{fmt(prep !== "off" ? prepLeft[prep] : remaining)}</strong>
              <span className="app-muted">of {fmt(prep !== "off" ? (format?.prep?.seconds ?? 480) : total)}</span>
            </div>
            <div className="app-toolbar">
              <button className="btn-primary" onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</button>
              <button className="btn" onClick={() => setRemaining((r) => Math.max(0, r - 10))}>−10s</button>
              <button className="btn" onClick={() => setRemaining((r) => r + 10)}>+10s</button>
              <button className="btn" onClick={reset}>Reset</button>
              <button className="btn" onClick={advance} disabled={idx >= (format?.speeches.length ?? 1) - 1}>Next ⏭</button>
            </div>
            <div className="app-toolbar">
              <button className="btn" onClick={() => { const i = Math.max(0, idx - 1); setIdx(i); setRemaining(format?.speeches[i]?.seconds ?? 480); setRunning(false); setPrep("off"); }}>⏮ Back</button>
              {format?.prep && (["aff", "neg"] as const).map((s) => (
                <button key={s} className={prep === s ? "btn btn-primary" : "btn"} onClick={() => { setRunning(true); setPrep(prep === s ? "off" : s); }}>
                  {s.toUpperCase()} prep ({fmt(prepLeft[s])})
                </button>
              ))}
            </div>
            <p className="app-muted">Speech {idx + 1} of {format?.speeches.length ?? 0}. {speech?.side === "aff" ? "Affirmative" : "Negative"} · {speech?.kind}.</p>
            {speech?.job && <p style={{ color: "var(--ink-2)", fontSize: "var(--fs-0)" }}><b>Job:</b> {speech.job}</p>}
          </div>
          <div className="app-panel">
            <h3 style={{ marginTop: 0 }}>The round, in order</h3>
            <ol className="db-speeches">
              {format?.speeches.map((s, i) => (
                <li key={i}>
                  <button className={i === idx ? "db-speech active" : "db-speech"} onClick={() => { setIdx(i); setRemaining(s.seconds); setRunning(false); setPrep("off"); }}>
                    <span>{s.short}</span><b>{s.name}</b><span className="tabular">{fmt(s.seconds)}</span>
                  </button>
                </li>
              ))}
            </ol>
            {format?.prep?.note && <p className="app-muted">{format.prep.note}</p>}
          </div>
        </div>
      )}

      {tab === "flow" && (
        <div className="app-panel">
          <div className="app-toolbar"><label>Resolution
            <select value={rkey} onChange={(e) => setRkey(e.target.value)}>
              {resolutions.map((r) => <option key={r.meta.key} value={r.meta.key}>{r.title}</option>)}
            </select></label>
            <button className="btn" onClick={() => window.print()}>Print flow</button>
          </div>
          {resolution && <p style={{ color: "var(--ink-2)" }}><b>{resolution.meta.resolution}</b></p>}
          <div className="db-flow">
            {flowRows.map((short) => (
              <div className="db-flow-row" key={short}>
                <span className="db-flow-label">{short}</span>
                {(["aff", "neg"] as const).map((side) => (
                  <textarea key={side} aria-label={`${short} ${side}`} placeholder={`${side.toUpperCase()} · ${short}`}
                    value={flow[`${short}-${side}`] ?? ""} onChange={(e) => setFlowField(`${short}-${side}`, e.target.value)} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "case" && (
        <div className="app-panel">
          <div className="app-toolbar"><label>Resolution
            <select value={rkey} onChange={(e) => setRkey(e.target.value)}>
              {resolutions.map((r) => <option key={r.meta.key} value={r.meta.key}>{r.title}</option>)}
            </select></label>
            <button className="btn" onClick={() => window.print()}>Print case</button>
          </div>
          {resolution ? (
            <div className="app-grid-2">
              {(["aff", "neg"] as const).map((side) => {
                const s = resolution.meta.sides?.[side];
                const steel = resolution.meta.strawmen?.find((x) => x.target === side)?.steelman;
                return (
                  <div key={side}>
                    <h3>{side === "aff" ? "Affirmative" : "Negative"}</h3>
                    <p style={{ color: "var(--ink-2)" }}><b>{s?.label}</b> — {s?.stance}</p>
                    {steel && <p className="app-muted"><b>Strongest version:</b> {steel}</p>}
                    <label className="app-muted">Your constructive
                      <textarea className="db-case" value={caseText[`${side}-constructive`] ?? ""} onChange={(e) => setCaseField(`${side}-constructive`, e.target.value)} placeholder="Write your case…" />
                    </label>
                    <label className="app-muted">Your rebuttal
                      <textarea className="db-case" value={caseText[`${side}-rebuttal`] ?? ""} onChange={(e) => setCaseField(`${side}-rebuttal`, e.target.value)} placeholder="Answer their case…" />
                    </label>
                    {resolution.meta.cx?.[side]?.length ? (
                      <div><b className="app-muted">Cross-examination questions</b>
                        <ul className="app-muted">{resolution.meta.cx[side].map((q, i) => <li key={i}>{q}</li>)}</ul>
                      </div>) : null}
                  </div>
                );
              })}
            </div>
          ) : <p className="app-muted">Loading resolutions…</p>}
        </div>
      )}

      <p className="app-attribution">
        Adapted from <a href="https://teddyrookbook.com/debate/" target="_blank" rel="noreferrer">Teddy Rook Book — Debate</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
