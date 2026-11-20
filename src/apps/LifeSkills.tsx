import { useEffect, useMemo, useState } from "react";

type Step = { t: string; how: string };
type Guide = {
  area: string; key: string; name: string; time: string; level: string; teach_age: string; intro: string;
  need: string[]; before: string[]; steps: Step[]; pro: string; how_it_works: string; teach: string;
  mistakes: string[]; safety: string[]; tips: string[];
  sources: { title: string; url: string; publisher?: string }[];
};
type Area = { key: string; name: string; blurb: string; intro: string };
type Data = { areas: Area[]; guides: Guide[] };

export default function LifeSkills() {
  const [data, setData] = useState<Data | null>(null);
  const [area, setArea] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/apps/life-skills.json`).then((r) => r.json()).then(setData).catch(() => undefined);
    try { setDone(JSON.parse(localStorage.getItem("trb-life-done") || "{}")); } catch { /* nothing */ }
  }, []);
  const toggle = (key: string) => {
    const n = { ...done, [key]: !done[key] }; setDone(n);
    try { localStorage.setItem("trb-life-done", JSON.stringify(n)); } catch { /* private */ }
  };

  const guides = useMemo(() => (data?.guides ?? []).filter((g) =>
    (area === "all" || g.area === area) && (!q || `${g.name} ${g.intro}`.toLowerCase().includes(q.toLowerCase()))), [data, area, q]);
  const guide = data?.guides.find((g) => g.key === open) ?? null;

  return (
    <section className="app-section" aria-labelledby="life-title">
      <p className="eyebrow">LIFE SKILLS · FOR PARENTS AND KIDS</p>
      <h2 id="life-title" className="app-heading">Being an Adult 101</h2>
      <p className="app-lead">The things a good parent teaches before a kid leaves home: fixing what breaks, looking after a car, handling money and taxes, cooking safely, and the first grown-up steps. Each guide gives the steps, the mistakes, when to call a pro, and the science behind it.</p>

      <div className="ls-areas">
        <button className={area === "all" ? "app-card active" : "app-card"} aria-pressed={area === "all"} onClick={() => setArea("all")}>
          <span className="app-card-icon">🧭</span><b>All 34 guides</b><span>Everything in one place</span></button>
        {data?.areas.map((a) => (
          <button key={a.key} className={area === a.key ? "app-card active" : "app-card"} aria-pressed={area === a.key} onClick={() => setArea(a.key)}>
            <span className="app-card-icon">{a.key === "house" ? "🏠" : a.key === "car" ? "🚗" : a.key === "money" ? "💵" : "🍳"}</span>
            <b>{a.name}</b><span>{a.blurb}</span></button>
        ))}
      </div>

      <div className="app-toolbar">
        <input aria-label="Search guides" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the guides…" style={{ minWidth: 260 }} />
        <button className="btn" onClick={() => window.print()}>Print guide</button>
        <span className="app-muted">{guides.length} guides</span>
      </div>

      <div className="ls-layout">
        <ul className="ls-list">
          {guides.map((g) => (
            <li key={g.key}><button className={open === g.key ? "ls-guide active" : "ls-guide"} onClick={() => setOpen(g.key)}>
              <b>{g.name}</b><span className="app-muted">{g.level} · {g.time}</span></button></li>
          ))}
        </ul>
        <div className="ls-detail">
          {!guide ? <p className="app-muted">Choose a guide to read it here. Tick off steps as you go — your ticks stay in this browser.</p> : (
            <article>
              <span className="app-kicker">{data?.areas.find((a) => a.key === guide.area)?.name}</span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", margin: "4px 0 var(--sp-2)" }}>{guide.name}</h3>
              <p style={{ color: "var(--ink-2)" }}>{guide.intro}</p>
              <p className="app-muted">Time: {guide.time} · Level: {guide.level} · {guide.teach_age}</p>

              {guide.before.length > 0 && <div className="ls-block ls-warn"><h4>Before you start</h4><ul>{guide.before.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              {guide.need.length > 0 && <div className="ls-block"><h4>What you need</h4><ul>{guide.need.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              {guide.steps.length > 0 && <div className="ls-block"><h4>Steps</h4><ol>
                {guide.steps.map((s, i) => {
                  const k = `${guide.key}-step-${i}`;
                  return <li key={i}><label><input type="checkbox" checked={!!done[k]} onChange={() => toggle(k)} />
                    <b>{s.t}</b> — {s.how}</label></li>;
                })}</ol></div>}
              {guide.mistakes.length > 0 && <div className="ls-block"><h4>Common mistakes</h4><ul>{guide.mistakes.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              {guide.safety.length > 0 && <div className="ls-block ls-warn"><h4>Safety</h4><ul>{guide.safety.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              {guide.pro && <div className="ls-block"><h4>When to call a pro</h4><p>{guide.pro}</p></div>}
              {guide.how_it_works && <div className="ls-block"><h4>The science or math behind it</h4><p>{guide.how_it_works}</p></div>}
              {guide.tips.length > 0 && <div className="ls-block"><h4>Tips</h4><ul>{guide.tips.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              {guide.sources.length > 0 && <details className="ls-sources"><summary>Sources</summary><ul>
                {guide.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> {s.publisher}</li>)}
              </ul></details>}
            </article>
          )}
        </div>
      </div>

      <p className="app-attribution">
        Adapted from <a href="https://teddyrookbook.com/being-an-adult/" target="_blank" rel="noreferrer">Teddy Rook Book — Being an Adult 101</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
