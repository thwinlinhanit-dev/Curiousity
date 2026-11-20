import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { VizOpts } from "../figures/motionModel";
import { createMotionModel } from "../figures/motionModel";
import MotionFigure from "../figures/MotionFigure";
import PacingBar from "../components/PacingBar";
import LayerToggles from "../components/LayerToggles";
import NarrationBar from "../components/NarrationBar";
import PracticePanel from "../components/PracticePanel";
import MarblePanel from "../components/MarblePanel";
import MusicLab from "../components/MusicLab";
import MusicChapter from "../components/MusicChapter";
import LibraryStrip from "../components/LibraryStrip";
import WorkingReveal from "../components/WorkingReveal";
import WaveFigure from "../figures/WaveFigure";
import CircuitFigure from "../figures/CircuitFigure";
import RepoViz from "../components/RepoViz";
import { useFigureStore } from "../state/figureStore";
import { recordAnswer, setActiveLadder, topicStatus, getGraph } from "../state/progress";
import { loadCoursePack } from "../state/packs";
import { t, useT } from "../i18n";
import { renderMath } from "../utils/richtext";
import SiteHeader from "../components/SiteHeader";
import OrbitMode from "../figures/OrbitMode";
import FieldFigure from "../figures/FieldFigure";
import OpticsFigure from "../figures/OpticsFigure";
import EnergyFigure from "../figures/EnergyFigure";
import CollisionFigure from "../figures/CollisionFigure";
import FunctionFigure from "../figures/FunctionFigure";
import ParticleFigure from "../figures/ParticleFigure";
import DataFigure from "../figures/DataFigure";
import GlobeFigure from "../figures/GlobeFigure";
import LessonFigure from "../figures/LessonFigure";

type Block = { t: string; html?: string; text?: string; name?: string; opts?: VizOpts; cap?: string; title?: string; q?: string; steps?: string[]; a?: string };
type Bundle = {
  id: string; slug: string; ladder: string; course: string; unit: string;
  title: string; short: string; courseTitle: string; unitTitle: string;
  trouble: string; viz: string[]; figureArchetype: string;
  lesson: { blocks: Block[]; sources: { name: string }[] };
  practice?: { kind: string; q: string; a: string; steps: string[]; title?: string } | null;
};
type LessonStep = { block: Block; prompt?: string };

function vizBlockOf(b: Bundle): Block | null {
  const blocks = b.lesson.blocks.filter((x) => x.t === "viz" && x.name);
  if (!blocks.length) return null;
  // Prefer the block with the richest configuration: some topics carry a thin
  // generic scene first and the meaningful interactive kit second.
  const score = (x: Block) => Object.keys(x.opts ?? {}).filter((k) => k !== "task").length;
  return blocks.reduce((best, cur) => (score(cur) > score(best) ? cur : best), blocks[0]);
}

// Capability-based routing: a custom React figure is only chosen when it can
// actually honour the bundle's opts. Everything else goes to the repo's native
// viz kit, which receives the opts verbatim (see RepoViz / MathLadder.viz.mount).
function figureKindOf(name: string | undefined, opts?: Record<string, unknown> | null): "motion" | "wave" | "circuit" | "field" | "optics" | "energy" | "collision" | "function" | "particle" | "data" | "globe" | "music" | "lesson" | "repo" {
  if (!name) return "lesson";
  if (name === "music-player") return "music";
  const mode = String(opts?.mode ?? "");
  if (["ph-motion", "ph-projectile"].includes(name)) return "motion";
  if (name === "ph-wave" && (!mode || ["travel", "pulse", "superpose", "standing-string", "standing-pipe", "beats"].includes(mode))) return "wave";
  if (name === "ph-circuit" && opts?.circuit) return "circuit";
  if (name === "ph-efield" && opts?.charges) return "field";
  if (["ch-particles", "ch-convert", "ch-measure"].includes(name)) return "particle";
  if (["bi-chart", "bi-classify"].includes(name)) return "data";
  if (["es-earth-sun", "es-water", "es-topo"].includes(name)) return "globe";
  return "repo";
}

