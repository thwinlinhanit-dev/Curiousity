import { useEffect, useState, type ReactNode } from "react";
import SiteHeader from "../components/SiteHeader";

// The UI/UX plan ships as a plain markdown document at /docs/design-plan.md and
// is rendered here, so the plan and the app can be read side by side.
type Block =
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "hr" };

const STARTER = /^([-*]\s|\d+\.\s|#{1,4}\s|\||```\s*$|---+$)/;

function parse(src: string): Block[] {
  const lines = src.split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    if (/^```/.test(line)) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i += 1;
      out.push({ kind: "code", text: buf.join("\n") });
      continue;
    }

    if (/^---+$/.test(line.trim())) { out.push({ kind: "hr" }); i += 1; continue; }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(3, heading[1].length) as 1 | 2 | 3;
      out.push({ kind: "h", level, text: heading[2] });
      i += 1;
      continue;
    }

    if (/^\|/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        const isRule = cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
        if (!isRule && cells.length > 0) rows.push(cells);
        i += 1;
      }
      const [head, ...body] = rows;
      if (head) out.push({ kind: "table", head, rows: body });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s+/, ""));
      out.push({ kind: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s+/, ""));
      out.push({ kind: "ol", items });
      continue;
    }

    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !STARTER.test(lines[i])) buf.push(lines[i++]);
    if (buf.length) out.push({ kind: "p", text: buf.join(" ") });
    else i += 1;
  }
  return out;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*)/g;

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = new RegExp(INLINE.source, "g");
  let last = 0;
  let m = re.exec(text);
  while (m) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={m.index}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={m.index}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("[")) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (link) out.push(<a key={m.index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>);
      else out.push(tok);
    } else out.push(<em key={m.index}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
    m = re.exec(text);
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function block(b: Block, key: number): ReactNode {
  switch (b.kind) {
    case "h": {
      const Tag = b.level === 1 ? "h1" : b.level === 2 ? "h2" : "h3";
      return <Tag key={key}>{inline(b.text)}</Tag>;
    }
    case "p": return <p key={key}>{inline(b.text)}</p>;
    case "ul": return <ul key={key}>{b.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>;
    case "ol": return <ol key={key}>{b.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ol>;
    case "hr": return <hr key={key} />;
    case "code": return <pre key={key}><code>{b.text}</code></pre>;
    case "table": return (
      <div className="doc-table" key={key}>
        <table>
          <thead><tr>{b.head.map((c, i) => <th key={i}>{inline(c)}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
}

export default function PlanPage({ onBack, src = "docs/design-plan.md" }: { onBack: () => void; src?: string }) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setBlocks(null);
    setError("");
    fetch(`${import.meta.env.BASE_URL}${src}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
      .then((text) => { if (alive) setBlocks(parse(text)); })
      .catch((e) => { if (alive) setError(String(e)); });
    return () => { alive = false; };
  }, [src]);

  return (
    <main className="topic-page" id="main-content">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="topic-header">
        <SiteHeader />
        <button className="btn-link" onClick={onBack}>← All topics</button>
      </header>
      <article className="doc">
        {error && (
          <p role="alert" style={{ color: "var(--danger)" }}>
            Couldn’t load this page ({error}).
          </p>
        )}
        {!blocks && !error && <p style={{ color: "var(--ink-3)" }}>Loading…</p>}
        {blocks?.map((b, i) => block(b, i))}
      </article>
    </main>
  );
}
