import { useEffect, useMemo, useRef, useState } from "react";
import { scramble } from "./puzzles/aqueduct";
import { plural } from "../utils/plural";

const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);
const store = (key: string, value: number) => { try { localStorage.setItem(`trb-game-${key}`, String(value)); } catch { /* private */ } };
const best = (key: string) => { try { return Number(localStorage.getItem(`trb-game-${key}`) || 0); } catch { return 0; } };

const SYMBOLS = ["🏛️", "⚔️", "🦉", "🏺", "🪙", "🌿", "🦁", "⭐"];

function NumberOrder() {
  const [nums, setNums] = useState<number[]>([]);
  const [next, setNext] = useState(1);
  const [start, setStart] = useState(0);
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => best("order"));
  const fresh = () => { setNums(shuffle(Array.from({ length: 16 }, (_, i) => i + 1))); setNext(1); setStart(Date.now()); setTime(0); };
  useEffect(() => { fresh(); }, []);
  useEffect(() => { if (!start || next > 16) return; const t = setInterval(() => setTime((Date.now() - start) / 1000), 100); return () => clearInterval(t); }, [start, next]);
  const win = next > 16;
  useEffect(() => {
    if (!win) return;
    store("order", Math.round(time * 10) / 10);
    setBestTime(best("order"));
  }, [win, time]);
  return <div className="gm-game">
    <div className="gm-head"><span className="app-kicker">MEMORY · ATTENTION · SPEED</span><b className="tabular">{time.toFixed(1)}s</b></div>
    <p className="app-muted">Tap the numbers in order, from 1 to 16. {win ? "Done!" : `Next: ${next}`}</p>
    <div className="gm-numbers">{nums.map((n) => <button key={n} className={n < next ? "done" : n === next ? "cur" : ""}
      onClick={() => { if (n === next) setNext(n + 1); }} disabled={n < next || win}>{n}</button>)}</div>
    <button className="btn" onClick={fresh}>New round</button>
    {bestTime > 0 && <span className="app-muted">Best: {bestTime}s</span>}
  </div>;
}

function MosaicMemory() {
  const [cards, setCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState(() => best("mosaic"));
  const [lock, setLock] = useState(false);
  const timer = useRef<number | null>(null);
  const fresh = () => {
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; }
    const pairs = shuffle(SYMBOLS).slice(0, 8).flatMap((symbol, i) => [
      { id: i * 2, symbol, flipped: false, matched: false }, { id: i * 2 + 1, symbol, flipped: false, matched: false },
    ]);
    setCards(shuffle(pairs)); setFirst(null); setMoves(0); setLock(false);
  };
  useEffect(() => { fresh(); return () => { if (timer.current !== null) clearTimeout(timer.current); }; }, []);
  const win = cards.length > 0 && cards.every((c) => c.matched);
  useEffect(() => {
    if (!win) return;
    store("mosaic", moves);
    setBestMoves(best("mosaic"));
  }, [win, moves]);
  const flip = (i: number) => {
    if (lock || cards[i].flipped || cards[i].matched) return;
    const next = cards.map((c, j) => j === i ? { ...c, flipped: true } : c);
    if (first === null) { setCards(next); setFirst(i); return; }
    setMoves(moves + 1);
    if (next[first].symbol === next[i].symbol) {
      setCards(next.map((c, j) => (j === first || j === i) ? { ...c, matched: true } : c)); setFirst(null);
    } else {
      setCards(next); setLock(true); setFirst(null);
      timer.current = window.setTimeout(() => { setCards((cs) => cs.map((c, j) => (j === i || j === cards.findIndex((x) => x.id === cards[first].id)) && !c.matched ? { ...c, flipped: false } : c)); setLock(false); timer.current = null; }, 700);
    }
  };
  return <div className="gm-game">
    <div className="gm-head"><span className="app-kicker">MEMORY · MATCHING</span><b>{plural(moves, "move")}</b></div>
    <p className="app-muted">Turn two cards at a time and find the eight matching pairs. {win ? "All matched!" : ""}</p>
    <div className="gm-cards">{cards.map((c, i) => <button key={c.id} className={c.matched ? "matched" : c.flipped ? "flipped" : ""} onClick={() => flip(i)} aria-label={c.flipped || c.matched ? c.symbol : "Hidden card"}>
      {c.flipped || c.matched ? c.symbol : "?"}</button>)}</div>
    <button className="btn" onClick={fresh}>New board</button>
    {bestMoves > 0 && <span className="app-muted">Best: {plural(bestMoves, "move")}</span>}
  </div>;
}