function vizForTopic(b: Bundle): VizOpts | null {
  const block = vizBlockOf(b);
  if (!block?.opts || figureKindOf(block.name, block.opts) !== "motion") return null;
  const o: VizOpts = { ...block.opts };
  if (block.name === "ph-graph") {
    if (Array.isArray(o.pts) && o.pts.length >= 2) {
      const pts = o.pts as number[][];
      const v0 = (pts[1][1] - pts[0][1]) / Math.max(1e-6, pts[1][0] - pts[0][0]);
      const segments: { dur: number; a: number }[] = [];
      for (let i = 1; i < pts.length; i++) {
        if (pts[i][0] == null || pts[i - 1][0] == null) continue;
        const dur = pts[i][0] - pts[i - 1][0];
        const slope = (pts[i][1] - pts[i - 1][1]) / Math.max(1e-6, dur);
        const prev = i === 1 ? v0 : (pts[i - 1][1] - pts[i - 2][1]) / Math.max(1e-6, pts[i - 1][0] - pts[i - 2][0]);
        segments.push({ dur, a: (slope - prev) / Math.max(1e-6, dur) });
      }
      o.x0 = pts[0][1]; o.v0 = v0; o.segments = segments;
    } else if (typeof o.fn === "string" && o.fn.includes("x")) {
      o.x0 = 1; o.v0 = 6; o.a = -2; o.tmax = 6;
    }
    o.graphs = o.graphs ?? ["x", "v"];
  }
  return o;
}

function buildSteps(blocks: Block[]): LessonStep[] {
  const steps: LessonStep[] = [];
  let prompt: string | undefined;
  for (const b of blocks) {
    if (b.t === "viz") { prompt = (b.opts?.task as string) || undefined; continue; }
    if (["p", "key", "why", "h", "ex", "mistake", "note", "try"].includes(b.t)) {
      // Many bundles end with an empty "try" block — never show a blank step.
      if (strip(b.html ?? b.text ?? b.q ?? "")) {
        steps.push({ block: b, prompt }); prompt = undefined;
      }
    }
  }
  return steps;
}

const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// A static preview server may answer a missing .json with the SPA index.html
// and status 200, so parse before accepting a candidate translation file.
async function loadJson<T = Record<string, string>>(urls: string[]): Promise<T | null> {
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      if (data && typeof data === "object") return data as T;
    } catch { /* try the next candidate */ }
  }
  return null;
}

