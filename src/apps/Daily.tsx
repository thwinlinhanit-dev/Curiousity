import { useEffect, useMemo, useState } from "react";
import { lastWeeks, overview } from "../state/learning";
import { getEngine, getGraph } from "../state/progress";
import { plural } from "../utils/plural";

type Answers = { who: string; ages: string[]; goals: string[]; subjects: string[]; minutes: string };
const EMPTY: Answers = { who: "", ages: [], goals: [], subjects: [], minutes: "" };

const QUESTIONS = [
  { key: "who" as const, q: "Who is it for?", opts: ["Myself", "My child or children", "A class or co-op"] },
  { key: "ages" as const, q: "How old?", opts: ["3 to 5", "6 to 8", "9 to 11", "12 to 14", "15 to 18", "Adult"], multi: true },
  { key: "goals" as const, q: "What are you hoping for?", opts: ["A full homeschool", "One subject", "Test prep", "Life skills", "Reading the great books", "Fun and games"], multi: true },
  { key: "subjects" as const, q: "Any subjects in mind?", opts: ["Reading and phonics", "Math", "Science", "History", "Greek, Latin and ASL", "Music", "Logic and debate"], multi: true },
  { key: "minutes" as const, q: "How much time a day?", opts: ["About 15 minutes", "About 30 minutes", "About an hour", "Two hours or more"] },
];

function go(url: string) { window.location.href = url; }
const openApp = (id: string) => go(`?app=${id}`);

