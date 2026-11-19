import { useState } from "react";
import { exportSaveCode, importSaveCode, progressSummary } from "../state/progress";
import { t, useT } from "../i18n";
import ReviewSession from "./ReviewSession";

export default function ProgressPanel({ ladder = "physics", onGo }: { ladder?: string; onGo: (slug: string, opts?: { ladder?: string; course?: string }) => void }) {
  useT();
  const s = progressSummary();
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const due = (() => {
    const E = (window as unknown as { MathLadder?: { engine?: { due: () => string[] } } }).MathLadder?.engine;
    return E?.due() ?? [];
  })();

  return (
    <section className="progress-panel" aria-label="Your progress">
      <div className="progress-stats">
        <div><b>{s.xp}</b><span>{t("progress.totalXp")}</span></div>
        <div><b>{s.streak}</b><span>{t("progress.streak")}</span></div>
        <div><b>{s.due}</b><span>{t("progress.due")}</span></div>
        <div><b>{s.today}/{s.goal}</b><span>{t("progress.goal")}</span></div>
      </div>

      {due.length > 0 && (
        <div className="review-queue">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-2)", margin: "0 0 var(--sp-2)" }}>{t("progress.reviewDue")}</h2>
          <button className="btn-primary" onClick={() => setReviewing(true)}>Start review →</button>
          <ul>
            {due.slice(0, 6).map((id) => (
              <li key={id}>
                <button className="btn-link" onClick={() => onGo(id.split(".").slice(1).join("."), { ladder })}>{id.replace("phys1.", "")}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.next?.id && (
        <p className="next-up">{t("progress.nextUp")} <button className="btn-link" onClick={() => onGo(s.next!.id!.split(".").slice(1).join("."), { ladder })}>{s.next.id.replace("phys1.", "")}</button> ({s.next.reason})</p>
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
