import { useState } from "react";

// Unicode Egyptian Hieroglyphs (U+13000) and Linear B Syllabary (U+10000).
// Font support varies by device; the transliteration is always shown alongside.
const HIERO: Record<string, string> = {
  A: "𓂝", B: "𓃀", C: "𓎡", D: "𓂧", E: "𓇋", F: "𓆑", G: "𓃀", H: "𓉔", I: "𓇋", J: "𓇋",
  K: "𓎡", L: "𓂋", M: "𓅓", N: "𓈖", O: "𓅱", P: "𓊪", Q: "𓎡", R: "𓂋", S: "𓋴", T: "𓏏",
  U: "𓅱", V: "𓆑", W: "𓅱", X: "𓎡", Y: "𓇋", Z: "𓋴",
};
const LINEAR: Record<string, [string, string]> = {
  A: ["𐀀", "a"], B: ["𐀠", "pi"], D: ["𐀅", "da"], E: ["𐀁", "e"], G: ["𐀦", "go"],
  H: ["𐀏", "ka"], I: ["𐀂", "i"], J: ["𐀃", "jo"], K: ["𐀐", "ke"], L: ["𐀩", "ra"],
  M: ["𐀔", "ma"], N: ["𐀜", "no"], O: ["𐀂", "o"], P: ["𐀢", "pu"], Q: ["𐀦", "ko"],
  R: ["𐀫", "ro"], S: ["𐀭", "sa"], T: ["𐀲", "ta"], U: ["𐀄", "u"], V: ["𐀪", "ri"],
  W: ["𐀸", "wa"], X: ["𐀪", "ksi"], Y: ["𐀄", "yu"], Z: ["𐀰", "zo"],
};

function Cartouche() {
  const [name, setName] = useState("CLEOPATRA");
  const glyphs = [...name.toUpperCase()].filter((c) => HIERO[c]).map((c) => HIERO[c]).join("");
  const copy = () => navigator.clipboard?.writeText(`${name}: ${glyphs}`);
  return <>
    <p className="app-muted">A cartouche is an oval rope enclosing a royal name. Pick signs for each sound and see the name printed inside. Font support for Egyptian hieroglyphs varies — the Latin name is always shown too.</p>
    <div className="app-toolbar"><label>Name <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} /></label><button className="btn" onClick={copy}>Copy signs</button><button className="btn" onClick={() => window.print()}>Print</button></div>
    <div className="script-card">
      <svg viewBox="0 0 440 130" width="100%" role="img" aria-label={`Cartouche reading ${name}`}>
        <path d="M40 18 H360 A36 36 0 0 1 396 54 V76 A36 36 0 0 1 360 112 H40 A36 36 0 0 1 4 76 V54 A36 36 0 0 1 40 18 Z"
          fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M360 112 H382 V122 H360 Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <text x="200" y="78" textAnchor="middle" fontSize="34" fill="currentColor">{glyphs || "𓋹"}</text>
      </svg>
      <p className="app-muted">{name} · {glyphs}</p>
    </div>
  </>;
}

function LinearB() {
  const [name, setName] = useState("ALEXANDRA");
  const signs = [...name.toUpperCase()].map((c) => LINEAR[c]);
  return <>
    <p className="app-muted">Mycenaean Greek was written in syllables, not single letters. “Alexandra” appears on a real tablet as a-re-ka-sa-da-ra. This studio applies the same idea: one sign per syllable sound.</p>
    <div className="app-toolbar"><label>Name <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} /></label>
      <button className="btn" onClick={() => navigator.clipboard?.writeText(signs.map((s) => s?.[1] ?? "").join("-"))}>Copy transliteration</button></div>
    <div className="script-card">
      <div className="script-signs">{signs.map((s, i) => <div key={i}><b>{s?.[0] ?? "·"}</b><span>{s?.[1] ?? "—"}</span></div>)}</div>
      <p className="app-muted">{signs.map((s) => s?.[1] ?? "").join("-")}</p>
    </div>
  </>;
}

function SignList() {
  const [filter, setFilter] = useState("");
  const rows = Object.entries(LINEAR).filter(([k, v]) => !filter || k.toLowerCase().includes(filter.toLowerCase()) || v[1].includes(filter.toLowerCase()));
  return <>
    <p className="app-muted">A quick reference for the syllable signs used above.</p>
    <input aria-label="Filter signs" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by letter or sound…" style={{ width: "100%", margin: "var(--sp-3) 0" }} />
    <div className="sign-grid">{rows.map(([k, v]) => <div key={k}><b>{v[0]}</b><span>{v[1]}</span><small>{k}</small></div>)}</div>
  </>;
}

const TABS = [{ id: "cartouche", label: "Cartouche maker", comp: Cartouche }, { id: "linear", label: "Your name in Linear B", comp: LinearB }, { id: "signs", label: "Sign list", comp: SignList }] as const;
export default function Scripts() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("cartouche");
  const Comp = TABS.find((t) => t.id === tab)!.comp;
  return <section className="app-section" aria-labelledby="scripts-title">
    <p className="eyebrow">ANCIENT SCRIPTS · STUDIO</p>
    <h2 id="scripts-title" className="app-heading">Write your name in an ancient script</h2>
    <p className="app-lead">Two small studios from the Languages section: a hieroglyph cartouche you can print, and a Linear B name built from real Mycenaean syllable rules. No account; the signs are drawn in your browser.</p>
    <div className="app-toolbar" role="group" aria-label="Script studio">{TABS.map((t) => <button key={t.id} className={tab === t.id ? "chip active" : "chip"} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    <div className="app-panel"><Comp /></div>
    <p className="app-attribution">Adapted from <a href="https://teddyrookbook.com/languages/hieroglyphs/" target="_blank" rel="noreferrer">Teddy Rook Book — Hieroglyphs & Linear B</a> · CC BY-NC 4.0 · glyphs rendered by system fonts</p>
  </section>;
}
