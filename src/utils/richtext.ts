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
  const withMath = String(html ?? "").replace(/\$([^$\n]+)\$/g, (_m, tex: string) => {
    try { return katex.renderToString(tex, { throwOnError: false, strict: false }); }
    catch { return `$${tex}$`; }
  });
  return sanitize(withMath);
}

export const textOnly = (html: string): string => sanitize(html).replace(/<[^>]*>/g, "").trim();