function Quiz() {
  const [step, setStep] = useState(0), [a, setA] = useState<Answers>(EMPTY), [done, setDone] = useState(false);
  const pick = (key: keyof Answers, v: string, multi?: boolean) => {
    if (multi) {
      const cur = a[key] as string[];
      setA({ ...a, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
    } else setA({ ...a, [key]: v });
  };
  const start = useMemo(() => {
    const out: { label: string; url: string }[] = [];
    if (a.goals.includes("A full homeschool")) out.push({ label: "Plan the school day", url: "?app=school" });
    if (a.goals.includes("Test prep")) out.push({ label: "Timed test practice", url: "?app=testprep" });
    if (a.goals.includes("Life skills")) out.push({ label: "Being an Adult 101", url: "?app=life" });
    if (a.goals.includes("Reading the great books")) out.push({ label: "Reading paths", url: "?app=paths" });
    if (a.goals.includes("Fun and games")) out.push({ label: "Games", url: "?app=games" });
    if (a.subjects.includes("Math")) out.push({ label: "Math Ladder", url: "?s=math&c=alg1" });
    if (a.subjects.includes("Greek, Latin and ASL")) out.push({ label: "Language lab", url: "?app=languages" });
    if (a.subjects.includes("Music")) out.push({ label: "Music tools", url: "?app=music-tools" });
    if (a.subjects.includes("Reading and phonics")) out.push({ label: "Phonics", url: "?app=library" });
    if (!out.length) out.push({ label: "Explore the subject ladders", url: "/" }, { label: "Daily word puzzle", url: "?app=word" });
    return out.slice(0, 6);
  }, [a]);
  const Q = QUESTIONS[step];
  return <div className="app-panel">
    {!done ? <>
      <span className="app-kicker">STEP {step + 1} OF {QUESTIONS.length} · SKIP ANY QUESTION</span>
      <h3 style={{ fontFamily: "var(--font-display)" }}>{Q.q}</h3>
      <div className="app-toolbar">{Q.opts.map((o) => {
        const selected = Q.multi ? (a[Q.key] as string[]).includes(o) : a[Q.key] === o;
        return <button key={o} className={selected ? "chip active" : "chip"} aria-pressed={selected} onClick={() => pick(Q.key, o, Q.multi)}>{o}</button>;
      })}</div>
      <div className="app-toolbar">
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>← Back</button>}
        <button className="btn" onClick={() => { setStep(step + 1); if (step === QUESTIONS.length - 1) setDone(true); }}>{step === QUESTIONS.length - 1 ? "Show my starting points" : "Next →"}</button>
      </div>
    </> : <>
      <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Good places to start</h3>
      <p className="app-muted">Based on what you picked — change your answers any time.</p>
      <div className="app-card-grid">{start.map((s) => <button key={s.url} className="app-card" onClick={() => go(s.url)}><b>{s.label}</b><span className="app-card-cta">Open →</span></button>)}</div>
      <button className="btn" style={{ marginTop: "var(--sp-4)" }} onClick={() => { setA(EMPTY); setStep(0); setDone(false); }}>Start over</button>
    </>}
  </div>;
}

function Today() {
  const [word, setWord] = useState<{ w: string; mean: string; lang: string } | null>(null);
  const o = overview(), weeks = lastWeeks();
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/apps/words.json`).then((r) => r.json()).then((d) => {
      const all = [...d.greek, ...d.latin]; setWord(all[Math.floor(Math.random() * all.length)]);
    }).catch(() => undefined);
  }, []);
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const max = Math.max(1, ...weeks);
  return <>
    <div className="app-panel"><span className="app-kicker">TODAY · {date.toUpperCase()}</span>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", margin: "4px 0" }}>Keep the thread going</h3>
      <div className="today-grid">
        <button className="app-card" onClick={() => openApp("word")}><span className="app-card-icon">🔤</span><b>Daily word puzzle</b><span>{word ? `${word.w} — “${word.mean}”` : "A new Greek or Latin word"}</span><span className="app-card-cta">Play →</span></button>
        <button className="app-card" onClick={() => openApp("library")}><span className="app-card-icon">📖</span><b>Today's reading</b><span>A fifteen-minute Harvard Classics reading</span><span className="app-card-cta">Read →</span></button>
        <div className="app-card"><span className="app-card-icon">📈</span><b>Your learning</b><span>{o.known} mastered · {o.due} due · {o.mistakes} to revisit</span>
          <div className="sparkline">{weeks.map((n, i) => <span key={i} style={{ height: `${Math.max(3, (n / max) * 22)}px` }} title={plural(n, "answer")} />)}</div></div>
      </div>
    </div>
    <div className="app-panel"><h3 style={{ marginTop: 0 }}>A good next step</h3>
      <button className="btn-primary" onClick={() => go("/")}>Open a subject ladder →</button>
      <button className="btn" style={{ marginLeft: "var(--sp-2)" }} onClick={() => openApp("connections")}>Explore connections</button></div>
  </>;
}

type Profile = { id: string; name: string; created: string };
const KEY = "trb-profiles-v1";
function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } });
  const [name, setName] = useState(""), [active, setActive] = useState("");
  const save = (p: Profile[]) => { setProfiles(p); try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private */ } };
  const add = () => { if (!name.trim()) return; const p = { id: String(Date.now()), name: name.trim(), created: new Date().toISOString() }; save([...profiles, p]); setName(""); };
  const backup = () => {
    const data = { exported: new Date().toISOString(), profiles, learning: localStorage.getItem("trb-learning-v1"), progress: localStorage.getItem("trb-math-v1") };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "curiousity-family-backup.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const restore = (file: File) => {
    const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(String(r.result)); if (d.learning) localStorage.setItem("trb-learning-v1", d.learning); if (d.progress) localStorage.setItem("trb-math-v1", d.progress); if (d.profiles) save(d.profiles); alert("Backup restored. Reload the app to see it."); } catch { alert("That backup file could not be read."); } }; r.readAsText(file);
  };
  const report = () => {
    const text = `Page: ${location.href}\nTopic: ${new URLSearchParams(location.search).get("t") || "—"}\nBrowser: ${navigator.userAgent}`;
    navigator.clipboard?.writeText(text); alert("Page details copied. Paste them into your report.");
  };
  return <div className="app-panel">
    <h3 style={{ marginTop: 0 }}>Learners and backups</h3>
    <p className="app-muted">Give each learner a name and keep a family backup. Ladder progress is stored in one browser profile; the backup file lets you move it to another device.</p>
    <div className="app-toolbar"><input aria-label="Learner name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Learner name" /><button className="btn-primary" onClick={add}>Add learner</button></div>
    <ul className="profile-list">{profiles.map((p) => <li key={p.id}><button className={active === p.id ? "btn btn-primary" : "btn"} onClick={() => { setActive(p.id); localStorage.setItem("trb-active-profile", p.name); }}>{p.name}</button>
      <button className="btn-link" onClick={() => save(profiles.filter((x) => x.id !== p.id))}>remove</button></li>)}</ul>
    <div className="app-toolbar"><button className="btn" onClick={backup}>Download family backup</button>
      <label className="btn">Restore backup<input type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); }} /></label>
      <button className="btn" onClick={report}>Report a problem</button></div>
    {active && <p className="app-feedback ok" role="status">Active learner: {profiles.find((p) => p.id === active)?.name}</p>}
  </div>;
}

function TenMinutes() {
  const [items, setItems] = useState<{ id: string; title: string; href: string; kind: string }[]>([]);
  const [idx, setIdx] = useState(0), [seconds, setSeconds] = useState(600), [running, setRunning] = useState(false), [done, setDone] = useState(false);
  const start = () => {
    const E = getEngine(), graph = getGraph();
    const label = (id: string) => graph.topics.find((t) => t.id === id)?.title ?? id;
    const href = (id: string) => {
      const t = graph.topics.find((x) => x.id === id);
      return t ? `?s=${encodeURIComponent(t.ladder)}&c=${encodeURIComponent(t.course)}&t=${encodeURIComponent(t.slug ?? id.split(".").slice(1).join("."))}` : "/";
    };
    const due = (E?.reviewSet() ?? []).slice(0, 3).map((r) => r.id);
    const next = E?.next()?.id ? [E.next()!.id!] : [];
    const chain = graph.topics.filter((t) => !due.includes(t.id) && !next.includes(t.id)).slice(0, 2).map((t) => t.id);
    const ids = [...due, ...chain].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    setItems(ids.map((id) => ({ id, title: label(id), href: href(id), kind: due.includes(id) ? "review" : "new" })));
    setIdx(0); setSeconds(600); setRunning(true); setDone(false);
  };
  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running, done]);
  useEffect(() => { if (seconds === 0 && running) setRunning(false); }, [seconds, running]);
  const finished = () => {
    setDone(true); setRunning(false);
    try { localStorage.setItem("trb-ten-minutes", new Date().toISOString().slice(0, 10)); } catch { /* private */ }
  };
  return <div className="app-panel">
    <h3 style={{ marginTop: 0 }}>Today's 10 minutes</h3>
    <p className="app-muted">Three due reviews and two new topics along your prerequisite chain. One screen, a timer, and a clear end.</p>
    {items.length === 0 ? <button className="btn-primary" onClick={start}>Start today's ten →</button> : <>
      <p className="tabular" role="timer" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-3)", color: "var(--signal)" }}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </p>
      {!done ? <>
        <p><span className="app-tag">{items[idx]?.kind}</span> <b>{items[idx]?.title}</b></p>
        <div className="app-toolbar">
          <button className="btn" onClick={() => { window.location.href = items[idx].href; }}>Open this topic</button>
          <button className="btn-primary" onClick={() => { if (idx + 1 >= items.length) finished(); else setIdx(idx + 1); }}>{idx + 1 >= items.length ? "Done for today" : "Next →"}</button>
        </div>
      </> : <div className="app-feedback ok" role="status"><p>Done for today — {items.length} topics visited. See you tomorrow.</p><button className="btn" onClick={start}>Another round</button></div>}
      <ol className="ten-list">{items.map((it, i) => <li key={it.id} className={i < idx || done ? "done" : i === idx ? "cur" : ""}>{it.title}</li>)}</ol>
    </>}
  </div>;
}

const TABS = [
  { id: "today", label: "Today", comp: Today },
  { id: "ten", label: "10 minutes", comp: TenMinutes },
  { id: "start", label: "Find what's for you", comp: Quiz },
  { id: "profiles", label: "Learners & backups", comp: Profiles },
] as const;
export default function Daily() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("today");
  const Comp = TABS.find((t) => t.id === tab)!.comp;
  return <section className="app-section" aria-labelledby="daily-title">
    <p className="eyebrow">HOME · DAILY HABIT</p>
    <h2 id="daily-title" className="app-heading">Find what's for you</h2>
    <p className="app-lead">There is a lot here. Answer a few quick questions for a short list of starting points, or jump straight to today's practice. Skip anything you like — nothing is required.</p>
    <div className="app-toolbar" role="group" aria-label="Daily view">{TABS.map((t) => <button key={t.id} className={tab === t.id ? "chip active" : "chip"} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    <Comp />
    <p className="app-attribution">Pattern adapted from <a href="https://teddyrookbook.com/start/" target="_blank" rel="noreferrer">Teddy Rook Book — Start here</a> · CC BY-NC 4.0</p>
  </section>;
}
