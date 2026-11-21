import { useEffect, useMemo, useState } from "react";

type Entry = Record<string, string>;
const KEY = "trb-es-reviewed-v1";

export default function Translate() {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<Entry>({});
  const [reviewed, setReviewed] = useState<Record<string, Entry>>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/i18n/es-topics.json`).then((r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, Entry>) => { setEntries(d); setSelected(Object.keys(d)[0] ?? ""); }).catch(() => undefined);
  }, []);
  useEffect(() => { if (selected) setDraft(reviewed[selected] ?? entries[selected] ?? {}); }, [selected, entries, reviewed]);
  const pct = useMemo(() => {
    const total = Object.keys(entries).length || 1;
    return Math.round((Object.keys(reviewed).length / total) * 100);
  }, [entries, reviewed]);

  const approve = () => {
    const next = { ...reviewed, [selected]: draft };
    setReviewed(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private */ }
    setNotice(`“${selected}” approved. ${Object.keys(next).length} lessons reviewed.`);
  };
  const exportReviewed = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(reviewed, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "curiousity-es-reviewed.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section className="app-section" aria-labelledby="translate-title">
    <p className="eyebrow">TRANSLATION · HUMAN REVIEW</p>
    <h2 id="translate-title" className="app-heading">Review the Spanish lessons</h2>
    <p className="app-lead">Machine translation is a starting point, never a finished language. Review each lesson here; approved versions are saved in this browser and can be exported for a maintainer to merge. A locale is hidden below 80% review coverage.</p>

    <div className="app-panel">
      <p><b>Ready for review: {Object.keys(entries).length}</b> · <b>Approved: {Object.keys(reviewed).length}</b> · <b>{pct}%</b></p>
      <p className="app-muted">{pct >= 80 ? "Above the 80% gate — this locale can be shown to learners once merged." : "Below the 80% gate — this locale stays hidden in the app."}</p>
      <div className="app-toolbar"><button className="btn" onClick={exportReviewed} disabled={!Object.keys(reviewed).length}>Export reviewed JSON</button>
        {notice && <span className="app-feedback ok" role="status">{notice}</span>}</div>
    </div>

    <div className="trans-layout">
      <ul className="trans-list">{Object.keys(entries).map((k) => <li key={k}>
        <button className={selected === k ? "btn btn-primary" : "btn"} onClick={() => setSelected(k)}>{reviewed[k] ? "✓ " : ""}{k}</button>
      </li>)}</ul>
      <div className="app-panel trans-edit">
        <span className="app-kicker">{selected || "Choose a lesson"}</span>
        {Object.keys(draft).map((field) => <label key={field} className="trans-field">
          <span>{field}</span>
          <textarea value={draft[field] ?? ""} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} />
        </label>)}
        {selected && <button className="btn-primary" onClick={approve}>Approve this lesson</button>}
      </div>
    </div>
    <p className="app-attribution">Machine-translated drafts are covered by the corpus licence. Reviewed translations will be credited to their reviewers.</p>
  </section>;
}
