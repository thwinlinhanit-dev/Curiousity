import { useEffect, useMemo, useState } from "react";
import { loadMarble, prettyStandard, type MarbleData } from "../state/marble";
import "./marble.css";

// Deterministic shuffle so a lesson always presents its options the same way.
function seededOrder(n: number, seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const out = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177); const j = Math.abs(h) % (i + 1); [out[i], out[j]] = [out[j]!, out[i]!]; }
  return out;
}

// Cross-curriculum context for one lesson, from the Marble Skill Taxonomy.
// Everything here is additive: standards, the "before this" chain, the
// misconceptions and authored wrong answers, and a grown-up summary.
export default function MarblePanel({ topicId }: { topicId: string }) {
  const [data, setData] = useState<MarbleData | null | undefined>(undefined);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setData(undefined);
    setPicked(null);
    loadMarble(topicId).then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [topicId]);

  const check = useMemo(() => {
    if (!data?.authoredAnswer || data.wrongAnswers.length < 1) return null;
    const options: { text: string; ok: boolean; why: string }[] = [
      { text: data.authoredAnswer, ok: true, why: "This is the accepted answer." },
      ...data.wrongAnswers.filter((w) => w.wrong).map((w) => ({ text: w.wrong!, ok: false, why: w.fix }) ),
    ].slice(0, 4);
    return { options, order: seededOrder(options.length, topicId) };
  }, [data, topicId]);

  if (!data) return null;
  const m = data.marble;
  const standards = data.standards.map(prettyStandard);
  const ages = m.ages ? `ages ${m.ages[0]}–${m.ages[1]}` : null;

  return (
    <section className="marble" aria-label="Cross-curriculum context">
      <p className="marble-source">
        Matched to <b>{m.name}</b> in the Marble Skill Taxonomy · {m.subject} › {m.domain}
        {ages ? ` · ${ages}` : ""}
      </p>

      {standards.length > 0 && (
        <div className="marble-standards" role="list" aria-label="Curriculum standards this topic covers">
          {standards.map((s, i) => (
            <span className="marble-chip" role="listitem" key={i}>
              <span className="marble-chip-label">{s.label}</span> {s.code}
            </span>
          ))}
        </div>
      )}

      {data.before.length > 0 && (
        <div className="marble-block">
          <h3>Before this</h3>
          <ul className="marble-before">
            {data.before.map((p, i) => (
              <li key={i}>
                <span className={`marble-strength ${p.strength}`}>{p.strength}</span>{" "}
                {p.href ? (
                  <a href={p.href}>{p.name}</a>
                ) : (
                  <b>{p.name}</b>
                )}
                {p.reason && <span className="marble-reason"> — {p.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.misconceptions.length > 0 && (
        <details className="marble-details">
          <summary>{data.misconceptions.length} common misconception{data.misconceptions.length === 1 ? "" : "s"}</summary>
          <ul>{data.misconceptions.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </details>
      )}

      {data.wrongAnswers.length > 0 && (
        <details className="marble-details">
          <summary>Wrong answers to expect, and how to unpick them</summary>
          <ul className="marble-wrong">
            {data.wrongAnswers.map((w, i) => (
              <li key={i}>
                {w.wrong && <blockquote>“{w.wrong}”</blockquote>}
                {w.revealedBy && <p><span className="marble-k">How it shows up</span> {w.revealedBy}</p>}
                {w.fix && <p><span className="marble-k">Next move</span> {w.fix}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {data.representations.length > 0 && (
        <details className="marble-details">
          <summary>Ways to picture it</summary>
          <ul>{data.representations.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </details>
      )}

      {data.probe && (
        <details className="marble-details">
          <summary>Try this, then explain it</summary>
          <p>{data.probe}</p>
          {data.authoredAnswer && (
            <details className="marble-nested">
              <summary>What a good answer sounds like</summary>
              <p>{data.authoredAnswer}</p>
            </details>
          )}
        </details>
      )}

      {data.after.length > 0 && (
        <p className="marble-next">
          <span className="marble-k">Leads to</span>{" "}
          {data.after.map((x, i) => (
            <span key={i}>
              {i > 0 && ", "}
              {x.name}
            </span>
          ))}
        </p>
      )}

      {check && (
        <div className="marble-check">
          <h3>Quick check</h3>
          <p className="marble-check-q">{data.marble.prompt ?? "Which of these is correct?"}</p>
          <div className="marble-options" role="group" aria-label="Choose the correct statement">
            {check.order.map((idx) => {
              const o = check.options[idx]!;
              const state = picked == null ? "idle" : o.ok ? "ok" : picked === idx ? "bad" : "idle";
              return (
                <button
                  key={idx}
                  className={`marble-option ${state}`}
                  aria-pressed={picked === idx}
                  onClick={() => setPicked(idx)}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
          <div aria-live="polite" className="marble-feedback">
            {picked != null && (
              <p>
                <b>{check.options[picked]!.ok ? "Yes. " : "Not quite. "}</b>
                {check.options[picked]!.why}
              </p>
            )}
          </div>
        </div>
      )}

      {data.cluster?.summary && (
        <details className="marble-details marble-grownup">
          <summary>For the grown-up</summary>
          <p>{data.cluster.summary}</p>
        </details>
      )}

      <p className="marble-attribution">
        {data.attribution} · {data.licence}
      </p>
    </section>
  );
}
