import { useEffect, useState } from "react";

type Item = { title: string; subtitle: string; meta: Record<string, unknown> };
type List = { title: string; subtitle: string; body: string; meta: { slug: string; prompts?: { ask: string; from: string[] }[] }; items: Item[] };
type Data = { items: List[] };
type SRS = Record<string, { box: number; due: number }>;
const STEPS = [1, 3, 7, 21];
const KEY = "trb-memory-srs-v1";

function loadSrs(): SRS { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } }
function saveSrs(s: SRS) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private */ } }

function Challenges({ lists }: { lists: List[] }) {
  const [idx, setIdx] = useState(0), [card, setCard] = useState(0), [answer, setAnswer] = useState(""), [result, setResult] = useState<boolean | null>(null);
  const [srs, setSrs] = useState<SRS>(loadSrs);
  const list = lists[idx];
  const prompts = list?.meta.prompts?.length ? list.meta.prompts : [{ ask: "title", from: ["title"] }];
  const items = list?.items ?? [];
  const prompt = prompts[card % prompts.length];
  const item = items[card % Math.max(1, items.length)];
  const clueKey = Array.isArray(prompt.from) ? prompt.from[0] : String(prompt.from ?? "");
  const fieldValue = (key: string) => {
    const value = item?.meta?.[key];
    return value == null || value === "" ? String(item?.title ?? "") : String(value);
  };
  // The corpus prompt format is { ask: answerField, from: [clueField] }.
  // Read the clue from `from` and grade against `ask`.
  const clueText = fieldValue(clueKey);
  const answerText = fieldValue(prompt.ask);
  const askLabel = prompt.ask === "n" ? "number" : prompt.ask === "con" ? "constellation" : prompt.ask === "abbr" ? "abbreviation" : prompt.ask.replace(/_/g, " ");
  const check = () => {
    const ok = answer.trim().toLowerCase() === answerText.toLowerCase();
    setResult(ok);
    const k = `${list.meta.slug}-${item?.title}-${prompt.ask}`;
    const box = ok ? Math.min(STEPS.length - 1, (srs[k]?.box ?? -1) + 1) : 0;
    const next = { ...srs, [k]: { box, due: Date.now() + STEPS[box] * 86400000 } };
    setSrs(next); saveSrs(next);
  };
  const next = () => { setCard((card + 1) % Math.max(1, items.length)); setAnswer(""); setResult(null); };
  if (!list) return <p className="app-muted">Loading lists…</p>;
  return <>
    <div className="app-toolbar"><label>List
      <select value={idx} onChange={(e) => { setIdx(Number(e.target.value)); setCard(0); setResult(null); setAnswer(""); }}>
        {lists.map((l, i) => <option key={l.meta.slug} value={i}>{l.title} ({l.items.length})</option>)}
      </select></label></div>
    <p className="app-muted">{list.body}</p>
    <div className="mem-card"><span className="app-kicker">{list.title}</span>
      <p>What is the <b>{askLabel}</b> of this item?</p>
      <b style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)" }}>{clueText}</b>
      <div className="word-input-row"><input aria-label="Memory answer" value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} />
        <button className="btn-primary" onClick={check}>Check</button></div>
      {result !== null && <p className={`app-feedback ${result ? "ok" : "no"}`} role="status">{result ? "Correct!" : `Answer: ${answerText}`}</p>}
      <button className="btn" style={{ marginTop: "var(--sp-2)" }} onClick={next}>Next item →</button>
    </div>
    <p className="app-muted">Cards return after {STEPS.join(", ")} days as you get them right. Progress stays in this browser.</p>
  </>;
}

