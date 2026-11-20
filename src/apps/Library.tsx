import { useEffect, useRef, useState } from "react";
import { getGraph } from "../state/progress";
import { plural } from "../utils/plural";

type Tab = "ap" | "bible" | "ideas" | "phonics" | "family" | "citizenship" | "cases" | "competition" | "science" | "papers" | "harvard";
const TABS: { id: Tab; label: string; file: string }[] = [
  { id: "ap", label: "AP exam maps", file: "ap-maps.json" },
  { id: "bible", label: "Bible in a Year", file: "bible-year.json" },
  { id: "ideas", label: "Great Ideas", file: "ideas.json" },
  { id: "phonics", label: "Phonics", file: "phonics.json" },
  { id: "family", label: "Family units", file: "family-units.json" },
  { id: "citizenship", label: "Citizenship", file: "citizenship.json" },
  { id: "cases", label: "Business cases", file: "cases.json" },
  { id: "competition", label: "Competition", file: "competition.json" },
  { id: "science", label: "Science units", file: "science-units.json" },
  { id: "papers", label: "Founding papers", file: "../data/papers.json" },
];
const text = (v: unknown): string => typeof v === "string" ? v : Array.isArray(v) ? v.map(text).join(" ") : v && typeof v === "object" ? Object.values(v).map(text).join(" ") : v == null ? "" : String(v);
const asList = (v: unknown): { title: string; body: string }[] => (Array.isArray(v) ? v : []).map((x) => ({
  title: text((x as Record<string, unknown>).title ?? (x as Record<string, unknown>).name ?? (x as Record<string, unknown>).t ?? ""),
  body: text((x as Record<string, unknown>).body ?? (x as Record<string, unknown>).text ?? (x as Record<string, unknown>).note ?? (x as Record<string, unknown>).how ?? ""),
}));

