import { useEffect, useMemo, useState } from "react";

type Word = { w: string; slug: string; pron: string; mean: string; rank: number; lang: "greek" | "latin" };
type Deck = { greek: Word[]; latin: Word[]; source_url?: string };
type Mark = "hit" | "present" | "miss";

const todayKey = () => new Date().toISOString().slice(0, 10);
const MAX = 6;

// Two-pass Wordle scoring: exact hits first, then remaining letters elsewhere.
function score(guess: string, answer: string): Mark[] {
  const out: Mark[] = Array(answer.length).fill("miss");
  const left = answer.split("");
  guess.split("").forEach((c, i) => { if (c === left[i]) { out[i] = "hit"; left[i] = ""; } });
  guess.split("").forEach((c, i) => {
    if (out[i] === "hit") return;
    const j = left.indexOf(c);
    if (j >= 0) { out[i] = "present"; left[j] = ""; }
  });
  return out;
}

const pickDaily = (deck: Deck) => {
  const d = new Date();
  const seed = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000);
  const list = seed % 2 === 0 ? deck.greek : deck.latin;
  return list[Math.floor(seed / 2) % list.length];
};

export default function DailyWord() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  const [word, setWord] = useState<Word | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/apps/words.json`)
      .then((r) => r.json()).then((d: Deck) => setDeck(d))
      .catch(() => setMessage("The word deck could not be loaded."));
  }, []);

  useEffect(() => {
    if (!deck) return;
    if (mode === "daily") {
      const w = pickDaily(deck);
      setWord(w);
      try {
        const saved = JSON.parse(localStorage.getItem(`trb-word-${todayKey()}`) || "{}");
        // Only restore guesses saved for this exact word (the deck can change).
        setGuesses(saved.id === w.slug && Array.isArray(saved.guesses)
          ? saved.guesses.filter((g: string) => /^[a-z]+$/.test(g) && g.length === w.slug.length)
          : []);
      } catch { setGuesses([]); }
    } else {
      const all = [...deck.greek, ...deck.latin];
      setWord(all[Math.floor(Math.random() * all.length)]);
      setGuesses([]);
    }
    setInput(""); setMessage("");
  }, [deck, mode]);

  const answer = word?.slug ?? "";
  const marks = useMemo(() => guesses.map((g) => score(g, answer)), [guesses, answer]);
  const won = guesses.includes(answer);
  const lost = guesses.length >= MAX && !won;
  const done = won || lost;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (done || !word) return;
    const g = input.toLowerCase().replace(/[^a-z]/g, "");
    if (g.length !== answer.length) { setMessage(`Use ${answer.length} letters.`); return; }
    const all = mode === "daily" ? [...(deck?.greek ?? []), ...(deck?.latin ?? [])] : [];
    if (!/^[a-z]+$/.test(g) || (all.length > 0 && !all.some((w) => w.slug === g))) {
      setMessage("That is not a word in this deck. Try another.");
      return;
    }
    const next = [...guesses, g];
    setGuesses(next); setInput(""); setMessage("");
    if (mode === "daily") {
      try { localStorage.setItem(`trb-word-${todayKey()}`, JSON.stringify({ id: word.slug, guesses: next })); } catch { /* private mode */ }
    }
  };

  const rows = Array.from({ length: MAX }, (_, r) => {
    const g = guesses[r];
    const m = marks[r];
    const shown = g ?? (r === guesses.length ? input.toLowerCase() : "");
    const status = g && m ? ` — ${[...g].map((c, i) => `${c} ${m[i]}`).join(", ")}` : "";
    return (
      <div className="word-row" key={r} aria-label={g ? `Guess ${r + 1}: ${g}${status}` : `Empty guess ${r + 1}`}>
        {Array.from({ length: answer.length }, (_, c) => (
          <span key={c} className={`word-tile${g ? ` ${m?.[c] ?? "miss"}` : ""}${shown[c] ? " filled" : ""}`} aria-hidden="true">{shown[c] ?? ""}</span>
        ))}
      </div>
    );
  });

  return (
    <section className="app-section" aria-labelledby="word-title">
      <p className="eyebrow">DAILY · LANGUAGES</p>
      <h2 id="word-title" className="app-heading">Guess the word in six tries</h2>
      <p className="app-lead">
        A new Koine Greek or Latin word every day, from the 345 most common words of the New Testament.
        Type the <b>romanised</b> spelling — the letters are shown below. Correct letters turn green,
        letters in the wrong place turn amber.
      </p>
      <div className="app-toolbar">
        <div className="segmented" role="group" aria-label="Puzzle mode">
          <button className={mode === "daily" ? "active" : ""} aria-pressed={mode === "daily"} onClick={() => setMode("daily")}>Today's word</button>
          <button className={mode === "practice" ? "active" : ""} aria-pressed={mode === "practice"} onClick={() => setMode("practice")}>Practice another</button>
        </div>
        {word && <span className="app-tag">{word.lang === "greek" ? "Koine Greek" : "Latin"} · #{word.rank} most common</span>}
      </div>

      {!word ? <p className="app-muted">Loading the word deck…</p> : (
        <div className="app-grid-2">
          <div className="app-panel">
            <h3 style={{ marginTop: 0 }}>CLUE: {word.mean}</h3>
            <p className="app-muted">{answer.length} letters · pronounced “{word.pron}”</p>
            <div className="word-board" role="group" aria-label="Your six guesses">{rows}</div>
            {!done ? (
              <form onSubmit={submit} className="word-form">
                <label htmlFor="word-guess">Your guess</label>
                <div className="word-input-row">
                  <input id="word-guess" autoComplete="off" autoCapitalize="none" spellCheck={false}
                    maxLength={answer.length} value={input} onChange={(e) => setInput(e.target.value.toLowerCase())}
                    aria-describedby="word-help" />
                  <button className="btn-primary" type="submit">Guess</button>
                </div>
                <p id="word-help" className="app-muted" aria-live="polite">{message || `${MAX - guesses.length} tries left.`}</p>
              </form>
            ) : (
              <div className="app-feedback" role="status">
                <p className={won ? "ok" : "no"}>{won ? `Solved in ${guesses.length} ${guesses.length === 1 ? "try" : "tries"}!` : "Out of tries."}</p>
                <p>The word is <b>{word.w}</b> — “{word.mean}”.</p>
                {mode === "practice" && <button className="btn" onClick={() => setMode("daily")}>Back to today's word</button>}
              </div>
            )}
          </div>
          <aside className="app-panel">
            <h3 style={{ marginTop: 0 }}>How to play</h3>
            <ul>
              <li>Guess a word from the deck in six tries.</li>
              <li>Type only romanised letters (a–z); accents are shown after the reveal.</li>
              <li><span className="word-key hit">Right place</span> = right letter, right place. <span className="word-key present">Wrong place</span> = right letter, wrong place. <span className="word-key miss">Not in word</span> = letter absent.</li>
              <li>Every guess must be a word in this deck.</li>
            </ul>
            <p className="app-muted">Your guesses are saved in this browser only. No account, nothing uploaded.</p>
          </aside>
        </div>
      )}
      <p className="app-attribution">
        Adapted from <a href="https://teddyrookbook.com/languages/" target="_blank" rel="noreferrer">Teddy Rook Book — Languages</a> · CC BY-NC 4.0 · Greek NT data CC BY 4.0
      </p>
    </section>
  );
}
