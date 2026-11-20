import { useEffect, useMemo, useRef, useState } from "react";
import { sanitize } from "../utils/richtext";

type Form = { w: string; pron: string; pos: string; mean: string; notes: string[]; tables: { title: string; head: string[]; rows: string[] }[] };
type Passage = { n: number; ref: string; book: string; ctx: string; gk: [string, string][]; la: [string, string][]; en: string };
type LangData = { passages: Passage[]; forms: { greek: Record<string, Form>; latin: Record<string, Form> } };
type Word = { w: string; slug: string; pron: string; mean: string; lang: string; rank: number };
type Deck = { greek: Word[]; latin: Word[] };
type SRS = Record<string, { box: number; due: number }>;
const STEPS = [1, 3, 7, 16, 35, 75, 150];
const day = 86400000;
const clean = (s: string) => s.toLowerCase().replace(/[^a-z\u0370-\u03ff\u1f00-\u1fff]/g, "");

const ALPHABET: [string, string, string, string][] = [
  ["Α α", "alpha", "a", "a as in father"], ["Β β", "beta", "b", "b"], ["Γ γ", "gamma", "g", "g, or ng before k/g"],
  ["Δ δ", "delta", "d", "d"], ["Ε ε", "epsilon", "e", "e as in get"], ["Ζ ζ", "zeta", "z", "z"],
  ["Η η", "eta", "ē", "long e"], ["Θ θ", "theta", "th", "th as in think"], ["Ι ι", "iota", "i", "i"],
  ["Κ κ", "kappa", "k", "k"], ["Λ λ", "lambda", "l", "l"], ["Μ μ", "mu", "m", "m"],
  ["Ν ν", "nu", "n", "n"], ["Ξ ξ", "xi", "x", "ks"], ["Ο ο", "omicron", "o", "o as in pot"],
  ["Π π", "pi", "p", "p"], ["Ρ ρ", "rho", "r", "r"], ["Σ σ ς", "sigma", "s", "s (ς at word end)"],
  ["Τ τ", "tau", "t", "t"], ["Υ υ", "upsilon", "u", "u as in French tu"], ["Φ φ", "phi", "ph", "ph"],
  ["Χ χ", "chi", "ch", "ch as in loch"], ["Ψ ψ", "psi", "ps", "ps"], ["Ω ω", "omega", "ō", "long o"],
];