export default function Library() {
  const [tab, setTab] = useState<Tab>("ap");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [harvardDate, setHarvardDate] = useState(new Date().toISOString().slice(0, 10));
  const [harvard, setHarvard] = useState<{ text: string } | null>(null);
  const cache = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (tab === "harvard") return;
    const file = TABS.find((t) => t.id === tab)!.file;
    if (cache.current[file]) { setData(cache.current[file] as Record<string, unknown>); setError(""); return; }
    setData(null); setError("");
    fetch(`${import.meta.env.BASE_URL}content/apps/${file}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => { cache.current[file] = d; setData(d); })
      .catch(() => setError("This dataset could not be loaded. Check the content files and try again."));
  }, [tab]);

  useEffect(() => {
    if (tab !== "harvard") return;
    setHarvard(null);
    fetch(`${import.meta.env.BASE_URL}content/harvard/${harvardDate}.json`).then((r) => r.json()).then(setHarvard).catch(() => setHarvard({ text: "No reading saved for this date." }));
  }, [tab, harvardDate]);
  useEffect(() => { try { setRead(JSON.parse(localStorage.getItem("trb-library-read") || "{}")); } catch { /* nothing */ } }, []);
  const toggle = (k: string) => { const n = { ...read, [k]: !read[k] }; setRead(n); try { localStorage.setItem("trb-library-read", JSON.stringify(n)); } catch { /* private */ } };

  const topicLink = (id: string) => {
    const topic = getGraph().topics.find((t) => t.id === id);
    if (!topic) return null;
    return { href: `?s=${encodeURIComponent(topic.ladder)}&c=${encodeURIComponent(topic.course)}&t=${encodeURIComponent(topic.slug ?? id.split(".").slice(1).join("."))}`, title: topic.title };
  };
  const filtered = (list: { title: string; body: string }[]) => list.filter((x) => !q || `${x.title} ${x.body}`.toLowerCase().includes(q.toLowerCase()));

  const render = () => {
    if (!data && tab !== "harvard") return <p className="app-muted">{error || "Loading…"}</p>;
    const d = data ?? {};

    if (tab === "ap") return <>
      <p className="app-muted">Every AP course mapped to the exact ladder topics it uses, with official exam weights. Pick a unit to open its topics.</p>
      <div className="lib-cards">{(d.exams as { key: string; title: string; blurb: string; units: { num?: number; title: string; weight: string; topics: string[] }[] }[] ?? []).map((e) => (
        <details key={e.key} className="lib-item"><summary><b>{e.title}</b> <span className="app-muted">{plural(e.units.length, "unit")}</span></summary>
          <p className="app-muted">{e.blurb}</p>
          {e.units.map((u) => <div key={u.num} className="lib-unit"><b>{u.num}. {u.title}</b> <span className="app-tag">{u.weight}</span>
            <ul>{u.topics.map((id) => { const link = topicLink(id); return <li key={id}>{link ? <a href={link.href}>{link.title} →</a> : <span className="app-muted">{id}</span>}</li>; })}</ul>
          </div>)}
        </details>))}</div>
    </>;

    if (tab === "bible") {
      const days = (d.days as { day?: number; date?: string; read?: string[]; books?: string[] }[] | undefined) ?? [];
      return <>
        <p className="app-muted">A 365-day reading plan in narrative order, with psalms and proverbs. Tick days as you go — they stay in this browser. The plan links out to public-domain translations.</p>
        <div className="lib-days">{days.map((day, i) => {
          const key = `bible-${i}`; return <button key={i} className={read[key] ? "lib-day done" : "lib-day"} onClick={() => toggle(key)} aria-pressed={!!read[key]}>{day.day ?? i + 1}</button>;
        })}</div>
      </>;
    }

    if (tab === "ideas") {
      const ideas = (d.ideas as { name?: string; title?: string; group?: string; summary?: string }[] | undefined) ?? [];
      const pages = (d.pages ?? {}) as Record<string, unknown>;
      return <>
        <p className="app-muted">Sixty great ideas, from Beauty to War, with a short essay for each and links across the Great Books ladder.</p>
        <div className="lib-cards">{filtered(asList(ideas.map((i) => ({ title: i.title ?? i.name, body: i.summary ?? "" })))).slice(0, 80).map((x) => {
          const page = Object.entries(pages).find(([k]) => k.includes(String(x.title).toLowerCase().slice(0, 6)))?.[1];
          return <details key={x.title} className="lib-item"><summary><b>{x.title}</b></summary><p>{x.body}</p>{page ? <p className="app-muted">{text(page).slice(0, 900)}</p> : null}</details>;
        })}</div>
      </>;
    }

    if (tab === "phonics") return <>
      <p className="app-muted">The full early-reading sequence, from letter sounds through vowel teams and endings.</p>
      <div className="lib-cards">{((d.steps as unknown[]) ?? []).map((s, i) => {
        const o = s as Record<string, unknown>; const units = asList(o.units ?? o.lessons);
        return <details key={i} className="lib-item"><summary><b>{i + 1}. {text(o.title ?? o.name ?? o.step)}</b></summary>
          <ul>{units.map((u, j) => <li key={j}>{u.title} {u.body && <span className="app-muted">— {u.body}</span>}</li>)}</ul></details>;
      })}</div>
    </>;

    if (tab === "family") return <>
      <p className="app-muted">Multi-subject units with parts and hands-on projects for a family or co-op.</p>
      <div className="lib-cards">{filtered(asList(d.units)).map((u, i) => <details key={i} className="lib-item"><summary><b>{u.title}</b></summary><p className="app-muted">{u.body}</p></details>)}</div>
    </>;

    if (tab === "citizenship") {
      const sets = (d.sets as { version: string; questions: { q?: string; a?: string; answer?: string; star?: boolean }[] }[] | undefined) ?? [];
      const set = sets.find((s) => s.version === "2025") ?? sets[0];
      return <>
        <p className="app-muted">The U.S. naturalization test questions with answers and the starred set used in the interview.</p>
        <div className="lib-cards">{(set?.questions ?? []).filter((x) => !q || text(x.q).toLowerCase().includes(q.toLowerCase())).map((x, i) => (
          <details key={i} className="lib-item"><summary><b>{text(x.q)}</b> {x.star && <span className="app-tag">starred</span>}</summary><p>{text(x.a ?? x.answer)}</p></details>))}</div>
      </>;
    }

    if (tab === "cases") return <>
      <p className="app-muted">Short cases from real companies, each told briefly with the numbers, the lesson and questions to discuss.</p>
      <div className="lib-cards">{(d.cases as Record<string, unknown>[] | undefined ?? []).filter((c) => !q || text(c.title ?? c.name).toLowerCase().includes(q.toLowerCase())).map((c, i) => (
        <details key={i} className="lib-item"><summary><b>{text(c.title ?? c.name)}</b></summary><p>{text(c.summary ?? c.story ?? "")}</p>
          <p className="app-muted"><b>Numbers:</b> {text(c.numbers ?? "")}</p><p className="app-muted"><b>Lesson:</b> {text(c.moral ?? c.lesson ?? c.lessons ?? "")}</p></details>))}</div>
    </>;

    if (tab === "competition") {
      const problems = (d.problems as { kind: string; title: string; problem: string; hint: string; solution: string; original: boolean }[] | undefined) ?? [];
      return <>
        <p className="app-muted">Problem archives. Only the original problems and public-domain papers are reproduced in full; official IMO and Putnam problems are linked, not copied.</p>
        <div className="lib-cards">{problems.filter((p) => (p.original || !q) && (!q || p.title.toLowerCase().includes(q.toLowerCase()))).slice(0, 120).map((p, i) => (
          <details key={i} className="lib-item"><summary><b>{p.title}</b> <span className="app-tag">{p.kind}</span></summary>
            <p>{p.original ? p.problem : "See the official problem set on the live site."}</p>
            {p.original && <><p className="app-muted"><b>Hint:</b> {p.hint}</p><p className="app-muted"><b>Solution:</b> {p.solution}</p></>}
            <a href="https://teddyrookbook.com/math/competitions/" target="_blank" rel="noreferrer">Open on Teddy Rook Book →</a>
          </details>))}</div>
      </>;
    }

    if (tab === "science") return <>
      <p className="app-muted">Chapter-by-chapter deep dives that pair a simulation with worked examples, a quiz and the history.</p>
      <div className="lib-cards">{(d.units as { key: string; title?: string; chapters?: { title?: string; text?: string }[] }[] | undefined ?? []).map((u) => (
        <details key={u.key} className="lib-item"><summary><b>{u.title ?? u.key}</b> <span className="app-tag">{plural((u.chapters ?? []).length, "chapter")}</span></summary>
          <ul>{(u.chapters ?? []).map((c, i) => <li key={i}>{text(c.title ?? c)}</li>)}</ul></details>))}</div>
    </>;

    if (tab === "papers") {
      const items = (d.items as { title: string; subtitle: string; body: string }[] | undefined) ?? [];
      return <>
        <p className="app-muted">The full text of the Federalist, Anti-Federalist and ratification writings — {items.length} papers, over 249,000 words, now readable here.</p>
        <div className="lib-cards">{items.filter((x) => !q || x.title.toLowerCase().includes(q.toLowerCase())).map((x, i) => (
          <details key={i} className="lib-item"><summary><b>{x.title}</b> <span className="app-muted">{x.subtitle}</span></summary>
            <div className="lib-prose">{x.body.split("\n\n").map((p, j) => <p key={j}>{p}</p>)}</div></details>))}</div>
      </>;
    }

    if (tab === "harvard") return <>
      <p className="app-muted">A fifteen-minute reading for every day of the year from the Harvard Classics. The full public-domain text is loaded one day at a time.</p>
      <div className="app-toolbar"><label>Date <input type="date" value={harvardDate} onChange={(e) => setHarvardDate(e.target.value)} /></label></div>
      <div className="lib-prose lib-paper">{harvard?.text.split("\n\n").map((p, i) => <p key={i}>{p}</p>) ?? <p className="app-muted">Loading…</p>}</div>
    </>;
    return null;
  };

  return (
    <section className="app-section" aria-labelledby="lib-title">
      <p className="eyebrow">LIBRARY · FULL-TEXT COLLECTIONS</p>
      <h2 id="lib-title" className="app-heading">The rest of the corpus, readable here</h2>
      <p className="app-lead">Collections that were in the source data but never surfaced: exam maps, daily reading plans, founding papers, great ideas, phonics, cases, problems and more — all local, all attributed.</p>
      <div className="lib-tabs" role="group" aria-label="Collections">{TABS.map((t) => <button key={t.id} className={tab === t.id ? "chip active" : "chip"} aria-pressed={tab === t.id} onClick={() => { setTab(t.id); setQ(""); }}>{t.label}</button>)}
        <button className={tab === "harvard" ? "chip active" : "chip"} aria-pressed={tab === "harvard"} onClick={() => setTab("harvard")}>Harvard daily</button></div>
      {tab !== "bible" && tab !== "harvard" && <input aria-label="Search collection" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this collection…" style={{ width: "100%", margin: "var(--sp-3) 0" }} />}
      <div className="app-panel">{render()}</div>
      <p className="app-attribution">Adapted from <a href="https://teddyrookbook.com/" target="_blank" rel="noreferrer">Teddy Rook Book</a> · CC BY-NC 4.0 · official competition problems are linked, not reproduced</p>
    </section>
  );
}
