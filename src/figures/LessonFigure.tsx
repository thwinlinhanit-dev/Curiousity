import { useState } from "react";
import { renderMath } from "../utils/richtext";

type Block = { t: string; html?: string; text?: string; title?: string; q?: string; steps?: string[]; a?: string; rows?: string[][]; head?: string[]; items?: string[] };
type Opts = { blocks?: Block[]; title?: string; short?: string; [k: string]: unknown };

const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function LessonFigure({ opts }: { opts: Opts }) {
  const blocks = opts.blocks ?? [];
  const [open, setOpen] = useState<number | null>(0);
  const cards = blocks.filter((b) => ["key", "why", "mistake", "ex", "table", "list", "note"].includes(b.t));
  const labels: Record<string, string> = { key: "Key idea", why: "Why it works", mistake: "Common mistake", ex: "Worked example", table: "Table", list: "List", note: "Note" };

  if (!cards.length) return <div className="lesson-figure"><p style={{ color: "var(--ink-2)" }}>{opts.short}</p></div>;

  return (
    <div className="lesson-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> Read the idea card, then open an example to see the reasoning step by step.</p>
      <div className="idea-cards">
        {cards.map((b, i) => (
          <div key={i} className={`idea-card idea-${b.t}`}>
            <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="idea-label">{labels[b.t] ?? b.t}</span>
              <b>{strip(b.title ?? b.html ?? b.text ?? b.q ?? "").slice(0, 90)}</b>
            </button>
            {open === i && (
              <div className="idea-body">
                {b.t === "ex" ? (
                  <>
                    {b.q && <p dangerouslySetInnerHTML={{ __html: renderMath(b.q) }} />}
                    <ol>{(b.steps ?? []).map((s, j) => <li key={j} dangerouslySetInnerHTML={{ __html: renderMath(s) }} />)}</ol>
                    {b.a && <p><strong>Answer:</strong> <span dangerouslySetInnerHTML={{ __html: renderMath(b.a) }} /></p>}
                  </>
                ) : b.t === "table" ? (
                  <table><tbody>{(b.rows ?? []).map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} dangerouslySetInnerHTML={{ __html: renderMath(c) }} />)}</tr>)}</tbody></table>
                ) : b.t === "list" ? (
                  <ul>{(b.items ?? []).map((x, j) => <li key={j} dangerouslySetInnerHTML={{ __html: renderMath(x) }} />)}</ul>
                ) : (
                  <p dangerouslySetInnerHTML={{ __html: renderMath(b.html ?? b.text ?? "") }} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)", marginTop: "var(--sp-3)" }}>
        This topic has no graphic or generator in the source corpus, so it uses a content-derived idea-card figure and self-check.
      </p>
    </div>
  );
}