export default function LanguageLab() {
  const [tab, setTab] = useState<"cards" | "reader" | "forms" | "alphabet">("cards");
  const [data, setData] = useState<LangData>({ passages: [], forms: { greek: {}, latin: {} } });
  const loaded = useRef({ passages: false, forms: false });
  const [deck, setDeck] = useState<Deck | null>(null);
  const [srs, setSrs] = useState<SRS>({});
  const [cardLang, setCardLang] = useState<"greek" | "latin">("greek");
  const [flipped, setFlipped] = useState(false);
  const [passage, setPassage] = useState(0);
  const [tapped, setTapped] = useState<{ lang: "greek" | "latin"; slug: string; surface: string } | null>(null);
  const [query, setQuery] = useState("");
  const [formKey, setFormKey] = useState("logos");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/apps/words.json`).then((r) => r.json()).then(setDeck).catch(() => undefined);
    try { setSrs(JSON.parse(localStorage.getItem("trb-lang-srs") || "{}")); } catch { /* nothing */ }
  }, []);
  // Fetch the large language data only for the tabs that need it (114 KB of
  // passages for the reader, the two form files for reader/forms).
  useEffect(() => {
    const base = `${import.meta.env.BASE_URL}content/apps`;
    if (tab === "reader" && !loaded.current.passages) {
      loaded.current.passages = true;
      fetch(`${base}/language-passages.json`).then((r) => r.json())
        .then((d: { passages: Passage[] }) => setData((p) => ({ ...p, passages: d.passages }))).catch(() => undefined);
    }
    if ((tab === "reader" || tab === "forms") && !loaded.current.forms) {
      loaded.current.forms = true;
      Promise.all([
        fetch(`${base}/lang-greek.json`).then((r) => r.json()),
        fetch(`${base}/lang-latin.json`).then((r) => r.json()),
      ]).then(([g, l]) => setData((p) => ({ ...p, forms: { greek: g.forms, latin: l.forms } }))).catch(() => undefined);
    }
  }, [tab]);
  const saveSrs = (s: SRS) => { setSrs(s); try { localStorage.setItem("trb-lang-srs", JSON.stringify(s)); } catch { /* private */ } };

  const index = useMemo(() => {
    const map: Record<string, string> = {};
    if (!data) return map;
    for (const lang of ["greek", "latin"] as const) {
      for (const [slug, f] of Object.entries(data.forms[lang])) {
        map[clean(f.w)] = slug;
        for (const t of f.tables) for (const row of t.rows) for (const part of row.replace(/<[^>]*>/g, " ").split(/\s+/)) {
          const c = clean(part); if (c.length > 1) map[c] ??= slug;
        }
      }
    }
    return map;
  }, [data]);

  const due = useMemo(() => (deck?.[cardLang] ?? []).filter((w) => {
    const rec = srs[`${cardLang}-${w.slug}`]; return !rec || rec.due <= Date.now();
  }), [deck, cardLang, srs]);
  const card = due[0];

  const rate = (box: number) => {
    if (!card) return;
    const k = `${cardLang}-${card.slug}`;
    const next = { ...srs, [k]: { box, due: Date.now() + STEPS[box] * day } };
    saveSrs(next); setFlipped(false);
  };

  const p = data?.passages[passage];
  const form = tapped && data ? data.forms[tapped.lang][tapped.slug] ?? null : null;
  const formResults = useMemo(() => {
    if (!data || !query.trim()) return [];
    const q = query.toLowerCase();
    const forms = { ...data.forms.greek, ...data.forms.latin };
    return Object.entries(forms).filter(([k, f]) => k.includes(q) || f.mean.toLowerCase().includes(q)).slice(0, 30);
  }, [data, query]);

  return (
    <section className="app-section" aria-labelledby="lang-title">
      <p className="eyebrow">GREEK & LATIN · LANGUAGE LAB</p>
      <h2 id="lang-title" className="app-heading">Read the New Testament, word by word</h2>
      <p className="app-lead">The 345 most common words of each language, and the forms they really take. Recall a card, tap any word in a passage to see why it has that form, or browse the paradigms. No account — your counters stay in this browser.</p>

      <div className="app-toolbar" role="group" aria-label="Language tool">
        {([["cards", "Flashcards"], ["reader", "Reader"], ["forms", "Word forms"], ["alphabet", "Alphabet"]] as const).map(([id, label]) =>
          <button key={id} className={tab === id ? "chip active" : "chip"} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      {tab === "cards" && (
        <div className="app-panel ll-cards">
          <div className="app-toolbar">
            <button className={cardLang === "greek" ? "chip active" : "chip"} aria-pressed={cardLang === "greek"} onClick={() => { setCardLang("greek"); setFlipped(false); }}>Koine Greek</button>
            <button className={cardLang === "latin" ? "chip active" : "chip"} aria-pressed={cardLang === "latin"} onClick={() => { setCardLang("latin"); setFlipped(false); }}>Latin</button>
            <span className="app-muted">{due.length} due now</span>
          </div>
          {card ? (
            <>
              <div className="ll-card" onClick={() => setFlipped(!flipped)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped(!flipped); } }}>
                <span className="app-kicker">{flipped ? "MEANING" : "RECALL IT"}</span>
                <b>{flipped ? card.mean : card.w}</b>
                <span className="app-muted">{flipped ? `${card.w} · ${card.pron}` : card.pron}</span>
              </div>
              {flipped ? <div className="app-toolbar">
                <button className="btn" onClick={() => rate(0)}>Again (tomorrow)</button>
                <button className="btn" onClick={() => rate(Math.min(STEPS.length - 1, (srs[`${cardLang}-${card.slug}`]?.box ?? 0) + 1))}>Good</button>
                <button className="btn-primary" onClick={() => rate(Math.min(STEPS.length - 1, (srs[`${cardLang}-${card.slug}`]?.box ?? 0) + 2))}>Easy</button>
              </div> : <p className="app-muted">Recall the answer first, then click the card to flip it.</p>}
            </>
          ) : <p className="app-muted">Nothing due right now. Come back tomorrow, or switch language.</p>}
          <p className="app-muted">Cards return after {STEPS.join(", ")} days as you rate them.</p>
        </div>
      )}

      {tab === "reader" && p && (
        <div className="app-panel">
          <div className="app-toolbar"><label>Passage
            <select value={passage} onChange={(e) => { setPassage(Number(e.target.value)); setTapped(null); }}>
              {data?.passages.map((x, i) => {
                const context = x.ctx?.trim() || x.en?.trim() || x.book;
                return <option key={x.n} value={i} title={context}>{x.ref}{context ? ` — ${context}` : ""}</option>;
              })}
            </select></label></div>
          <h3 style={{ fontFamily: "var(--font-display)" }}>{p.ref}</h3>
          <p className="app-muted">{p.ctx?.trim() || p.en || p.book}</p>
          <div className="ll-passage">
            <span className="app-kicker">ΚΟΙΝΗ</span>
            <p>{p.gk.map(([w, pron], i) => <button key={i} className="ll-word" title={pron} onClick={() => setTapped({ lang: "greek", slug: index[clean(w)] ?? "", surface: w })}>{w} </button>)}</p>
            <span className="app-kicker">LATINA</span>
            <p>{p.la.map(([w, pron], i) => <button key={i} className="ll-word" title={pron} onClick={() => setTapped({ lang: "latin", slug: index[clean(w)] ?? "", surface: w })}>{w} </button>)}</p>
            <p className="app-muted">{p.en}</p>
          </div>
          {tapped && <div className="ll-detail" role="status">
            <span className="app-kicker">{tapped.lang} · {tapped.surface}</span>
            {form ? <><b>{form.w}</b> <span className="app-muted">{form.pron} · {form.pos}</span>
              <p>{form.mean}</p>
              {form.notes.map((n, i) => <p key={i} className="app-muted">{n}</p>)}
              {form.tables.map((t, i) => <div key={i} className="ll-table"><b>{t.title}</b>
                <table><thead><tr>{t.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
                  <tbody>{t.rows.map((r, j) => <tr key={j}>{r.replace(/<[^>]*>/g, "|").split("|").filter(Boolean).map((c, k) => <td key={k}>{c.trim()}</td>)}</tr>)}</tbody></table>
              </div>)}
            </> : <p className="app-muted">No paradigm entry for “{tapped.surface}” yet — try another word.</p>}
          </div>}
        </div>
      )}

      {tab === "forms" && (
        <div className="app-panel">
          <input aria-label="Search word forms" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a word or meaning…" style={{ width: "100%", marginBottom: "var(--sp-3)" }} />
          <div className="ll-forms">
            <div className="ll-form-list">{formResults.map(([k, f]) => <button key={k} className={formKey === k ? "active" : ""} onClick={() => setFormKey(k)}><b>{f.w}</b><span>{f.mean}</span></button>)}</div>
            <div className="ll-form-detail">{data && (data.forms.greek[formKey] ?? data.forms.latin[formKey]) ? (() => {
              const f = data.forms.greek[formKey] ?? data.forms.latin[formKey];
              return <><h3 style={{ marginTop: 0 }}>{f.w} <span className="app-muted">{f.pron}</span></h3>
                <p>{f.mean} · {f.pos}</p>
                {f.notes.map((n, i) => <p key={i} className="app-muted" dangerouslySetInnerHTML={{ __html: sanitize(n) }} />)}
                {f.tables.map((t, i) => <div key={i} className="ll-table"><b>{t.title}</b>
                  <table><thead><tr>{t.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
                    <tbody>{t.rows.map((r, j) => <tr key={j}>{r.replace(/<[^>]*>/g, "|").split("|").filter(Boolean).map((c, k) => <td key={k} dangerouslySetInnerHTML={{ __html: sanitize(c) }} />)}</tr>)}</tbody></table>
                </div>)}</>;
            })() : <p className="app-muted">Choose a word from the list.</p>}</div>
          </div>
        </div>
      )}

      {tab === "alphabet" && (
        <div className="app-panel">
          <h3 style={{ marginTop: 0 }}>Learn the Greek alphabet</h3>
          <p className="app-muted">Six short lessons on the live site walk through these; this chart is the quick reference.</p>
          <div className="ll-alpha">{ALPHABET.map(([letters, name, tr, sound]) => (
            <div key={name}><b>{letters}</b><span>{name}</span><span className="app-kicker">{tr}</span><small>{sound}</small></div>
          ))}</div>
        </div>
      )}

      <p className="app-attribution">
        Adapted from <a href="https://teddyrookbook.com/languages/" target="_blank" rel="noreferrer">Teddy Rook Book — Languages / Jerome</a> · Greek NT text CC BY 4.0 · Teddy Rook CC BY-NC 4.0
      </p>
    </section>
  );
}
