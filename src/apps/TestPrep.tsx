import { useEffect, useMemo, useState } from "react";
import { loadLadder } from "../viz/loadViz";
import { renderMath, textOnly } from "../utils/richtext";

type AnswerSpec = { t: string; v?: unknown; [k: string]: unknown };
type Problem = { id: string; q: string; a: AnswerSpec; steps?: string[]; hint?: string; unit?: string };
type ML = {
  genIds: () => string[];
  hasGen: (id: string) => boolean;
  makeProblem: (id: string, seed: number, ctx: { level: number }) => Problem;
  check: (spec: AnswerSpec, answer: string, ctx?: { q?: string; unit?: string }) => { ok: boolean; msg?: string };
  answerText: (spec: AnswerSpec) => string;
};
type Topic = { id: string; slug?: string; title: string; course: string; ladder: string };
type Graph = { topics: Topic[] };

type Question = { id: string; problem: Problem; ok: boolean | null; given: string };
type TestDef = { key: string; name: string; short: string; count: number; minutes: number; note: string };

const TESTS: TestDef[] = [
  { key: "sat", name: "SAT Math", short: "SAT", count: 44, minutes: 70, note: "Two adaptive modules, calculator allowed, multiple choice and typed answers." },
  { key: "act", name: "ACT Math", short: "ACT", count: 45, minutes: 50, note: "45 questions on the maths of high school, from percents to trigonometry." },
  { key: "clt", name: "CLT Quantitative", short: "CLT", count: 34, minutes: 50, note: "Quantitative reasoning in the Classic Learning Test's own format." },
];
const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export default function TestPrep() {
  const [tkey, setTkey] = useState("sat");
  const [quick, setQuick] = useState(true);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [ready, setReady] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/graph.json`).then((r) => r.json()).then(setGraph).catch(() => undefined);
    loadLadder("math").then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  const test = TESTS.find((t) => t.key === tkey)!;
  const count = quick ? 10 : test.count;
  const minutes = quick ? 10 : test.minutes;
  const ml = () => (window as unknown as { MathLadder?: ML }).MathLadder ?? null;

  const start = () => {
    const M = ml();
    if (!M || !graph) return;
    const ids = M.genIds().filter((id) => graph.topics.some((t) => t.id === id && t.ladder === "math"));
    const pool = [...new Set(ids)].sort(() => Math.random() - 0.5).slice(0, count);
    const qs: Question[] = [];
    for (const id of pool) {
      try { qs.push({ id, problem: M.makeProblem(id, Math.floor(Math.random() * 1e6), { level: quick ? 1 : 2 }), ok: null, given: "" }); }
      catch { /* skip a generator that fails for this seed */ }
    }
    setQuestions(qs); setIdx(0); setAnswer(""); setSeconds(minutes * 60);
    setStarted(true); setDone(false);
  };

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [started, done]);
  useEffect(() => { if (started && seconds === 0 && !done) setDone(true); }, [seconds, started, done]);

  const submit = () => {
    if (!answer.trim()) return;
    const M = ml(); const q = questions[idx]; if (!M || !q) return;
    const ok = M.check(q.problem.a, answer, { q: q.problem.q, unit: q.problem.unit }).ok;
    const next = [...questions]; next[idx] = { ...q, ok, given: answer }; setQuestions(next);
    setAnswer("");
    if (idx + 1 >= questions.length) setDone(true); else setIdx(idx + 1);
  };

  const score = useMemo(() => questions.filter((q) => q.ok).length, [questions]);
  const q = questions[idx];

  return (
    <section className="app-section" aria-labelledby="test-title">
      <p className="eyebrow">TEST PREP · TIMED PRACTICE</p>
      <h2 id="test-title" className="app-heading">Calm practice for the math on the big tests</h2>
      <p className="app-lead">Real problems from the Math Ladder, set out in each test's own format and pace. Every miss comes with its steps and a link to the lesson behind it. Free, with no sign-up.</p>

      {!started && (
        <div className="app-panel">
          <div className="app-toolbar">
            {TESTS.map((t) => <button key={t.key} className={tkey === t.key ? "chip active" : "chip"} aria-pressed={tkey === t.key} onClick={() => setTkey(t.key)}>{t.short}</button>)}
            <button className={!quick ? "chip active" : "chip"} aria-pressed={!quick} onClick={() => setQuick(false)}>Full test ({test.count} questions, {test.minutes} min)</button>
            <button className={quick ? "chip active" : "chip"} aria-pressed={quick} onClick={() => setQuick(true)}>Quick practice (10 questions, 10 min)</button>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)" }}>{test.name}</h3>
          <p style={{ color: "var(--ink-2)" }}>{test.note}</p>
          <p className="app-muted">{ready ? `${count} questions will be drawn from the Math Ladder generators.` : "Loading generators…"}</p>
          <button className="btn-primary" onClick={start} disabled={!ready || !graph}>Start practice →</button>
        </div>
      )}

      {started && !done && q && (
        <div className="app-grid-2">
          <div className="app-panel tp-main">
            <div className="tp-head"><span className="app-kicker">{test.short} · QUESTION {idx + 1} / {questions.length}</span>
              <span className="tabular tp-timer" role="timer">{fmt(seconds)}</span></div>
            <div className="practice-q" dangerouslySetInnerHTML={{ __html: renderMath(q.problem.q) }} />
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="tp-answer">
              <label htmlFor="tp-input">Your answer</label>
              <div className="word-input-row"><input id="tp-input" autoComplete="off" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                <button className="btn-primary" type="submit">{idx + 1 === questions.length ? "Finish" : "Check & next"}</button></div>
            </form>
            <p className="app-muted" aria-live="polite">Answers are recorded and shown at the end of the test.</p>
          </div>
          <aside className="app-panel">
            <h3 style={{ marginTop: 0 }}>Progress</h3>
            <div className="tp-progress">{questions.map((qq, i) => <span key={i} className={i === idx ? "cur" : qq.ok === true ? "ok" : qq.ok === false ? "no" : ""} aria-label={`Question ${i + 1}: ${qq.ok === null ? "not answered" : qq.ok ? "correct" : "incorrect"}`}>{i + 1}</span>)}</div>
            <p className="app-muted">{questions.filter((x) => x.ok !== null).length} answered · {questions.filter((x) => x.ok === null).length} left</p>
            <button className="btn" onClick={() => setDone(true)}>End test early</button>
          </aside>
        </div>
      )}

      {done && (
        <div className="app-panel">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", marginTop: 0 }}>{score} / {questions.length} correct</h3>
          <p className="app-muted">{Math.round((score / Math.max(1, questions.length)) * 100)}% · {questions.some((qq) => qq.ok === null) ? "ended early" : seconds > 0 ? `${fmt(seconds)} left` : "time up"}</p>
          <ol className="tp-review">
            {questions.map((qq, i) => {
              const M = ml(); const topic = graph?.topics.find((t) => t.id === qq.id);
              const href = topic ? `?s=${encodeURIComponent(topic.ladder)}&c=${encodeURIComponent(topic.course)}&t=${encodeURIComponent(topic.slug ?? topic.id.split(".").slice(1).join("."))}` : "#";
              return (
                <li key={i}>
                  <p><span dangerouslySetInnerHTML={{ __html: renderMath(qq.problem.q) }} /></p>
                  <p className={qq.ok ? "app-feedback ok" : "app-feedback no"}>
                    {qq.ok ? "✓ Correct" : <>Your answer: {qq.given || "—"}. Expected: <span dangerouslySetInnerHTML={{ __html: renderMath(M ? M.answerText(qq.problem.a) : "—") }} /></>}
                  </p>
                  {qq.problem.steps?.length ? <ol className="app-muted">{qq.problem.steps.map((s, j) => <li key={j} dangerouslySetInnerHTML={{ __html: renderMath(s) }} />)}</ol> : null}
                  <p className="app-muted">{textOnly(topic?.title ?? qq.id)} · <a href={href}>Open the lesson →</a></p>
                </li>
              );
            })}
          </ol>
          <button className="btn-primary" onClick={start}>Try another set</button>
        </div>
      )}

      <p className="app-attribution">
        Test formats described on <a href="https://teddyrookbook.com/test-prep/" target="_blank" rel="noreferrer">Teddy Rook Book — Test Prep</a> · problems from the Math Ladder · CC BY-NC 4.0
      </p>
    </section>
  );
}
