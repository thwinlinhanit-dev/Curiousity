// Content contract: every topic bundle must be readable and well-formed.
//
// Report mode (default): prints a count per check and writes
// content-contract-report.json at the repo root (gitignored). It never fails,
// so CI stays green while the corpus is cleaned up.
//
// Strict mode (CONTRACT_STRICT=1, used by `npm run contract`): fails when a
// check exceeds its allowance in content-contract.baseline.json. A missing key
// allows zero, so a check with no entry must be clean.
//
// The corpus is restored by scripts/fetch-corpus.mjs (run by `pretest`). If it
// is absent, the suite is skipped rather than failing.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../..");
const CONTENT = path.join(ROOT, "content");
const REPORT = path.join(ROOT, "content-contract-report.json");
const BASELINE = path.join(here, "content-contract.baseline.json");
const STRICT = process.env.CONTRACT_STRICT === "1";
const EXAMPLES = 5;

type Check =
  | "parse"
  | "id"
  | "title"
  | "lesson"
  | "sources"
  | "noContent"
  | "emptyTry"
  | "dollar"
  | "unrendered";

const CHECKS: Check[] = ["parse", "id", "title", "lesson", "sources", "noContent", "emptyTry", "dollar", "unrendered"];

type Bundle = Record<string, unknown>;
type Block = Record<string, unknown>;
type Result = {
  files: number;
  checks: Record<Check, { count: number; examples: string[] }>;
};

function walkJson(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJson(p, out);
    else if (entry.name.endsWith(".json")) out.push(p);
  }
  return out;
}

function ladderKeys(): string[] {
  const catalogPath = path.join(CONTENT, "catalog.json");
  if (!fs.existsSync(catalogPath)) return [];
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as { ladders: { key: string }[] };
  return catalog.ladders.map((l) => l.key);
}

// Every string anywhere inside a value: lesson text lives in html, text, q, a,
// title, steps and similar fields.
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v && typeof v === "object") for (const x of Object.values(v)) strings(x, out);
  return out;
}

// The text a block carries, ignoring its type tag.
function body(block: Block): string[] {
  return strings(Object.entries(block).filter(([k]) => k !== "t").map(([, v]) => v));
}

const blank = (s: string) => s.trim() === "";

function audit(files: string[]): Result {
  const checks = {} as Result["checks"];
  for (const c of CHECKS) checks[c] = { count: 0, examples: [] };

  const flag = (c: Check, where: string) => {
    checks[c].count += 1;
    if (checks[c].examples.length < EXAMPLES) checks[c].examples.push(where);
  };

  for (const file of files) {
    const where = path.relative(CONTENT, file).split(path.sep).join("/");
    let bundle: Bundle;
    try {
      bundle = JSON.parse(fs.readFileSync(file, "utf8")) as Bundle;
    } catch {
      flag("parse", where);
      continue;
    }

    const id = typeof bundle.id === "string" ? bundle.id : "";
    const label = id || where;
    if (!id.trim()) flag("id", where);
    if (typeof bundle.title !== "string" || !bundle.title.trim()) flag("title", label);

    const lesson = bundle.lesson as { blocks?: unknown; sources?: unknown } | undefined;
    const rawBlocks = lesson?.blocks;
    const blocks = Array.isArray(rawBlocks) ? (rawBlocks as Block[]) : [];
    if (blocks.length === 0) flag("lesson", label);

    const sources = lesson?.sources;
    if (!Array.isArray(sources) || sources.length === 0) flag("sources", label);

    if (blocks.length > 0 && blocks.every((b) => body(b).every(blank))) flag("noContent", label);
    if (blocks.some((b) => b.t === "try" && body(b).every(blank))) flag("emptyTry", label);

    const all = strings(bundle);
    // An odd number of $ means a maths span was left open.
    if (all.some((s) => ((s.match(/\$/g) ?? []).length % 2) === 1)) flag("dollar", label);
    // \role{…} and \role[…] are authoring markup that KaTeX does not render.
    if (all.some((s) => /\\role[[{]/.test(s))) flag("unrendered", label);
  }

  return { files: files.length, checks };
}

function summary(r: Result): string {
  const rows = CHECKS.map((c) => `  ${c.padEnd(10)} ${String(r.checks[c].count).padStart(6)}`);
  return [`content contract: ${r.files} topic files`, ...rows].join("\n");
}

const files = ladderKeys().flatMap((k) => walkJson(path.join(CONTENT, k, "topics")));

describe.skipIf(files.length === 0)("content contract", () => {
  it("audits every topic bundle and writes a report", () => {
    const result = audit(files);
    fs.writeFileSync(REPORT, `${JSON.stringify(result, null, 2)}\n`);
    console.log(summary(result));
    expect(result.files).toBeGreaterThan(0);

    if (!STRICT) return;

    const allowance = fs.existsSync(BASELINE)
      ? (JSON.parse(fs.readFileSync(BASELINE, "utf8")) as Partial<Record<Check, number>>)
      : {};
    for (const c of CHECKS) {
      const max = allowance[c] ?? 0;
      const { count, examples } = result.checks[c];
      expect(
        count,
        `${c}: ${count} above allowed ${max}; examples: ${examples.join(", ")}`,
      ).toBeLessThanOrEqual(max);
    }
  });
});
