import { useState } from "react";
import { exportSaveCode, getGraph, importSaveCode, progressSummary } from "../state/progress";
import { dueTopics, getSettings, lastWeeks, mistakeTopics, overview, setFreezes, setRetention, streak, type Retention } from "../state/learning";
import { t, useT } from "../i18n";
import ReviewSession from "./ReviewSession";
import { plural } from "../utils/plural";

export default function ProgressPanel({ ladder = "physics", onGo }: { ladder?: string; onGo: (slug: string, opts?: { ladder?: string; course?: string }) => void }) {
  useT();
  const s = progressSummary();
  const learn = overview();
  const settings = getSettings();
  const weeks = lastWeeks();
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const due = (() => {
    const E = (window as unknown as { MathLadder?: { engine?: { due: () => string[] } } }).MathLadder?.engine;
    return E?.due() ?? [];
  })();

  const goTopic = (id: string) => {
    const topic = getGraph().topics.find((x) => x.id === id);
    if (topic) onGo(topic.slug ?? id.split(".").slice(1).join("."), { ladder: topic.ladder, course: topic.course });
  };
  const label = (id: string) => getGraph().topics.find((x) => x.id === id)?.title ?? id.split(".").slice(1).join(".");
  const max = Math.max(1, ...weeks);

  return (
    <section className="progress-panel" aria-label="Your progress">
      <div className="progress-stats">
        <div><b>{s.xp}</b><span>{t("progress.totalXp")}</span></div>
        <div><b>{streak()}</b><span>{streak() === 1 ? t("progress.dayStreakOne") : t("progress.streak")}</span></div>
        <div><b>{s.due + learn.due}</b><span>{t("progress.due")}</span></div>
        <div><b>{learn.known}</b><span>topics mastered</span></div>
      </div>

      <details className="learn-insight">
        <summary>How your learning is tracked — and why you'll see things again</summary>
        <p style={{ color: "var(--ink-2)", maxWidth: 680 }}>
          Every answer updates a private estimate of how well you know that topic (a Bayesian mastery score) and how
          stable that memory is. You'll see a topic again just before you're likely to forget it — retrieval practice
          is far stronger than rereading. The intervals are a sensible default, not a scientific law: the gap grows
          with how long you want to remember it.
        </p>
        <div className="app-toolbar">
          <label>Target memory strength
            <select value={settings.retention} onChange={(e) => setRetention(Number(e.target.value) as Retention)}>
              <option value={0.85}>Lighter workload (85%)</option>
              <option value={0.9}>Balanced (90%)</option>
              <option value={0.95}>Stronger memory (95%)</option>
            </select></label>
          <label>Free pause days <input type="number" min={0} max={7} value={settings.freezes} onChange={(e) => setFreezes(Number(e.target.value))} /></label>
        </div>
        <p className="app-muted">A missed day uses a free pause instead of resetting your streak. {plural(learn.attempts, "answer")} recorded here.</p>
      </details>

      <div className="sparkline" aria-label={`Answers per day over the last ${weeks.length} days`}>
        {weeks.map((n, i) => <span key={i} style={{ height: `${Math.max(3, (n / max) * 32)}px` }} title={plural(n, "answer")} />)}
      </div>

      {mistakeTopics().length > 0 && (
        <div className="review-queue mistakes">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-2)", margin: "0 0 var(--sp-2)" }}>Mistakes practice</h2>
          <p className="app-muted">Interleaved practice on topics you've missed — drawn from your own errors.</p>
          <ul>{mistakeTopics().map((id) => <li key={id}>
            <button className="btn-link" onClick={() => goTopic(id)}>{label(id)}</button>
          </li>)}</ul>
        </div>
      )}

      {dueTopics().length > 0 && !mistakeTopics().length && (
        <div className="review-queue">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-2)", margin: "0 0 var(--sp-2)" }}>Due for a quick retrieval check</h2>
          <ul>{dueTopics().map((id) => <li key={id}><button className="btn-link" onClick={() => goTopic(id)}>{label(id)}</button></li>)}</ul>
        </div>
      )}

      {due.length > 0 && (
        <div className="review-queue">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-2)", margin: "0 0 var(--sp-2)" }}>{t("progress.reviewDue")}</h2>
          <button className="btn-primary" onClick={() => setReviewing(true)}>Start review →</button>
          <ul>
            {due.slice(0, 6).map((id) => (
              <li key={id}>
                <button className="btn-link" onClick={() => goTopic(id)}>{label(id)}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.next?.id && (
        <p className="next-up">{t("progress.nextUp")} <button className="btn-link" onClick={() => goTopic(s.next!.id!)}>{label(s.next.id)}</button> ({s.next.reason})</p>
      )}

      <details className="save-code">
        <summary>{t("progress.saveCode")}</summary>
        <p>{t("progress.saveNote")}</p>
        <button className="btn" onClick={async () => { setCode(await exportSaveCode()); setNotice(t("progress.exported")); }}>{t("progress.export")}</button>
        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("progress.placeholder")} aria-label={t("progress.saveCode")} />
          <button className="btn" onClick={async () => { const r = await importSaveCode(code); setNotice(r.ok ? t("progress.loaded") : (r.msg ?? t("progress.bad"))); }}>{t("progress.import")}</button>
        </div>
        {notice && <p aria-live="polite" style={{ color: "var(--ink-3)" }}>{notice}</p>}
      </details>
      {reviewing && <ReviewSession ladder={ladder} onClose={() => setReviewing(false)} />}
    </section>
  );
}
