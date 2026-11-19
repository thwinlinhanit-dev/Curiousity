import { useEffect, useMemo, useState } from "react";
import { sanitize } from "../utils/richtext";
import { itemKey, lessonsForItem } from "../state/library";

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

// Human names for the short keys inherited from the corpus JSON.
const LABELS: Record<string, string> = {
  z: "Atomic number", symbol: "Symbol", name: "Name", category: "Category", group: "Group",
  period: "Period", block: "Block", state: "State", weight: "Atomic mass", config: "Electron configuration",
  n: "Number", k: "Key", g: "Group", fam: "Family", t: "Type", part: "Edible part", cal: "Calories",
  pro: "Protein", fib: "Fibre", y: "Yield", kc: "Energy (kcal)", sq: "Area", dh: "Days to harvest",
  yrs: "Years", yr: "Year", season: "Season", sun: "Sun", w: "Water", soil: "Soil", clim: "Climate",
  notes: "Notes", nut: "Nutrients", src: "Sources", val: "Value", description: "Description",
  books: "Books", tags: "Tags", file: "Illustration", links: "Links",
  sal: "Salutation", sig: "Signature", words: "Word count", p: "Full text",
  intro: "Introduction", readings: "Readings", author: "Author", work: "Work",
  composer: "Composer", instrument: "Instrument", level: "Level", skills: "Skills", about: "About",
  summary: "Summary", ingredients: "Ingredients", steps: "Method", method: "Techniques",
  times: "Times", prep: "Preparation", cook: "Cooking", total: "Total",
  concept: "Concept", explanation: "Explanation", example: "Example", label: "Label",
};
const HIDE = new Set([
  "key", "slug", "order", "draft", "featured", "guide_pdf_page", "printed_ref", "capo",
  "era", "place", "id", "in_nutrition", "fixed", "show", "printed", "guide_page",
]);
const label = (k: string) => LABELS[k] ?? k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const titleOf = (x: Item, datasetId: string) => {
  if (datasetId === "papers" && /^f\d+\.json$/.test(x.title)) {
    const num = x.title.match(/\d+/)?.[0] ?? "?";
    return `${x.subtitle || "Paper"} No. ${num}`;
  }
  return x.title;
};
const subOf = (x: Item) => (x.subtitle && x.subtitle !== x.title ? x.subtitle : "");

function Field({ k, v }: { k: string; v: unknown }) {
  if (v == null || HIDE.has(k) || (typeof v === "string" && (v === "[object Object]" || !v.trim()))) return null;
  if (isObj(v)) {
    const inner = Object.entries(v).filter(([ik, iv]) => !HIDE.has(ik) && typeof iv !== "object");
    return inner.length ? <div key={k}><dt>{label(k)}</dt><dd>{inner.map(([ik, iv]) => `${label(ik)}: ${String(iv)}`).join(" · ")}</dd></div> : null;
  }
  if (Array.isArray(v)) {
    if (!v.length) return null;
    const asText = v.every((x) => typeof x !== "object");
    return <div key={k}><dt>{label(k)}</dt><dd>{asText
      ? v.join(", ")
      : <ul>{v.map((x, i) => <li key={i}>{isObj(x)
        ? Object.entries(x).filter(([, iv]) => typeof iv !== "object").map(([ik, iv]) => `${label(ik)}: ${String(iv)}`).join(" · ")
        : String(x)}</li>)}</ul>}</dd></div>;
  }
  return <div key={k}><dt>{label(k)}</dt><dd>{String(v)}</dd></div>;
}

function RelatedLessons({ id, item, index }: { id: string; item: Item; index: number }) {
  const [lessons, setLessons] = useState<{ topicId: string; title?: string; href: string }[]>([]);
  useEffect(() => {
    let alive = true;
    lessonsForItem(itemKey(id, item.meta, index)).then((l) => { if (alive) setLessons(l); });
    return () => { alive = false; };
  }, [id, item, index]);
  if (!lessons.length) return null;
  const base = window.location.pathname;
  return (
    <div className="dataset-lessons">
      <h4>Lessons this connects to</h4>
      {lessons.map((l) => <a key={l.topicId} href={`${base}${l.href}`}>{l.title ?? l.topicId}</a>)}
    </div>
  );
}

