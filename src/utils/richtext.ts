// All corpus/generator HTML passes through here before it reaches the DOM.
// KaTeX is applied first so its markup is part of the sanitized tree; scripts,
// event handlers and unknown URLs are removed by DOMPurify.
import DOMPurify from "dompurify";
import katex from "katex";

const ALLOWED_TAGS = [
  "p", "br", "b", "strong", "i", "em", "u", "sup", "sub", "small", "span", "div",
  "ul", "ol", "li", "code", "pre", "a", "table", "thead", "tbody", "tr", "th", "td",
  "blockquote", "h3", "h4", "math", "annotation", "semantics", "mrow", "mi", "mn", "mo", "ms", "mtext",
];
const ALLOWED_ATTR = ["href", "title", "class", "style", "aria-label", "role", "colspan", "rowspan"];

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS, ALLOWED_ATTR });
}

export function renderMath(html: string): string {
  // Corpus currency is stored as \$ so KaTeX will not treat two prices as a
  // math span. Turn the escape into an HTML entity so the backslash never
  // reaches the reader.
  const source = String(html ?? "").replace(/\\\$/g, "&#36;");
  const withMath = source.replace(/\$([^$\n]+)\$/g, (_m, tex: string) => {
    try { return katex.renderToString(tex, { throwOnError: false, strict: false }); }
    catch { return `$${tex}$`; }
  });
  return sanitize(withMath);
}

export const textOnly = (html: string): string => sanitize(html).replace(/<[^>]*>/g, "").trim();

// Music curriculum pages (trb/content/music) carry the interactive widgets in
// data-ml attributes, plus inert <script type="application/json"> data blocks.
// Everything else a script could be is stripped.
const LESSON_TAGS = [...ALLOWED_TAGS, "h2", "figure", "figcaption", "kbd", "details", "summary", "hr", "dl", "dt", "dd"];
const LESSON_ATTR = [...ALLOWED_ATTR, "src", "alt", "loading", "width", "height", "id"];
export function sanitizeLesson(html: string): string {
  // Never let a <script> tag reach DOMPurify. Music lessons carry inert JSON
  // data blocks that their widgets read, so lift those payloads out first,
  // sanitise the markup, then rebuild only inert application/json scripts.
  const payloads: string[] = [];
  const prepared = String(html ?? "").replace(
    /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (_all, body: string) => `<div data-json-index="${payloads.push(body) - 1}"></div>`,
  );
  const clean = DOMPurify.sanitize(prepared, {
    ALLOWED_TAGS: LESSON_TAGS,
    ALLOWED_ATTR: LESSON_ATTR,
    ALLOW_DATA_ATTR: true,
  });
  return clean.replace(/<div data-json-index="(\d+)"><\/div>/g, (_all, i: string) => {
    const payload = payloads[Number(i)] ?? "";
    return `<script type="application/json">${payload.replace(/</g, "\\u003c")}</script>`;
  });
}
