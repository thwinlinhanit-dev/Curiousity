import { useEffect, useMemo, useState } from "react";

type SetDef = { id: string; label: string; color: string };
type Region = { id: string; sets: string[]; title: string; intro: string };
type Data = { title: string; source_url: string; license: string; sets: SetDef[]; regions: Region[] };

const GROUPS = [
  { n: 1, label: "One subject" }, { n: 2, label: "Where two meet" },
  { n: 3, label: "Where three meet" }, { n: 4, label: "Where four meet" },
  { n: 5, label: "All five" },
];

// Decorative five-oval layout for the diagram. The accessible, keyboard-friendly
// interaction is the region list beside it.
const OVALS = [
  { cx: 170, cy: 120, rx: 110, ry: 62, rot: -22 },
  { cx: 250, cy: 100, rx: 105, ry: 60, rot: 22 },
  { cx: 210, cy: 165, rx: 115, ry: 58, rot: 0 },
  { cx: 155, cy: 195, rx: 100, ry: 55, rot: 35 },
  { cx: 265, cy: 185, rx: 100, ry: 55, rot: -35 },
];

export default function Connections() {
  const [data, setData] = useState<Data | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/apps/connections.json`)
      .then((r) => r.json()).then((d: Data) => setData(d))
      .catch(() => undefined);
  }, []);

  const regions = useMemo(() => {
    if (!data) return [];
    return data.regions.filter((r) => filter === "all" || r.sets.includes(filter));
  }, [data, filter]);
  const active = data?.regions.find((r) => r.id === selected) ?? null;
  const activeSet = data?.sets.find((s) => s.id === filter);

  return (
    <section className="app-section" aria-labelledby="cx-title">
      <p className="eyebrow">CROSS-SUBJECT · 31 REGIONS</p>
      <h2 id="cx-title" className="app-heading">{data?.title ?? "Where the subjects meet"}</h2>
      <p className="app-lead">
        Music, patterns, maths, chemistry and physics look like five separate subjects. Look closer and they keep
        running into each other: a guitar string and an electron follow the same standing-wave rules, and a planet
        and an electron obey the same law of orbits. Every overlap is a place you can explore.
      </p>

      <div className="cx-toolbar" role="group" aria-label="Filter by subject">
        <button className={filter === "all" ? "chip active" : "chip"} aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setSelected(null); }}>All 31 regions</button>
        {data?.sets.map((s) => (
          <button key={s.id} className={filter === s.id ? "chip active" : "chip"} aria-pressed={filter === s.id}
            onClick={() => { setFilter(s.id); setSelected(null); }} style={{ borderColor: filter === s.id ? s.color : undefined }}>
            <span className="cx-dot" style={{ background: s.color }} aria-hidden="true" /> {s.label}
          </button>
        ))}
      </div>

      <div className="cx-layout">
        <div className="cx-diagram" aria-hidden="true">
          <svg viewBox="0 0 420 300" role="presentation">
            {OVALS.map((o, i) => {
              const s = data?.sets[i];
              const dim = filter !== "all" && s?.id !== filter;
              return <ellipse key={i} cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry}
                transform={`rotate(${o.rot} ${o.cx} ${o.cy})`}
                fill={s?.color ?? "#888"} fillOpacity={dim ? 0.05 : active?.sets.includes(s?.id ?? "") ? 0.28 : 0.14}
                stroke={s?.color ?? "#888"} strokeOpacity={dim ? 0.25 : 0.9} strokeWidth={active?.sets.includes(s?.id ?? "") ? 3 : 2} />;
            })}
            {data?.sets.map((s, i) => (
              <text key={s.id} x={i === 0 ? 70 : i === 1 ? 330 : i === 2 ? 210 : i === 3 ? 100 : 325}
                y={i === 0 ? 70 : i === 1 ? 55 : i === 2 ? 285 : i === 3 ? 260 : 255}
                textAnchor="middle" fontSize="13" fontWeight="700" fill={s.color}>{s.label}</text>
            ))}
          </svg>
          <p className="app-muted" style={{ textAlign: "center", marginTop: 0 }}>
            {activeSet ? `Showing regions that include ${activeSet.label}.` : "Pick a subject above, then choose a region."}
          </p>
        </div>

        <div className="cx-regions">
          {GROUPS.map((g) => {
            const items = regions.filter((r) => r.sets.length === g.n);
            if (items.length === 0) return null;
            return (
              <div key={g.n} className="cx-group">
                <h3>{g.label} <span className="app-tag">{items.length}</span></h3>
                <div className="cx-region-grid">
                  {items.map((r) => (
                    <button key={r.id} className={selected === r.id ? "cx-region active" : "cx-region"}
                      aria-pressed={selected === r.id} onClick={() => setSelected(selected === r.id ? null : r.id)}>
                      <span className="cx-region-sets">
                        {r.sets.map((id) => {
                          const s = data?.sets.find((x) => x.id === id);
                          return <span key={id} className="cx-dot" style={{ background: s?.color }} title={s?.label} aria-hidden="true" />;
                        })}
                      </span>
                      <b>{r.title}</b>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {active && (
        <div className="app-panel cx-detail" role="status">
          <span className="app-kicker">{active.sets.map((id) => data?.sets.find((s) => s.id === id)?.label).join(" + ")}</span>
          <h3 style={{ margin: "4px 0 var(--sp-2)" }}>{active.title}</h3>
          <p style={{ color: "var(--ink-2)", maxWidth: 720, margin: 0 }}>{active.intro}</p>
          <button className="btn-link" style={{ marginTop: "var(--sp-3)" }} onClick={() => setSelected(null)}>Close detail</button>
        </div>
      )}

      <p className="app-attribution">
        Region titles and explanations adapted from <a href="https://teddyrookbook.com/connections/" target="_blank" rel="noreferrer">Teddy Rook Book — Connections</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