function Details({ item, id, index }: { item: Item; id: string; index: number }) {
  const m = item.meta ?? {};
  const body = item.body && item.body !== "[object Object]" ? item.body : null;

  return (
    <div className="dataset-detail">
      {body && <p>{body}</p>}

      {id === "recipes" && Array.isArray(m.ingredients) && (
        <section><h4>Ingredients</h4><ul>{m.ingredients.map((raw, i) => {
          const g = isObj(raw) ? raw : {};
          return <li key={i}><b>{String(g.item ?? g.name ?? "")}</b> {String(g.amount ?? "")} {String(g.unit ?? "")}{g.prep ? ` — ${String(g.prep)}` : ""}</li>;
        })}</ul></section>
      )}
      {id === "recipes" && Array.isArray(m.steps) && (
        <section><h4>Method</h4><ol>{m.steps.map((s, i) => <li key={i}>{String(s)}</li>)}</ol></section>
      )}
      {id === "papers" && Array.isArray(m.p) && (
        <section><h4>Full text</h4>{m.p.map((para, i) => <p key={i} dangerouslySetInnerHTML={{ __html: sanitize(String(para)) }} />)}</section>
      )}
      {id === "infographics" && (
        <section>
          {typeof m.description === "string" && <p>{m.description}</p>}
          {typeof m.file === "string" && (
            <img className="infographic" src={`${import.meta.env.BASE_URL}content/data/infographics/${m.file}.svg`}
              alt={`Infographic: ${item.title}`} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
        </section>
      )}
      {id === "harvard" && Array.isArray(m.intro) && (
        <section><h4>Introduction</h4>{m.intro.map((s, i) => <p key={i}>{String(s)}</p>)}</section>
      )}

      <dl>{Object.entries(m).map(([k, v]) => <Field key={k} k={k} v={v} />)}</dl>
      {item.items && item.items.length > 0 && (
        <ul>{item.items.slice(0, 30).map((sub, j) => <li key={j}><b>{sub.title}</b> {sub.subtitle}</li>)}</ul>
      )}
      <RelatedLessons id={id} item={item} index={index} />
    </div>
  );
}

export default function DatasetBrowser({ id, itemParam }: { id: string; itemParam?: string | null }) {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const isPeriodic = id === "elements";
  const idxOf = (x: Item) => allItems.indexOf(x);

  useEffect(() => {
    let alive = true; setData(null); setError(""); setOpen(null);
    fetch(`${import.meta.env.BASE_URL}content/data/${id}.json`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        if (!d || !Array.isArray(d.items)) throw new Error("Not a dataset");
        return d as Dataset;
      })
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(String(e)); });
    return () => { alive = false; };
  }, [id]);

  // deep link: ?data=<id>&item=<key> opens that entry and scrolls to it
  useEffect(() => {
    if (!data || !itemParam) return;
    const i = (data.items ?? []).findIndex((x, j) => itemKey(id, x.meta, j) === itemParam || String(x.meta?.slug ?? x.meta?.id ?? j) === itemParam);
    if (i >= 0) {
      setOpen(i);
      requestAnimationFrame(() => document.querySelector(".dataset-detail, .pt-detail")?.scrollIntoView({ block: "center" }));
    }
  }, [data, itemParam, id]);

  const allItems = useMemo(() => data?.items ?? [], [data]);
  const matches = (x: Item) => `${x.title} ${x.subtitle ?? ""} ${x.body ?? ""} ${Object.values(x.meta ?? {}).filter((v) => typeof v === "string").join(" ")}`.toLowerCase().includes(query.toLowerCase());
  const items = useMemo(() => allItems.filter(matches), [allItems, query]);
  const selected = open != null ? allItems[open] : null;

  if (error) return (
    <section className="dataset-browser">
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", margin: 0 }}>Dataset not found</h2>
      <p role="alert" style={{ color: "var(--danger)" }}>No dataset is published under “{id}” ({error}).</p>
      <button className="btn" onClick={() => { window.location.href = window.location.pathname; }}>← All topics</button>
    </section>
  );
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
              <button key={i} className={`pt-cell ${catClass(cat)} ${open === i ? "selected" : ""}`} style={{ gridColumn: col, gridRow: row }}
                onClick={() => setOpen(open === i ? null : i)} title={`${m.name ?? item.title} — ${cat} (Z=${m.z ?? "?"})`} aria-expanded={open === i}>
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
            {open != null && <RelatedLessons id={id} item={selected} index={open} />}
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
            <button className="dataset-item" aria-expanded={open === idxOf(item)} onClick={() => setOpen(open === idxOf(item) ? null : idxOf(item))}>
              <b>{titleOf(item, id)}</b>{subOf(item) && <span>{subOf(item)}</span>}
            </button>
            {open === idxOf(item) && <Details item={item} id={id} index={idxOf(item)} />}
          </li>
        ))}
      </ul>
      {items.length > 400 && <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>Showing first 400 of {items.length} items.</p>}
    </section>
  );
}
