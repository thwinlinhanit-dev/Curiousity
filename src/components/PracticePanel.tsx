import { useEffect, useRef, useState } from "react";
import { useFigureStore } from "../state/figureStore";
import { loadLadder } from "../viz/loadViz";
import { t, useT } from "../i18n";

type AnswerSpec = { t: string; v?: unknown; rtol?: number; unit?: string; [k: string]: unknown };
type Problem = {
  id: string; seed: number; level: number;
  q: string; a: AnswerSpec; steps?: string[]; hint?: string; unit?: string;
  viz?: { name: string; opts?: Record<string, unknown> };
  choices?: { text: string; correct?: boolean }[];
};
type CheckResult = { ok: boolean; msg?: string; invalid?: boolean; parts?: CheckResult[] };

type ML = {
  makeProblem: (id: string, seed: number, ctx: { level: number }) => Problem;
  check: (spec: AnswerSpec, answer: string, ctx?: { q?: string; unit?: string }) => CheckResult;
  answerText: (spec: AnswerSpec) => string;
  answerShow: (spec: AnswerSpec) => string;
  typeset: (root: HTMLElement) => void;
  viz?: { mount: (el: HTMLElement) => void };
};

const ml = (): ML | null => (window as unknown as { MathLadder?: ML }).MathLadder ?? null;

type Fallback = { kind: string; q: string; a: string; steps: string[]; title?: string };

export default function PracticePanel({ topicId, ladder = "physics", fallback, onAnswer }: { topicId: string; ladder?: string; fallback?: Fallback | null; onAnswer?: (ok: boolean) => void }) {
  useT();
  const { patch } = useFigureStore();
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [problem, setProblem] = useState<Problem | null>(null);
  const [ready, setReady] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  useEffect(() => { loadLadder(ladder).then(() => setReady(true)).catch(() => setReady(true)); }, [ladder]);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [shownSteps, setShownSteps] = useState(0);
  const qRef = useRef<HTMLDivElement>(null);
  const solRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const vizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const M = ml();
    if (!M) return;
    try {
      const p = M.makeProblem(topicId, seed, { level });
      setProblem(p); setUsingFallback(false); setAnswer(""); setResult(null); setShownSteps(0);
    } catch {
      if (fallback) {
        setProblem({ q: fallback.q, a: { t: "text", v: fallback.a }, steps: fallback.steps } as unknown as Problem);
        setUsingFallback(true); setAnswer(""); setResult(null); setShownSteps(0);
      } else { setProblem(null); setUsingFallback(false); }
    }
  }, [topicId, seed, level, ready, fallback]);

  useEffect(() => {
    const M = ml();
    if (M?.typeset && qRef.current) M.typeset(qRef.current);
    if (M?.typeset && solRef.current) M.typeset(solRef.current);
    if (M?.typeset && resultRef.current) M.typeset(resultRef.current);
    if (problem?.viz && M?.viz && vizRef.current) {
      vizRef.current.innerHTML = "";
      const el = document.createElement("div");
      el.className = "ml-viz";
      el.dataset.viz = problem.viz.name;
      el.dataset.opts = JSON.stringify({ ...(problem.viz.opts ?? {}), quiet: true, compact: true });
      vizRef.current.appendChild(el);
      M.viz.mount(el);
    }
  }, [problem, shownSteps, result]);

  const check = () => {
    const M = ml();
    if (!problem || !answer.trim()) return;
    if (usingFallback) {
      setResult({ ok: true, msg: "Self-check — compare what you wrote with the worked solution below." });
      setShownSteps(problem.steps?.length ?? 0);
      return;
    }
    if (!M) return;
    const r = M.check(problem.a, answer, { q: problem.q, unit: problem.unit });
    setResult(r);
    onAnswer?.(r.ok);
    if (r.ok) {
      setShownSteps(problem.steps?.length ?? 0);
      // spatial feedback: draw the learner's value on the figure when numeric
      const num = Number(answer.replace(/[^\d.\-]/g, ""));
      const expected = Number(M.answerText(problem.a).replace(/[^\d.\-]/g, ""));
      if (Number.isFinite(num) && Number.isFinite(expected)) {
        patch({ op: "showFeedback", feedback: { kind: "position", learner: num, expected, label: "your answer", unit: problem.unit } });
      }
    }
  };

  const next = () => setSeed(Math.floor(Math.random() * 1e6));

  return (
    <section className="practice" aria-label="Practice">
      <div className="practice-head">
        <h2>{t("lesson.practice")}</h2>
        {usingFallback && <span className="status-chip status-under-way">self-check from worked example</span>}
        <div className="segmented" role="group" aria-label="Difficulty">
          {[1, 2, 3].map((n) => <button key={n} className={level === n ? "active" : ""} aria-pressed={level === n} onClick={() => setLevel(n)}>L{n}</button>)}
        </div>
      </div>
      {!ready ? <p style={{ color: "var(--ink-3)" }}>Loading practice…</p>
        : !problem ? <p style={{ color: "var(--ink-3)" }}>{t("lesson.noGenerator")}</p> : (
        <>
          <div ref={qRef} className="practice-q" dangerouslySetInnerHTML={{ __html: problem.q }} />
          {problem.viz && <div ref={vizRef} className="practice-viz" />}
          {Array.isArray(problem.choices) && problem.choices.length ? (
            <div className="choice-grid">
              {(problem.choices as unknown[]).map((raw, i) => {
                const c = raw as { text?: string; value?: string; label?: string } | string;
                const label = typeof c === "string" ? c : (c.text ?? c.value ?? c.label ?? "");
                if (!label) return null;
                return <button key={i} className="chip" onClick={() => setAnswer(label)} aria-pressed={answer === label}>{label}</button>;
              })}
            </div>
          ) : null}
          <div className="practice-answer">
            <input value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} placeholder={problem.unit ? `${t("lesson.answer")} (${problem.unit})` : t("lesson.answer")} aria-label={t("lesson.answer")} />
            <button className="btn-primary" onClick={check}>{t("lesson.check")}</button>
            <button className="btn" onClick={next}>{t("lesson.another")}</button>
          </div>
          {result && (
            <div className={`practice-result ${result.ok ? "ok" : "no"}`} aria-live="polite" ref={resultRef}>
              <p><strong>{result.ok ? t("lesson.correct") : result.invalid ? t("lesson.cantRead") : t("lesson.notQuite")}</strong> {result.msg}</p>
              {!result.ok && problem.hint && <p style={{ color: "var(--ink-3)" }}>{t("lesson.hint")} <span dangerouslySetInnerHTML={{ __html: problem.hint }} /></p>}
              {!result.ok && (problem.steps?.length ?? 0) > 0 && shownSteps === 0 && (
                <button className="btn-link" onClick={() => setShownSteps(1)}>{t("lesson.showWorking")}</button>
              )}
              {shownSteps > 0 && (
                <div className="working-reveal">
                  <ol>
                    {problem.steps!.slice(0, shownSteps).map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
                  </ol>
                  <div ref={solRef} dangerouslySetInnerHTML={{ __html: `<p>Correct answer: ${ml()?.answerShow(problem.a) ?? ""}</p>` }} />
                  {shownSteps < problem.steps!.length && <button className="btn" onClick={() => setShownSteps((n) => n + 1)}>Next step ›</button>}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
