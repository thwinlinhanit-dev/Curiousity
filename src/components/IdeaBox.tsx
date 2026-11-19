import { useState } from "react";
import { t, useT } from "../i18n";

const KEY = "pf-ideas-v1";
const roles = ["Developer", "Teacher", "Student", "Scientist", "Designer", "Curious"];

export default function IdeaBox() {
  useT();
  const [role, setRole] = useState("Teacher");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const endpoint = (import.meta.env.VITE_IDEA_ENDPOINT as string | undefined)
    || (() => { try { return localStorage.getItem("pf-idea-endpoint") || ""; } catch { return ""; } })();
  const send = async () => {
    if (!text.trim()) return;
    const idea = { role, text: text.trim(), at: new Date().toISOString() };
    if (endpoint) {
      try { await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(idea) }); }
      catch { /* fall through to local storage */ }
    }
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "[]");
      all.push(idea);
      localStorage.setItem(KEY, JSON.stringify(all.slice(-100)));
    } catch { /* still thank the learner */ }
    setText(""); setSent(true);
  };

  return (
    <section className="idea-box" aria-label={t("idea.title")}>
      <h2>{t("idea.title")}</h2>
      <label>{t("idea.role")}
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <label className="sr-only" htmlFor="idea-text">{t("idea.placeholder")}</label>
      <textarea id="idea-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("idea.placeholder")} rows={3} />
      <button className="btn-primary" onClick={send}>{t("idea.send")}</button>
      {sent && <p aria-live="polite" style={{ color: "var(--mastered)" }}>{t("idea.thanks")}</p>}
      <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>{t("idea.note")}</p>
    </section>
  );
}
