import { useEffect, useRef, useState } from "react";
import { getEngine, initProgress } from "../state/progress";
import { loadLadder } from "../viz/loadViz";
import { t, useT } from "../i18n";
import { renderMath } from "../utils/richtext";
import { plural } from "../utils/plural";

type Item = { id: string; k: number };
type Problem = { q: string; a: unknown; unit?: string; steps?: string[] };
type ML = {
  makeProblem: (id: string, seed: number, ctx: { level: number }) => Problem;
  check: (spec: unknown, answer: string, ctx?: { q?: string; unit?: string }) => { ok: boolean; msg?: string; invalid?: boolean };
  answerShow: (spec: unknown) => string;
  typeset: (root: HTMLElement) => void;
};

export default function ReviewSession({ ladder = "physics", onClose }: { ladder?: string; onClose: () => void }) {
  useT();
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg?: string; done?: boolean; due?: number } | null>(null);
  const qRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (!d.open) d.showModal();
    inputRef.current?.focus();
    return () => { if (d.open) d.close(); };
  }, []);

  useEffect(() => {
    let alive = true;
    loadLadder(ladder).then(() => {
      const E = initProgress(ladder);
      if (!alive || !E) return;
      const list = E.reviewSet();
      setItems(list);
      setIdx(0);
    }).catch(() => {});
    return () => { alive = false; };
  }, [ladder]);

  useEffect(() => {
    const E = getEngine();
    const item = items[idx];
    const ML = (window as unknown as { MathLadder?: ML }).MathLadder;
    if (!item || !E || !ML) return;
    const seed = 9000 + idx * 71 + item.k;
    try { setProblem(ML.makeProblem(item.id, seed, { level: 2 })); setAnswer(""); setResult(null); }
    catch { setProblem(null); }
  }, [items, idx]);

  useEffect(() => {
    const ML = (window as unknown as { MathLadder?: ML }).MathLadder;
    if (ML?.typeset && qRef.current) ML.typeset(qRef.current);
  }, [problem]);

  const check = () => {
    const E = getEngine();
    const ML = (window as unknown as { MathLadder?: ML }).MathLadder;
    if (!E || !ML || !problem || !items[idx] || !answer.trim()) return;
    const ok = ML.check(problem.a, answer, { q: problem.q, unit: problem.unit }).ok;
    const r = E.reviewAnswer(items[idx].id, ok);
    setResult({ ok, done: r.done, due: r.due });
  };

  const item = items[idx];
  const done = idx >= items.length;

  return (
    <dialog ref={dialogRef} className="review-session" aria-label={t("progress.reviewDue")} onClose={onClose}>
      <div className="review-head">
        <h2>{t("progress.reviewDue")}</h2>
        <button className="btn" aria-label="Close review" onClick={() => dialogRef.current?.close()}>✕</button>
      </div>
      {items.length === 0 ? <p style={{ color: "var(--ink-3)" }}>No reviews are due right now.</p>
        : done ? <p aria-live="polite" style={{ color: "var(--mastered)" }}>Review complete. {plural(items.length, "topic")} practiced.</p>
          : (
            <>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-0)", color: "var(--ink-3)" }}>
                {item.id} · {idx + 1}/{items.length} · answer {item.k + 1} of 2
              </p>
              {problem ? <div ref={qRef} className="practice-q" dangerouslySetInnerHTML={{ __html: renderMath(problem.q) }} /> : <p>Loading problem…</p>}
              <div className="practice-answer">
                <input ref={inputRef} value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} aria-label={t("lesson.answer")} placeholder={t("lesson.answer")} />
                <button className="btn-primary" onClick={check}>{t("lesson.check")}</button>
              </div>
              {result && (
                <p aria-live="polite" className={result.ok ? "feedback-ok" : "feedback-no"}>
                  {result.ok ? t("lesson.correct") : t("lesson.notQuite")}
                  {result.done ? ` · next review on day ${result.due}` : ""}
                </p>
              )}
              <button className="btn" onClick={() => setIdx((n) => n + 1)} disabled={!result}>Next ›</button>
            </>
          )}
    </dialog>
  );
}