function CardPairs({ lists }: { lists: List[] }) {
  const [idx, setIdx] = useState(0);
  const list = lists[idx];
  const [cards, setCards] = useState<{ id: number; text: string; pair: number; flipped: boolean }[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const fresh = () => {
    const picks = (list?.items ?? []).slice(0, 8);
    const deck = picks.flatMap((it, i) => [
      { id: i * 2, text: it.title, pair: i, flipped: false },
      { id: i * 2 + 1, text: String(it.meta?.[list.meta.prompts?.[0]?.from[0] ?? "title"] ?? ""), pair: i, flipped: false },
    ]);
    setCards(deck.sort(() => Math.random() - 0.5)); setFirst(null);
  };
  useEffect(() => { fresh(); }, [idx]);
  const flip = (i: number) => {
    if (cards[i].flipped) return;
    const next = cards.map((c, j) => j === i ? { ...c, flipped: true } : c);
    if (first === null) { setCards(next); setFirst(i); return; }
    if (next[first].pair === next[i].pair) { setCards(next.map((c, j) => j === i || j === first ? { ...c, flipped: true } : c)); setFirst(null); return; }
    setCards(next); setFirst(null);
    setTimeout(() => setCards((cs) => cs.map((c, j) => j === i || j === first ? { ...c, flipped: false } : c)), 800);
  };
  const won = cards.length > 0 && cards.every((c) => c.flipped);
  return <>
    <div className="app-toolbar"><label>List <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
      {lists.filter((l) => l.items.length >= 4).map((l, i) => <option key={l.meta.slug} value={i}>{l.title}</option>)}</select></label>
      <button className="btn" onClick={fresh}>New board</button></div>
    <div className="gm-cards" style={{ maxWidth: "100%" }}>{cards.map((c, i) => <button key={c.id} className={c.flipped ? "flipped" : ""} onClick={() => flip(i)}>{c.flipped ? c.text.slice(0, 24) : "?"}</button>)}</div>
    {won && <p className="app-feedback ok" role="status">All pairs matched!</p>}
  </>;
}

function Palace({ lists }: { lists: List[] }) {
  const [idx, setIdx] = useState(0), [step, setStep] = useState(0), [picked, setPicked] = useState<number | null>(null), [score, setScore] = useState(0);
  const list = lists[idx], items = (list?.items ?? []).slice(0, 5);
  const rooms = ["Schoolroom", "Art corner", "Music room", "Front hall", "Kitchen"];
  const start = () => { setStep(1); setPicked(null); setScore(0); };
  const choose = (i: number) => {
    setPicked(i);
    if (i === step - 1) { setScore(score + 1); }
    setTimeout(() => { setStep(step + 1); setPicked(null); }, 400);
  };
  const done = step > items.length;
  return <>
    <p className="app-muted">Place each item along a route through a house, then walk the route and name what you left at each stop.</p>
    <div className="app-toolbar"><label>List <select value={idx} onChange={(e) => { setIdx(Number(e.target.value)); setStep(0); }}>
      {lists.filter((l) => l.items.length >= 5).map((l, i) => <option key={l.meta.slug} value={i}>{l.title}</option>)}</select></label>
      <button className="btn-primary" onClick={start}>Build my palace</button></div>
    {step === 0 ? <p className="app-muted">Press “Build my palace” to start.</p> : done ? <div className="app-feedback ok" role="status"><p>{score} / {items.length} {items.length === 1 ? "stop" : "stops"} remembered.</p><button className="btn" onClick={start}>Again</button></div> : (
      <div className="mem-card"><span className="app-kicker">STOP {step} · {rooms[(step - 1) % rooms.length]}</span>
        <p className="app-muted">You left <b>{items[step - 1]?.title}</b> here. Which stop is next?</p>
        <div className="app-toolbar">{items.map((_it, i) => <button key={i} className={picked === i ? "chip active" : "chip"} onClick={() => choose(i)}>{rooms[i]}</button>)}</div>
      </div>)}
  </>;
}

const GAMES = [
  { id: "pairs", label: "Card pairs", comp: CardPairs },
  { id: "palace", label: "Memory palace", comp: Palace },
];
export default function MemoryStudio() {
  const [lists, setLists] = useState<List[]>([]);
  const [tab, setTab] = useState<"challenges" | "pairs" | "palace">("challenges");
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}content/data/memory.json`).then((r) => r.json()).then((d: Data) => setLists(d.items)).catch(() => undefined); }, []);
  const Game = GAMES.find((g) => g.id === tab)?.comp;
  return <section className="app-section" aria-labelledby="mem-title">
    <p className="eyebrow">MEMORY · CHALLENGES & GAMES</p>
    <h2 id="mem-title" className="app-heading">Remember it, then recall it</h2>
    <p className="app-lead">{lists.length} challenge lists from the corpus, with spaced cards and two memory games over the same data. Encoding, spacing and retrieval — all local to this browser.</p>
    <div className="app-toolbar" role="group" aria-label="Memory view">
      <button className={tab === "challenges" ? "chip active" : "chip"} aria-pressed={tab === "challenges"} onClick={() => setTab("challenges")}>Challenge lists</button>
      {GAMES.map((g) => <button key={g.id} className={tab === g.id ? "chip active" : "chip"} aria-pressed={tab === g.id} onClick={() => setTab(g.id as typeof tab)}>{g.label}</button>)}
    </div>
    <div className="app-panel">{tab === "challenges" ? <Challenges lists={lists} /> : Game ? <Game lists={lists} /> : <p className="app-muted">Loading…</p>}</div>
    <p className="app-attribution">Adapted from <a href="https://teddyrookbook.com/memory/" target="_blank" rel="noreferrer">Teddy Rook Book — Memory</a> · CC BY-NC 4.0</p>
  </section>;
}
