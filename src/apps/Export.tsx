import { useEffect, useState } from "react";
import { plural } from "../utils/plural";

type PackEntry = { ladder: string; course: string; topics: number };
type Topic = { slug: string; title: string; id: string; lesson?: { blocks?: { t: string; html?: string }[] } };

const KEY_PREFIXES = ["trb-", "pf-"];
const collect = () => {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (KEY_PREFIXES.some((p) => k.startsWith(p))) { try { out[k] = JSON.parse(localStorage.getItem(k)!); } catch { out[k] = localStorage.getItem(k); } }
  }
  return out;
};
const download = (name: string, data: unknown) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function Export() {
  const [packs, setPacks] = useState<PackEntry[]>([]);
  const [course, setCourse] = useState("");
  const [count, setCount] = useState(8);
  const [sheet, setSheet] = useState<{ title: string; questions: { q: string; answer: string }[] } | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/pack/index.json`).then((r) => r.json())
      .then((d: { packs: PackEntry[] }) => setPacks(d.packs ?? [])).catch(() => undefined);
  }, []);

  const makeWorksheet = async () => {
    const [ladder, key] = course.split("/");
    if (!ladder || !key) return;
    const res = await fetch(`${import.meta.env.BASE_URL}content/pack/${ladder}/${key}.json`);
    if (!res.ok) { setNotice("That course pack could not be loaded."); return; }
    const pack = await res.json();
    const topics: Topic[] = Object.values(pack.topics ?? {}) as Topic[];
    const picked = topics.slice(0, count);
    const questions = picked.map((t) => {
      const html = (t.lesson?.blocks ?? []).map((b) => b.html ?? "").join(" ");
      const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const q = (text.match(/[^.]+\?/) ?? [text.slice(0, 160)])[0];
      return { q: `${t.title}: ${q}`, answer: text.slice(0, 200) };
    });
    setSheet({ title: `${ladder} · ${key} worksheet`, questions });
  };

  return <section className="app-section" aria-labelledby="export-title">
    <p className="eyebrow">EXPORT · PRINT · OWN YOUR DATA</p>
    <h2 id="export-title" className="app-heading">Take your work with you</h2>
    <p className="app-lead">Progress never leaves this device unless you export it. Download a portable JSON backup, take a whole course pack, or print a worksheet with an answer key for the classroom.</p>

    <div className="app-panel">
      <h3 style={{ marginTop: 0 }}>Progress and backups</h3>
      <div className="app-toolbar">
        <button className="btn-primary" onClick={() => { download("curiousity-progress.json", { exported: new Date().toISOString(), data: collect() }); setNotice("Progress downloaded."); }}>Download progress JSON</button>
        <label className="btn">Restore JSON<input type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(String(r.result)); for (const [k, v] of Object.entries(d.data ?? {})) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); setNotice("Backup restored. Reload to see it."); } catch { setNotice("That file could not be read."); } }; r.readAsText(f);
        }} /></label>
        <span className="app-muted" role="status">{notice}</span>
      </div>
    </div>

    <div className="app-panel">
      <h3 style={{ marginTop: 0 }}>Course export</h3>
      <div className="app-toolbar">
        <label>Course <select value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">Choose a course…</option>
          {packs.map((p) => <option key={`${p.ladder}/${p.course}`} value={`${p.ladder}/${p.course}`}>{p.ladder} · {p.course} ({plural(p.topics, "topic")})</option>)}
        </select></label>
        <button className="btn" disabled={!course} onClick={async () => {
          const [ladder, key] = course.split("/");
          const r = await fetch(`${import.meta.env.BASE_URL}content/pack/${ladder}/${key}.json`);
          download(`${ladder}-${key}-pack.json`, await r.json());
        }}>Download course pack</button>
      </div>
    </div>

    <div className="app-panel">
      <h3 style={{ marginTop: 0 }}>Printable worksheet</h3>
      <p className="app-muted">A worksheet with space for working and a separate answer-key page.</p>
      <div className="app-toolbar">
        <label>Course <select value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">Choose a course…</option>
          {packs.map((p) => <option key={`${p.ladder}/${p.course}`} value={`${p.ladder}/${p.course}`}>{p.ladder} · {p.course}</option>)}
        </select></label>
        <label>Questions <input type="number" min={2} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
        <button className="btn-primary" disabled={!course} onClick={makeWorksheet}>Make worksheet</button>
        {sheet && <button className="btn" onClick={() => window.print()}>Print worksheet</button>}
      </div>
      {sheet && <div className="worksheet">
        <h2>{sheet.title}</h2>
        <ol>{sheet.questions.map((q, i) => <li key={i}><p>{q.q}</p><div className="ws-space" /></li>)}</ol>
        <div className="ws-key"><h2>Answer key</h2><ol>{sheet.questions.map((q, i) => <li key={i}>{q.answer}</li>)}</ol></div>
      </div>}
    </div>
    <p className="app-attribution">Your data stays yours — export any time. No account, no cloud sync.</p>
  </section>;
}