export default function TopicPage({ slug, ladder, course, onBack }: { slug: string; ladder: string; course: string; onBack: () => void }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [, setTick] = useState(0);
  const [orbit3d, setOrbit3d] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [courseMeta, setCourseMeta] = useState<{ title: string; units: { key: string; title: string }[] } | null>(null);
  const lang = useT();
  const narrativeRef = useRef<HTMLDivElement>(null);
  const { reset, patch, state } = useFigureStore();

  useEffect(() => {
    let alive = true;
    setTranslated(false);
    (async () => {
      // The course pack carries its own lesson bundles: one request covers the
      // topic list and every lesson in it, which is what keeps the site small.
      const pack = await loadCoursePack(ladder, course);
      const fromPack = (pack.topics[slug] ?? null) as Bundle | null;
      const b = fromPack ?? await loadJson<Bundle>([
        `${import.meta.env.BASE_URL}content/${ladder}/topics/${course}/${slug}.json`,
        `${import.meta.env.BASE_URL}content/${ladder}/topics/${slug}.json`,
      ]);
      if (!b || !b.lesson) throw new Error("Topic not found");
      let didTranslate = false;
      if (lang === "es") {
        const all = await loadJson<Record<string, Record<string, string>>>([
          `${import.meta.env.BASE_URL}content/i18n/es-topics.json`,
        ]);
        const tr = all?.[`${ladder}/${slug}`] ?? all?.[slug] ?? null;
        if (tr && Object.keys(tr).length > 0) {
          b.title = tr.title ?? b.title; b.short = tr.short ?? b.short; b.trouble = tr.trouble ?? b.trouble;
          b.lesson.blocks = b.lesson.blocks.map((blk, i) => {
            const out = { ...blk };
            for (const k of ["html", "text", "q", "title", "a", "cap"] as const) {
              const v = tr[`block.${i}.${k}`]; if (v) (out as Record<string, unknown>)[k] = v;
            }
            if (Array.isArray(out.steps)) out.steps = out.steps.map((s, j) => tr[`block.${i}.step.${j}`] ?? s);
            return out;
          });
          didTranslate = true;
        }
      }
      if (!alive) return;
      setActiveLadder(ladder, b.course);
      setTranslated(didTranslate);
      setBundle(b); reset(vizForTopic(b) ?? {}); setAnswer(""); setStepIdx(0);
    })().catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, [slug, ladder, course, reset, attempt, lang]);

  useEffect(() => {
    let alive = true;
    setCourseMeta(null);
    void loadCoursePack(ladder, course).then((p) => {
      // Keys remain as fallback when the pack has no index.
      if (alive) setCourseMeta(p.index);
    });
    return () => { alive = false; };
  }, [ladder, course]);

  const vizBlock = useMemo(() => (bundle ? vizBlockOf(bundle) : null), [bundle]);
  const figureKind = figureKindOf(vizBlock?.name, vizBlock?.opts as Record<string, unknown> | undefined);
  // A few viz names live in the math kit, not the physics kit.
  const vizLadder = useMemo(() => {
    const n = vizBlock?.name ?? "";
    return ["graph", "limit", "derivgraph", "trigwave", "ftc"].includes(n) ? "math" : ladder;
  }, [vizBlock, ladder]);
  const opts = useMemo(() => {
    if (!bundle) return null;
    if (figureKind === "motion") return vizForTopic(bundle);
    if (figureKind === "lesson") return { blocks: bundle.lesson.blocks, title: bundle.title, short: bundle.short } as VizOpts;
    return (vizBlock?.opts as VizOpts | undefined) ?? null;
  }, [bundle, figureKind, vizBlock]);
  const hasFigure = figureKind === "lesson" ? true : !!vizBlock && (figureKind !== "motion" || !!opts);

  const steps = useMemo(() => (bundle ? buildSteps(bundle.lesson.blocks) : []), [bundle]);
  const model = useMemo(() => (opts ? createMotionModel(opts, state.params) : null), [opts, state.params]);
  const duration = Math.round((model?.T ?? 6) * 100) / 100;
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  // The native kit renders opts.task itself; avoid a duplicate prompt on top.
  const stagePrompt = figureKind === "repo"
    ? (vizBlock?.opts?.task ? "" : t("lesson.stageDefault"))
    : (step?.prompt ?? (vizBlock?.opts?.task as string) ?? t("lesson.stageDefault"));
  const langNotice = lang === "es" && !translated
    ? <p className="lang-notice" role="status">{t("lesson.onlyEnglish")}</p>
    : null;

  // Corpus text links point at the upstream site's own paths ("/physics/…"),
  // which this app does not serve, so clicking one landed on a bare "Not found"
  // page and lost the lesson. Send the reader to the app's own search instead.
  const followLessonLink = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("?")) return;
    e.preventDefault();
    const q = (a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    window.location.href = `${window.location.pathname}?q=${encodeURIComponent(q)}`;
  };

  useEffect(() => {
    const w = window as unknown as { MathLadder?: { typeset?: (root: HTMLElement) => void } };
    if (w.MathLadder?.typeset && narrativeRef.current) w.MathLadder.typeset(narrativeRef.current);
    narrativeRef.current?.querySelectorAll("nav").forEach((n, i) => n.setAttribute("aria-label", `Lesson navigation ${i + 1}`));
  }, [bundle, stepIdx]);

  if (error) return (
    <main className="topic-page" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a>
      <header className="topic-header"><SiteHeader /><button className="btn-link" onClick={onBack}>{t("lesson.back")}</button></header>
      <p style={{ color: "var(--danger)" }} role="alert">{t("lesson.loadError")} <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>({error})</span></p>
      <div className="step-nav">
        <button className="btn-primary" onClick={() => { setError(""); setAttempt((n) => n + 1); }}>{t("lesson.tryAgain")}</button>
        <button className="btn" onClick={onBack}>{t("lesson.back")}</button>
      </div>
    </main>
  );
  if (!bundle) return <main className="topic-page" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a><p>Loading…</p></main>;

  if (!hasFigure) {
    return (
      <main className="topic-page" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a>
        <header className="topic-header"><SiteHeader /><button className="btn-link" onClick={onBack}>{t("lesson.back")}</button></header>
        <h1>{bundle.title}</h1>
        {langNotice}
        <p style={{ color: "var(--ink-2)" }}>{bundle.short}</p>
        <p className="trouble">{t("lesson.noFigure")}</p>
        <div className="narrative-blocks" ref={narrativeRef} onClick={followLessonLink}>
          {bundle.lesson.blocks.map((b, i) => b.t === "h" ? <h2 key={i}>{b.text}</h2> : <p key={i} dangerouslySetInnerHTML={{ __html: renderMath(b.html ?? b.text ?? "") }} />)}
        </div>
        <PracticePanel topicId={bundle.id} ladder={ladder} onAnswer={(ok) => { recordAnswer(bundle.id, ok); setTick((n) => n + 1); }} />
        <details className="sources"><summary>{t("lesson.sources")}</summary><ul>{bundle.lesson.sources.map((s, i) => <li key={i}>{s.name}</li>)}</ul></details>
      </main>
    );
  }

  const expectedApex = figureKind === "motion" && opts?.vertical ? (((opts.v0 as number) ?? 14.7) ** 2) / (2 * ((opts.g as number) ?? 9.8)) : null;
  const check = () => {
    const value = Number(answer);
    if (!Number.isFinite(value) || expectedApex == null) return;
    patch({ op: "showFeedback", feedback: { kind: "position", learner: value, expected: expectedApex, label: "apex height", unit: "m" } });
  };

  // Music curriculum chapters are full interactive pages from the lessons
  // engine; they get their own layout instead of the step rail.
  if (bundle.figureArchetype === "chapter") {
    const chapter = bundle.lesson.blocks.find((b) => b.t === "chapter");
    return (
      <main className="topic-page chapter-page" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a>
        <header className="topic-header">
          <SiteHeader />
          <button className="btn-link" onClick={onBack}>{t("lesson.back")}</button>
          <span style={{ color: "var(--ink-3)" }}> / {courseMeta?.title ?? bundle.courseTitle} / {bundle.unitTitle}</span>
        </header>
        <div className="chapter-wrap">
          <p className="eyebrow">{t("lesson.eyebrow")} · {bundle.id}</p>
          <h1>{bundle.title}</h1>
          {(() => { const st = topicStatus(bundle.id); return (
            <div className="mastery-line" aria-live="polite">
              <span className={`status-chip status-${st.passed ? "mastered" : st.status === "due" ? "review-due" : st.status === "learning" ? "under-way" : "not-started"}`}>
                {st.passed ? t("status.mastered") : st.status === "due" ? t("status.reviewDue") : st.status === "learning" ? t("status.underWay") : t("status.notStarted")}
              </span>
            </div>
          ); })()}
          <p style={{ color: "var(--ink-2)", maxWidth: 720 }}>{bundle.short}</p>
          <MusicChapter html={String((chapter as { html?: string } | undefined)?.html ?? "")} />
          <PracticePanel topicId={bundle.id} ladder={ladder} onAnswer={(ok) => { recordAnswer(bundle.id, ok); setTick((n) => n + 1); }} />
          <details className="sources">
            <summary>{t("lesson.sources")}</summary>
            <ul>{bundle.lesson.sources.map((s, i) => <li key={i}>{s.name}</li>)}</ul>
            <p>Content © Teddy Rook · CC BY-NC 4.0 · link back required. Engine MIT.</p>
          </details>
          <LibraryStrip topicId={bundle.id} />
          <MarblePanel topicId={bundle.id} />
        </div>
      </main>
    );
  }

  return (
    <main className="topic-page" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a>
      <header className="topic-header">
        <SiteHeader />
        <button className="btn-link" onClick={onBack}>{t("lesson.back")}</button>
        <span style={{ color: "var(--ink-3)" }}> / {courseMeta?.title ?? bundle.courseTitle ?? bundle.course} / {courseMeta?.units.find((u) => u.key === bundle.unit)?.title ?? bundle.unitTitle ?? bundle.unit}</span>
      </header>

      <div className="topic-grid">
        <aside className="narrative-rail" aria-label="Lesson narrative">
          <p className="eyebrow">{t("lesson.eyebrow")} · {bundle.id}</p>
          <h1>{bundle.title}</h1>
          {langNotice}
          {(() => { const st = topicStatus(bundle.id); return (
            <div className="mastery-line" aria-live="polite">
              <span className={`status-chip status-${st.passed ? "mastered" : st.status === "due" ? "review-due" : st.status === "learning" ? "under-way" : "not-started"}`}>
                {st.passed ? t("status.mastered") : st.status === "due" ? t("status.reviewDue") : st.status === "learning" ? t("status.underWay") : t("status.notStarted")}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-0)", color: "var(--ink-3)" }}>
                {t("lesson.correctP")} {st.p}/3 · {t("lesson.streak2")} {Math.min(st.st, 2)}/2 · {t("lesson.reviewSchedule")}
              </span>
            </div>
          ); })()}
          <p style={{ color: "var(--ink-2)" }}>{bundle.short}</p>
          {bundle.trouble && <p className="trouble"><strong>{t("lesson.commonMistake")}</strong> {bundle.trouble}</p>}

          <div className="step-head">
            <span className="step-counter" role="group" aria-label={`Step ${stepIdx + 1} of ${steps.length}`}>
              {stepIdx + 1}<span> / {steps.length}</span>
              <i style={{ width: `${((stepIdx + 1) / Math.max(1, steps.length)) * 100}%` }} />
            </span>
            <span className="eyebrow" style={{ margin: 0 }}>{step?.block.t.toUpperCase()}</span>
          </div>

          <div className="narrative-blocks" ref={narrativeRef} onClick={followLessonLink}>
            {step && (
              step.block.t === "h" ? <h2>{step.block.text}</h2>
                : step.block.t === "ex" ? (
                  <div>
                    <h3>{step.block.title}</h3>
                    <p dangerouslySetInnerHTML={{ __html: renderMath(step.block.q ?? "") }} />
                    <WorkingReveal steps={step.block.steps ?? []} answer={step.block.a} />
                  </div>
                )
                  : <p dangerouslySetInnerHTML={{ __html: renderMath(step.block.html ?? step.block.text ?? "") }} />
            )}
          </div>

          <div className="step-nav">
            <button className="btn" disabled={stepIdx === 0} onClick={() => setStepIdx((n) => n - 1)}>{t("lesson.prev")}</button>
            <button className="btn-primary" disabled={stepIdx >= steps.length - 1} onClick={() => setStepIdx((n) => n + 1)}>{t("lesson.continue")}</button>
          </div>
          <NarrationBar text={strip(step?.block.html ?? step?.block.text ?? step?.block.q ?? "")} rate={state.speed} />
        </aside>

        <section className="stage" aria-label="Interactive figure">
          {stagePrompt && <p className="stage-prompt"><span aria-hidden>◉</span> <span dangerouslySetInnerHTML={{ __html: renderMath(stagePrompt) }} /></p>}
          {vizBlock?.name === "ph-orbit" && (
            <div className="orbit-toggle" role="group" aria-label={t("orbit.title")}>
              <button className={!orbit3d ? "chip active" : "chip"} aria-pressed={!orbit3d} onClick={() => setOrbit3d(false)}>{t("orbit.twoD")}</button>
              <button className={orbit3d ? "chip active" : "chip"} aria-pressed={orbit3d} onClick={() => setOrbit3d(true)}>{t("orbit.threeD")}</button>
            </div>
          )}
          <div className="figure-card">
            {figureKind === "music" ? (
              <MusicLab
                compact
                slug={String((opts as { slug?: string } | null)?.slug ?? "")}
                onSelect={(s2) => {
                  const t = getGraph().topics.find((x) => x.ladder === "music" && x.slug === s2);
                  window.location.href = `${window.location.pathname}?s=music&c=${encodeURIComponent(t?.course ?? course)}&t=${encodeURIComponent(s2)}`;
                }}
              />
            )
              : figureKind === "lesson" ? <LessonFigure opts={opts as Record<string, unknown>} />
              : vizBlock?.name === "ph-orbit" && orbit3d ? <OrbitMode opts={(opts ?? {}) as Record<string, unknown>} />
                : figureKind === "motion" && opts ? <MotionFigure opts={opts} />
                : figureKind === "wave" ? <WaveFigure opts={opts as Record<string, unknown>} />
                  : figureKind === "circuit" ? <CircuitFigure opts={opts as Record<string, unknown>} />
                    : figureKind === "field" ? <FieldFigure opts={opts as Record<string, unknown>} />
                      : figureKind === "optics" ? <OpticsFigure opts={opts as Record<string, unknown>} />
                        : figureKind === "energy" ? <EnergyFigure opts={opts as Record<string, unknown>} />
                          : figureKind === "collision" ? <CollisionFigure opts={opts as Record<string, unknown>} />
                            : figureKind === "function" ? <FunctionFigure opts={opts as Record<string, unknown>} />
                              : figureKind === "particle" ? <ParticleFigure opts={opts as Record<string, unknown>} />
                                : figureKind === "data" ? <DataFigure opts={opts as Record<string, unknown>} />
                                  : figureKind === "globe" ? <GlobeFigure opts={opts as Record<string, unknown>} />
                                    : vizBlock ? <RepoViz name={vizBlock.name!} ladder={vizLadder} opts={(opts ?? {}) as Record<string, unknown>} />
                      : null}
          </div>
          {(figureKind === "motion" || figureKind === "wave") && <div className="stage-controls"><PacingBar duration={figureKind === "wave" ? 8 : duration} /><LayerToggles /></div>}

          {expectedApex != null && (
            <div className="try-it">
              <label htmlFor="apex">{t("lesson.tryIt")}</label>
              <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                <input id="apex" value={answer} onChange={(e) => setAnswer(e.target.value)} inputMode="decimal" placeholder="e.g. 11.0" />
                <button className="btn-primary" onClick={check}>{t("lesson.check")}</button>
                <button className="btn" onClick={() => patch({ op: "clearFeedback" })}>{t("lesson.clear")}</button>
              </div>
              {state.feedback && <p aria-live="polite" className="feedback-note">
                Your marker is dashed; the correct apex is <strong>{expectedApex.toFixed(2)} m</strong>.
                {Math.abs(Number(answer) - expectedApex) < 0.15 ? " Correct." : " Adjust your entry and check again."}
              </p>}
            </div>
          )}

          <PracticePanel topicId={bundle.id} ladder={ladder} fallback={bundle.practice as never} onAnswer={(ok) => { recordAnswer(bundle.id, ok); setTick((n) => n + 1); }} />

          <details className="sources">
            <summary>{t("lesson.sources")}</summary>
            <ul>{bundle.lesson.sources.map((s, i) => <li key={i}>{s.name}</li>)}</ul>
            <p>Content © Teddy Rook · CC BY-NC 4.0 · link back required. Engine MIT.</p>
          </details>

          <LibraryStrip topicId={bundle.id} />
          <MarblePanel topicId={bundle.id} />
        </section>
      </div>
    </main>
  );
}
