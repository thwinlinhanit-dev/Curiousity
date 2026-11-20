import { useEffect, useState } from "react";
import { generate, type Kind, type Level, type Sheet } from "./puzzles/generators";
import { generateMore, type MoreKind } from "./puzzles/more";

type AnyKind = Kind | MoreKind;

type Family = { key: Kind; name: string; group: string; card: string; how: string[] };
type Meta = { families: Family[]; note: string };
type Word = { slug: string; mean: string };

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function PuzzleApp() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [kind, setKind] = useState<AnyKind>("sequences");
  const [level, setLevel] = useState<Level>("easy");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/apps/puzzles.json`).then((r) => r.json()).then(setMeta).catch(() => undefined);
    fetch(`${import.meta.env.BASE_URL}content/apps/words.json`).then((r) => r.json())
      .then((d: { greek: Word[]; latin: Word[] }) => setWords([...d.greek, ...d.latin])).catch(() => undefined);
  }, []);

  const MORE: MoreKind[] = ["crosssum", "sudoku", "nonogram", "logicgrid", "caesar", "morse", "wordladder", "matchsticks",
    "cages", "classics", "ladders", "wordsense", "bases", "mazes"];
  const make = (k: AnyKind = kind, l: Level = level, seed?: number) => {
    const s = seed ?? Math.floor(Math.random() * 1e9);
    setSheet(MORE.includes(k as MoreKind) ? generateMore(k as MoreKind, l, s, words) : generate(k as Kind, l, s, words));
    setAnswers({}); setChecked(false);
  };

  useEffect(() => { if (meta) make(kind, level); /* regenerate when words arrive */ }, [meta, words.length]);

  const family = meta?.families.find((f) => f.key === kind);
  const correct = (i: number) => {
    const item = sheet?.items[i];
    if (!item) return false;
    if (item.input === "grid" && item.cells && item.size) {
      const filled = item.cells.flat().map((v, c) => v !== null ? String(v) : (answers[`g${i}-${Math.floor(c / item.size!)}-${c % item.size!}`] ?? "")).join(",");
      return normalise(filled) === normalise(item.answer);
    }
    return normalise(answers[i] ?? "") === normalise(item.answer);
  };
  const score = sheet ? sheet.items.filter((_, i) => correct(i)).length : 0;

  return (
    <section className="app-section" aria-labelledby="puzzle-title">
      <p className="eyebrow">BRAIN PUZZLES · PRINT, SOLVE, PRINT AGAIN</p>
      <h2 id="puzzle-title" className="app-heading">Make a fresh sheet</h2>
      <p className="app-lead">{meta?.note ?? "Puzzles generated in your browser."} Choose a kind and a level; every sheet is new, and the answer key is on its own page.</p>

      <div className="app-toolbar">
        <label>Puzzle
          <select value={kind} onChange={(e) => { const k = e.target.value as AnyKind; setKind(k); make(k, level); }}>
            {meta?.families.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
            <option value="crosssum">Cross-Sum Grids</option><option value="sudoku">Latin Squares</option>
            <option value="nonogram">Nonograms</option><option value="logicgrid">Logic Grids</option>
            <option value="caesar">Caesar Ciphers</option><option value="morse">Morse Code</option>
            <option value="wordladder">Word Ladders</option><option value="matchsticks">Matchstick Sums</option>
            <option value="cages">Cage Sums</option><option value="classics">Famous Sequences</option>
            <option value="ladders">Number Ladders</option><option value="wordsense">Word Sense</option>
            <option value="bases">Number Bases</option><option value="mazes">Maze Counting</option>
          </select></label>
        <label>Level
          <select value={level} onChange={(e) => { const l = e.target.value as Level; setLevel(l); make(kind, l); }}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select></label>
        <button className="btn" onClick={() => make()}>New sheet</button>
        <button className="btn" onClick={() => window.print()}>Print sheet</button>
      </div>

      <div className="app-toolbar">
        <label>Sheet code <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="e.g. 482913" aria-label="Sheet code" /></label>
        <button className="btn" onClick={() => { const n = Number(codeInput); if (Number.isFinite(n)) make(kind, level, n); }}>Load sheet</button>
        {sheet && <button className="btn" onClick={() => { setCodeInput(String(sheet.seed)); navigator.clipboard?.writeText(String(sheet.seed)); }}>Copy this code</button>}
        <span className="app-muted">A code regenerates the identical sheet.</span>
      </div>

      {family && <div className="app-panel"><h3 style={{ marginTop: 0 }}>{family.name}</h3><p className="app-muted">{family.card}</p>
        <ul className="app-muted">{family.how.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}

      {sheet && (
        <div className="app-panel pz-sheet">
          <div className="pz-sheet-head"><span className="app-kicker">{sheet.level} · seed {sheet.seed}</span>
            <span className="app-muted">{sheet.items.length} puzzles</span></div>
          {sheet.items.map((item, i) => (
            <div className="pz-item" key={i}>
              <p><b>{i + 1}.</b> {item.q}</p>
              {item.input === "grid" && item.cells && item.size ? (
                <div className="pz-grid" style={{ gridTemplateColumns: `repeat(${item.size}, 44px)` }}>
                  {item.cells.flat().map((v, c) => {
                    const r = Math.floor(c / item.size!), col = c % item.size!;
                    const key = `${r}-${col}`;
                    return v === null
                      ? <input key={key} aria-label={`Row ${r + 1} column ${col + 1}`} inputMode="numeric"
                          value={answers[`g${i}-${key}`] ?? ""} onChange={(e) => setAnswers({ ...answers, [`g${i}-${key}`]: e.target.value })} />
                      : <span key={key}>{v}</span>;
                  })}
                </div>
              ) : (
                <input aria-label={`Answer ${i + 1}`} value={answers[i] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
              )}
              {checked && <p className={`app-feedback ${correct(i) ? "ok" : "no"}`}>
                {correct(i) ? "✓ Correct" : `Answer: ${item.solution}`}</p>}
            </div>
          ))}
          <div className="app-toolbar">
            <button className="btn-primary" onClick={() => setChecked(true)}>Check answers</button>
            {checked && <b className="tabular">{score} / {sheet.items.length} correct</b>}
          </div>
        </div>
      )}

      <div className="pz-print-key">
        <h2>Answer key</h2>
        {sheet && <ol>{sheet.items.map((it, i) => <li key={i}>{it.solution}</li>)}</ol>}
      </div>

      <p className="app-attribution">
        Puzzle families adapted from <a href="https://teddyrookbook.com/puzzles/" target="_blank" rel="noreferrer">Teddy Rook Book — Brain Puzzles</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
