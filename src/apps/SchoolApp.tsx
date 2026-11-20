import { useEffect, useMemo, useState } from "react";

type Course = { key: string; name: string; from: number; to: number; mins: number; rep: number; w: string; ladder: string | null; lc: string | null; url: string; alt: boolean };
type Subject = { key: string; name: string; note: string; on_ages: [number, number][]; mins: [number, number][]; hw: [number, number][]; courses: Course[] };
type Point = { course: string; lesson: number; book: string; ask: string; lines: string[]; answers: string[] };
type Check = { key: string; name: string; how: string; judge: string[]; start: [number, number][]; points: Point[] };
type Data = { subjects: Subject[]; checks: Check[] };
type Child = { id: string; name: string; age: number; on: string[] };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const load = (u: string) => fetch(`${import.meta.env.BASE_URL}${u}`).then((r) => r.json());
const band = (rows: [number, number][], age: number) => (rows.find(([to]) => age <= to)?.[1] ?? rows[rows.length - 1]?.[1] ?? 0);
const defaultOn = (s: Subject, age: number) => s.on_ages.some(([a, b]) => age >= a && age <= b);
const suggested = (s: Subject, age: number) => s.courses.find((c) => !c.alt && age <= c.to && age >= c.from) ?? s.courses.find((c) => !c.alt && age <= c.to) ?? s.courses[0];

