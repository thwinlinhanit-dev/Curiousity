import { useEffect, useMemo, useState } from "react";

type Step = { n: number; book: string; title: string; note: string; free: boolean; url: string };
type Path = { id: string; title: string; blurb: string; steps: Step[]; extra: { label: string; url: string }[] };
type PathData = { paths: Path[] };
type Event = { meta: { id: string; year: number; when: string; era: string; place: string; title: string; text: string; links?: [string, string, string][] } };
type TimelineData = { items: Event[] };

export default function ReadingPaths() {
  const [tab, setTab] = useState<"paths" | "timeline">("paths");
  const [data, setData] = useState<PathData | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [place, setPlace] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/apps/reading-paths.json`).then((r) => r.json()).then(setData).catch(() => undefined);
    fetch(`${import.meta.env.BASE_URL}content/data/timeline.json`).then((r) => r.json()).then(setTimeline).catch(() => undefined);
    try { setRead(JSON.parse(localStorage.getItem("trb-read") || "{}")); } catch { /* nothing */ }
  }, []);
  const toggle = (k: string) => { const n = { ...read, [k]: !read[k] }; setRead(n); try { localStorage.setItem("trb-read", JSON.stringify(n)); } catch { /* private */ } };

  const path = data?.paths.find((p) => p.id === open) ?? null;
  const places = useMemo(() => [...new Set((timeline?.items ?? []).map((e) => e.meta.place).filter(Boolean))].sort(), [timeline]);
  const events = useMemo(() => (timeline?.items ?? [])
    .filter((e) => place === "all" || e.meta.place === place)
    .filter((e) => !q || `${e.meta.title} ${e.meta.text}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.meta.year - b.meta.year), [timeline, place, q]);
  const yearLabel = (y: number) => y < 0 ? `${Math.abs(y)} BC` : `${y} AD`;

  return (
    <section className="app-section" aria-labelledby="paths-title">
      <p className="eyebrow">LIBRARY · TIMELINE</p>
      <h2 id="paths-title" className="app-heading">Reading paths and the ancient world</h2>
      <p className="app-lead">Seven short routes through the library in a sensible order, with a line on why each book is there. Tick off what you have read — it is remembered in this browser. Then see where those books sit on the timeline of the ancient world.</p>

      <div className="app-toolbar" role="group" aria-label="View">
        <button className={tab === "paths" ? "chip active" : "chip"} aria-pressed={tab === "paths"} onClick={() => setTab("paths")}>Reading paths</button>
        <button className={tab === "timeline" ? "chip active" : "chip"} aria-pressed={tab === "timeline"} onClick={() => setTab("timeline")}>Timeline</button>
      </div>

      {tab === "paths" && (
        <>
          <div className="rp-grid">
            {data?.paths.map((p) => {
              const done = p.steps.filter((s) => read[`${p.id}-${s.book}`]).length;
              return <button key={p.id} className={open === p.id ? "app-card active" : "app-card"} aria-pressed={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>
                <span className="app-card-icon">{p.id === "greeks" ? "🏛️" : p.id === "romans" ? "🦅" : p.id === "myths" ? "🐉" : p.id === "faith" ? "✝️" : "📚"}</span>
                <b>{p.title}</b><span>{p.blurb}</span>
                <span className="app-tag">{done} / {p.steps.length} read</span>
              </button>;
            })}
          </div>
          {path && (
            <div className="app-panel rp-detail">
              <h3 style={{ marginTop: 0 }}>{path.title}</h3>
              <ol className="rp-steps">
                {path.steps.map((s) => {
                  const k = `${path.id}-${s.book}`, ticked = !!read[k];
                  return <li key={s.book}>
                    <label><input type="checkbox" checked={ticked} onChange={() => toggle(k)} />
                      <span className={ticked ? "rp-read" : ""}><b>{s.title}</b> — {s.note}</span></label>
                    <a href={s.url} target="_blank" rel="noreferrer">{s.free ? "Find a free copy →" : "About this book →"}</a>
                  </li>;
                })}
              </ol>
              {path.extra.length > 0 && <p className="app-muted">Go deeper: {path.extra.map((x, i) => <span key={i}><a href={x.url} target="_blank" rel="noreferrer">{x.label}</a>{i < path.extra.length - 1 ? " · " : ""}</span>)}</p>}
            </div>
          )}
        </>
      )}

      {tab === "timeline" && (
        <div className="app-panel">
          <div className="app-toolbar">
            <label>Era or place
              <select value={place} onChange={(e) => setPlace(e.target.value)}>
                <option value="all">Everything</option>
                {places.map((p) => <option key={p} value={p}>{p.replace(/-/g, " ")}</option>)}
              </select></label>
            <input aria-label="Search events" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" style={{ minWidth: 220 }} />
            <span className="app-muted">{events.length} events</span>
          </div>
          <ol className="rp-timeline">
            {events.map((e) => (
              <li key={e.meta.id}>
                <span className="rp-year">{yearLabel(e.meta.year)}</span>
                <div><b>{e.meta.title}</b> <span className="app-muted">{e.meta.when}</span>
                  <p>{e.meta.text}</p>
                  {e.meta.links?.length ? <p className="app-muted">{e.meta.links.map(([, label, url], i) =>
                    <a key={i} href={url.startsWith("/") ? `https://teddyrookbook.com${url}` : url} target="_blank" rel="noreferrer">{label} → </a>)}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="app-attribution">
        Adapted from <a href="https://teddyrookbook.com/books/paths/" target="_blank" rel="noreferrer">Teddy Rook Book — Reading Paths</a> and the <a href="https://teddyrookbook.com/timeline/" target="_blank" rel="noreferrer">Timeline of the Ancient World</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