function CoinMatch() {
  const coins = [
    ["Denarius", "Roman silver coin, worth 10 asses"], ["As", "Roman bronze coin, the basic unit"],
    ["Sestertius", "A large bronze coin, worth 4 asses"], ["Aureus", "A gold coin, worth 25 denarii"],
    ["Drachma", "Greek silver coin"], ["Obol", "A small Greek coin, one sixth of a drachma"],
    ["Tetradrachm", "Greek silver coin, worth 4 drachmas"], ["Mina", "A unit of weight and money, 100 drachmas"],
  ];
  const [q, setQ] = useState(0), [score, setScore] = useState(0), [picked, setPicked] = useState<number | null>(null);
  const opts = useMemo(() => shuffle([coins[q][0], ...shuffle(coins.filter((_, i) => i !== q)).slice(0, 3).map((c) => c[0])]), [q]);
  const answer = coins[q][0];
  const next = () => { setPicked(null); setQ((q + 1) % coins.length); };
  return <div className="gm-game">
    <div className="gm-head"><span className="app-kicker">ANCIENT COINS · KNOWLEDGE</span><b>{score} / {coins.length}</b></div>
    <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-2)" }}>{coins[q][1]}</p>
    <div className="gm-choices">{opts.map((o, i) => <button key={o} className={picked === null ? "" : o === answer ? "right" : "wrong"} onClick={() => { if (picked !== null) return; setPicked(i); if (o === answer) setScore(score + 1); }}>{o}</button>)}</div>
    {picked !== null && <button className="btn-primary" onClick={next}>{q === coins.length - 1 ? "Start again" : "Next coin"}</button>}
  </div>;
}

function Aqueduct() {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState(() => best("aqueduct"));
  // Uniformly random boards are almost never solvable (the move span has
  // GF(2) rank 6/16). Scrambling from the solved board guarantees a solution.
  const fresh = () => { setGrid(scramble()); setMoves(0); };
  useEffect(() => { fresh(); }, []);
  const toggle = (r: number, c: number) => {
    setGrid((g) => g.map((row, i) => row.map((v, j) => (i === r || j === c) ? !v : v)));
    setMoves(moves + 1);
  };
  const win = grid.length > 0 && grid.every((row) => row.every(Boolean));
  useEffect(() => {
    if (!win) return;
    store("aqueduct", moves);
    setBestMoves(best("aqueduct"));
  }, [win, moves]);
  return <div className="gm-game">
    <div className="gm-head"><span className="app-kicker">LOGIC · SWITCHES</span><b>{plural(moves, "switch", "switches")}</b></div>
    <p className="app-muted">Click a pipe to flip that row and column. Get every junction lit to make the water flow. {win ? "Flowing!" : ""}</p>
    <div className="gm-pipes">{grid.map((row, r) => row.map((on, c) => <button key={`${r}-${c}`} className={on ? "on" : ""} onClick={() => toggle(r, c)} aria-label={`Junction ${r + 1}, ${c + 1}: ${on ? "lit" : "dark"}`}>{on ? "●" : "○"}</button>))}</div>
    <button className="btn" onClick={fresh}>New puzzle</button>
    {bestMoves > 0 && <span className="app-muted">Best: {plural(bestMoves, "switch", "switches")}</span>}
  </div>;
}

const GAMES = [
  { id: "order", icon: "🔢", name: "Numbers in Order", desc: "Memory, attention and speed: tap 1 to 16 as fast as you can.", comp: NumberOrder },
  { id: "mosaic", icon: "🧩", name: "Mosaic Memory", desc: "Turn cards and match eight pairs of ancient symbols.", comp: MosaicMemory },
  { id: "coins", icon: "🪙", name: "Coin Match", desc: "Name the ancient coin from its description.", comp: CoinMatch },
  { id: "aqueduct", icon: "💧", name: "Aqueduct Switches", desc: "Flip rows and columns until the water flows.", comp: Aqueduct },
];

export default function Games() {
  const [selected, setSelected] = useState<string | null>(null);
  const game = GAMES.find((g) => g.id === selected);
  const Game = game?.comp;
  return (
    <section className="app-section" aria-labelledby="games-title">
      <p className="eyebrow">GAMES · ANCIENT WORLD</p>
      <h2 id="games-title" className="app-heading">Play to learn</h2>
      <p className="app-lead">Short games for memory, attention and speed, in the spirit of the browser games on Teddy Rook Book. No account, nothing uploaded — best scores stay in this browser.</p>
      {!Game ? (
        <div className="gm-grid">{GAMES.map((g) => <button key={g.id} className="app-card" onClick={() => setSelected(g.id)}>
          <span className="app-card-icon">{g.icon}</span><b>{g.name}</b><span>{g.desc}</span><span className="app-card-cta">Play →</span>
        </button>)}</div>
      ) : (
        <>
          <button className="btn-link" onClick={() => setSelected(null)}>← All games</button>
          <div className="app-panel"><h3 style={{ marginTop: 0 }}>{game!.icon} {game!.name}</h3><Game /></div>
        </>
      )}
      <p className="app-attribution">
        Game ideas adapted from <a href="https://teddyrookbook.com/games/" target="_blank" rel="noreferrer">Teddy Rook Book — Games</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