export default function SchoolApp() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"plan" | "place" | "books">("plan");
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [place, setPlace] = useState<{ subject: string; idx: number; history: string[] } | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [placeAge, setPlaceAge] = useState(9);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  useEffect(() => {
    load("content/apps/school.json").then(setData).catch(() => undefined);
    try {
      const saved = JSON.parse(localStorage.getItem("trb-school-children") || "[]") as Child[];
      // Legacy plans could keep Pre-K switched on for an older child.
      setChildren(saved.map((c) => ({ ...c, on: c.age > 5 ? c.on.filter((k) => k !== "early") : c.on })));
    } catch { /* nothing */ }
  }, []);
  const save = (c: Child[]) => { setChildren(c); try { localStorage.setItem("trb-school-children", JSON.stringify(c)); } catch { /* private */ } };

  const addChild = () => {
    const n = name.trim(); if (!n) return;
    const root: Child = { id: `${Date.now()}`, name: n, age, on: (data?.subjects ?? []).filter((s) => defaultOn(s, age)).map((s) => s.key) };
    save([...children, root]); setName("");
  };
  const toggleSubject = (id: string, key: string) => save(children.map((c) => c.id === id ? { ...c, on: c.on.includes(key) ? c.on.filter((k) => k !== key) : [...c.on, key] } : c));
  const useAgeSuggestions = (id: string) => save(children.map((c) => c.id === id
    ? { ...c, on: (data?.subjects ?? []).filter((s) => defaultOn(s, c.age)).map((s) => s.key) }
    : c));

  const plan = useMemo(() => children.map((c) => {
    const rows = (data?.subjects ?? []).filter((s) => c.on.includes(s.key)).map((s) => {
      const mins = band(s.mins, c.age), course = suggested(s, c.age);
      return { subject: s, mins, perDay: Math.round(mins / 5), course };
    });
    return { child: c, rows };
  }), [children, data]);

  const startPlace = (key: string) => {
    const check = data?.checks.find((x) => x.key === key); if (!check) return;
    const idx = band(check.start, placeAge);
    setPlace({ subject: key, idx: Math.min(idx, check.points.length - 1), history: [] });
    setShowAnswers(false);
  };
  const judge = (i: number) => {
    if (!place || !data) return;
    const check = data.checks.find((x) => x.key === place.subject)!;
    const delta = i === 0 ? 2 : i === 1 ? 0 : -2;
    const idx = Math.max(0, Math.min(check.points.length - 1, place.idx + delta));
    const done = (i === 0 && place.idx >= check.points.length - 2) || (i === 2 && place.idx <= 1);
    if (done) {
      const found = check.points[idx];
      const child = children.find((c) => c.name === placeName);
      if (child) save(children.map((c) => c.id === child.id ? { ...c, on: [...new Set([...c.on, "mathladder", "arithmetic"])] } : c));
      window.alert(`${check.name}: start at “${found.book}” (course ${found.course}, lesson ${found.lesson}).${child ? " Reading and arithmetic have been switched on in the planner." : ""}`);
      setPlace(null);
    } else setPlace({ ...place, idx, history: [...place.history, check.judge[i]] });
  };

  const activeCheck = place && data?.checks.find((c) => c.key === place.subject);
  const activePoint = activeCheck?.points[place?.idx ?? 0];

  return (
    <section className="app-section" aria-labelledby="school-title">
      <p className="eyebrow">HOMESCHOOL · SCHOOL DAY</p>
      <h2 id="school-title" className="app-heading">Plan the day, find the starting point</h2>
      <p className="app-lead">Tell it who you are teaching and how much time you have, and it lays out the week across the ladders and classic schoolbooks. Change anything and the plan updates. It is saved in this browser, and it prints.</p>

      <div className="app-toolbar" role="group" aria-label="School tool">
        <button className={tab === "plan" ? "chip active" : "chip"} aria-pressed={tab === "plan"} onClick={() => setTab("plan")}>Lesson planner</button>
        <button className={tab === "place" ? "chip active" : "chip"} aria-pressed={tab === "place"} onClick={() => setTab("place")}>Where should we start?</button>
        <button className={tab === "books" ? "chip active" : "chip"} aria-pressed={tab === "books"} onClick={() => setTab("books")}>Classic schoolbooks</button>
      </div>

      {tab === "plan" && (
        <>
          <div className="app-panel">
            <h3 style={{ marginTop: 0 }}>Your children</h3>
            <div className="app-toolbar">
              <label>Name <input aria-label="Child name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anna" /></label>
              <label>Age <input type="number" min={3} max={18} value={age} onChange={(e) => setAge(Math.max(3, Math.min(18, Number(e.target.value) || 9)))} /></label>
              <button className="btn-primary" onClick={addChild}>Add child</button>
            </div>
            {children.length === 0 && <p className="app-muted">Add a child to build a week-by-week plan.</p>}
          </div>

          {plan.map(({ child, rows }) => (
            <div className="app-panel sc-plan" key={child.id}>
              <div className="sc-plan-head"><h3 style={{ marginTop: 0 }}>{child.name} · age {child.age}</h3>
                <div className="app-toolbar"><button className="btn" onClick={() => window.print()}>Print plan</button>
                  <button className="btn" onClick={() => useAgeSuggestions(child.id)}>Use age suggestions</button>
                  <button className="btn" onClick={() => save(children.filter((c) => c.id !== child.id))}>Remove</button></div></div>
              <p className="app-muted">Suggested subjects are switched on for this age. Tick or untick anything, then set the minutes below.</p>
              <label className="app-muted" style={{ display: "inline-flex", gap: "var(--sp-2)", alignItems: "center" }}>
                <input type="checkbox" checked={showAllSubjects} onChange={(e) => setShowAllSubjects(e.target.checked)} />
                Show subjects for other ages
              </label>
              <div className="sc-subjects">
                {data?.subjects.filter((s) => showAllSubjects || defaultOn(s, child.age) || child.on.includes(s.key)).map((s) => (
                  <label key={s.key} className={child.on.includes(s.key) ? "sc-subject on" : "sc-subject"}>
                    <input type="checkbox" checked={child.on.includes(s.key)} onChange={() => toggleSubject(child.id, s.key)} />
                    <span><b>{s.name}</b><small>{band(s.mins, child.age)} min/week · {suggested(s, child.age)?.name ?? ""}</small></span>
                  </label>
                ))}
              </div>
              <h4>Week at a glance</h4>
              <table className="sc-week"><thead><tr><th>Subject</th>{DAYS.map((d) => <th key={d}>{d.slice(0, 3)}</th>)}</tr></thead>
                <tbody>{rows.map((r) => <tr key={r.subject.key}><td>{r.subject.name}</td>{DAYS.map((d) => <td key={d}>{r.perDay}m</td>)}</tr>)}</tbody></table>
              <p className="app-muted">Weekly lesson minutes are spread evenly over five school days. Open the linked course on Teddy Rook Book for the actual lessons.</p>
            </div>
          ))}
        </>
      )}

      {tab === "place" && (
        <div className="app-panel">
          <div className="app-toolbar">
            <label>Name <input aria-label="Learner name" value={placeName} onChange={(e) => setPlaceName(e.target.value)} /></label>
            <label>Age <input type="number" min={3} max={18} value={placeAge} onChange={(e) => setPlaceAge(Math.max(3, Math.min(18, Number(e.target.value) || 9)))} /></label>
          </div>
          {!place ? (
            <div className="sc-checks">
              {data?.checks.map((c) => (
                <button key={c.key} className="app-card" onClick={() => startPlace(c.key)}>
                  <span className="app-card-icon">{c.key === "reading" ? "📖" : c.key === "spelling" ? "✏️" : "🧮"}</span>
                  <b>{c.name}</b><span>{c.how}</span><span className="app-card-cta">Start check →</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="sc-check">
              <span className="app-kicker">{activeCheck?.name} · CHECK {place.idx + 1} OF {activeCheck?.points.length}</span>
              <p style={{ color: "var(--ink-2)" }}>{activeCheck?.how}</p>
              {activePoint?.ask && <p><b>{activePoint.ask}</b></p>}
              <div className="sc-lines">{activePoint?.lines.map((l, i) => <p key={i}>{l}</p>)}</div>
              {activePoint?.answers.length ? <p><button className="btn-link" onClick={() => setShowAnswers(!showAnswers)}>{showAnswers ? "Hide answers" : "Show answers"}</button>
                {showAnswers && <span className="app-muted"> {activePoint.answers.join(" · ")}</span>}</p> : null}
              <p className="app-muted">{activePoint?.book}</p>
              <div className="app-toolbar">{activeCheck?.judge.map((j, i) => <button key={i} className="btn" onClick={() => judge(i)}>{j}</button>)}</div>
              <p className="app-muted">Step {place.history.length + 1} · {place.history.join(" → ") || "no answer yet"}</p>
            </div>
          )}
        </div>
      )}

      {tab === "books" && (
        <div className="app-panel">
          {data?.subjects.filter((s) => s.courses.some((c) => c.ladder === null)).map((s) => (
            <div key={s.key} className="sc-books">
              <h3>{s.name}</h3><p className="app-muted">{s.note}</p>
              <ul>{s.courses.filter((c) => c.ladder === null).map((c) => <li key={c.key}>
                <a href={c.url.startsWith("/") ? `https://teddyrookbook.com${c.url}` : c.url} target="_blank" rel="noreferrer">{c.name}</a>
                <span className="app-muted"> · ages {c.from}–{c.to} · {c.w} based</span></li>)}</ul>
            </div>
          ))}
        </div>
      )}

      <p className="app-attribution">
        Adapted from <a href="https://teddyrookbook.com/homeschool/" target="_blank" rel="noreferrer">Teddy Rook Book — Homeschool</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
