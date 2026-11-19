import { useEffect, useMemo, useState } from "react";

type Item = { title: string; subtitle?: string; body?: string; meta?: Record<string, unknown>; items?: Item[] };
type Dataset = { title: string; subtitle: string; description: string; source: string; license: string; items: Item[] };

const CATEGORIES = [
  "alkali metal", "alkaline earth metal", "transition metal", "post-transition metal",
  "metalloid", "reactive nonmetal", "noble gas", "lanthanide", "actinide", "unknown",
];
const catClass = (cat: string) => `pt-${String(cat).toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`;
const metaText = (v: unknown): string => {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["text", "short", "full"]) if (typeof o[k] === "string") return o[k] as string;
  }
  return v == null ? "—" : String(v);
};

export default function DatasetBrowser({ id }: { id: string }) {
  const [data, setData] = useState<Dataset | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const isPeriodic = id === "elements";

  useEffect(() => {
    let alive = true; setData(null); setOpen(null);
    fetch(`${import.meta.env.BASE_URL}content/data/${id}.json`)
      .then((r) => r.json()).then((d: Dataset) => { if (alive) setData(d); })
      .catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [id]);

  const allItems = useMemo(() => data?.items ?? [], [data]);
  const items = useMemo(() => allItems.filter((x) =>
    `${x.title} ${x.subtitle ?? ""} ${x.body ?? ""}`.toLowerCase().includes(query.toLowerCase())), [allItems, query]);
  const matches = (x: Item) => `${x.title} ${x.subtitle ?? ""} ${x.body ?? ""}`.toLowerCase().includes(query.toLowerCase());
  const selected = open != null ? allItems[open] : null;

  if (!data) return <p style={{ color: "var(--ink-3)" }}>Loading dataset…</p>;

  const header = (
    <header>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", margin: 0 }}>{data.title}</h2>
      <p style={{ color: "var(--ink-2)", margin: "4px 0" }}>{data.description}</p>
      <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>{data.subtitle} · source: {data.source} · {data.license}</p>
    </header>
  );
  const search = <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this dataset…" aria-label="Search dataset" style={{ width: "100%", margin: "var(--sp-3) 0" }} />;

  if (isPeriodic) {
    return (
      <section className="dataset-browser">
        {header}
        {search}
        <div className="periodic-legend" aria-label="Element categories">
          {CATEGORIES.map((cat) => <span key={cat} className={`pt-legend ${catClass(cat)}`}>{cat}</span>)}
        </div>
        <div className="periodic-table" role="group" aria-label="Periodic table of the elements">
          {allItems.map((item, i) => {
            const m = item.meta ?? {};
            const col = Number(m.col) || 1, row = Number(m.row) || 1;
            const cat = String(m.category ?? "unknown");
            if (!matches(item)) return <div key={i} aria-hidden="true" style={{ gridColumn: col, gridRow: row, visibility: "hidden" }} />;
            return (
              <button
                key={i}
                className={`pt-cell ${catClass(cat)} ${open === i ? "selected" : ""}`}
                style={{ gridColumn: col, gridRow: row }}
                onClick={() => setOpen(open === i ? null : i)}
                title={`${m.name ?? item.title} — ${cat} (Z=${m.z ?? "?"})`}
                aria-expanded={open === i}
              >
                <span className="pt-z">{String(m.z ?? "")}</span>
                <span className="pt-symbol">{String(m.symbol ?? "")}</span>
                <span className="pt-name">{String(m.name ?? "")}</span>
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="pt-detail" aria-live="polite">
            <h3>{String(selected.meta?.symbol ?? "")} · {String(selected.meta?.name ?? "")}</h3>
            <dl>
              <div><dt>Atomic number</dt><dd>{String(selected.meta?.z ?? "—")}</dd></div>
              <div><dt>Category</dt><dd>{String(selected.meta?.category ?? "—")}</dd></div>
              <div><dt>Atomic mass</dt><dd>{metaText(selected.meta?.weight)}</dd></div>
              <div><dt>Electron configuration</dt><dd>{metaText(selected.meta?.config)}</dd></div>
              <div><dt>Group / Period</dt><dd>{String(selected.meta?.group ?? "—")} / {String(selected.meta?.period ?? "—")}</dd></div>
              <div><dt>Block</dt><dd>{String(selected.meta?.block ?? "—")}</dd></div>
              <div><dt>State</dt><dd>{String(selected.meta?.state ?? "—")}</dd></div>
            </dl>
            <button className="btn" onClick={() => setOpen(null)}>Close</button>
          </div>
        )}
        {query && <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>{items.length} of {allItems.length} elements match “{query}”.</p>}
      </section>
    );
  }

  return (
    <section className="dataset-browser">
      {header}
      {search}
      <ul className="dataset-list">
        {items.slice(0, 400).map((item, i) => (
          <li key={i}>
            <button className="dataset-item" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <b>{item.title}</b><span>{item.subtitle}</span>
            </button>
            {open === i && (
              <div className="dataset-detail">
                {item.body && <p>{item.body}</p>}
                {item.items && <ul>{item.items.slice(0, 30).map((sub, j) => <li key={j}><b>{sub.title}</b> {sub.subtitle}</li>)}</ul>}
                {item.meta && <dl>{Object.entries(item.meta).filter(([, v]) => typeof v !== "object").slice(0, 12).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {items.length > 400 && <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>Showing first 400 of {items.length} items.</p>}
    </section>
  );
}
