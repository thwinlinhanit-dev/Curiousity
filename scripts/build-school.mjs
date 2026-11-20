// Normalise the homeschool planner subjects and the placement check.
// Source: trb/data/hs_planner.yaml + hs_placement.yaml (CC BY-NC 4.0, Teddy Rook Book).
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const data = path.resolve(root, "../trb/data");
const dst = path.resolve(root, "content/apps/school.json");

const planner = YAML.parse(fs.readFileSync(path.join(data, "hs_planner.yaml"), "utf8"));
const placement = YAML.parse(fs.readFileSync(path.join(data, "hs_placement.yaml"), "utf8"));

const subjects = (planner.subjects ?? []).map((s) => ({
  key: s.key, name: s.name, note: s.note ?? "",
  on_ages: s.on_ages ?? [], mins: s.mins ?? [], hw: s.hw ?? [],
  courses: (s.courses ?? []).map((c) => ({
    key: c.key, name: c.name, from: c.from, to: c.to,
    mins: c.mins ?? 0, rep: c.rep ?? 1, w: c.w ?? "Lesson",
    ladder: c.ladder ?? null, lc: c.lc ?? null,
    url: c.url ?? "", alt: !!c.alt,
  })),
}));
const checks = (placement.subjects ?? []).map((s) => ({
  key: s.key, name: s.name, how: s.how ?? "", judge: s.judge ?? [],
  start: s.start ?? [],
  points: (s.points ?? []).map((p) => ({
    course: p.course, lesson: p.lesson, book: p.book ?? "",
    ask: p.ask ?? "", lines: p.lines ?? [], answers: p.answers ?? [],
  })),
}));
const out = {
  source: "Teddy Rook Book — Homeschool lesson planner and placement",
  source_url: "https://teddyrookbook.com/homeschool/",
  license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required",
  subjects, checks,
};
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, `${JSON.stringify(out)}\n`);
console.log(`school: ${subjects.length} subjects, ${subjects.reduce((n, s) => n + s.courses.length, 0)} courses, ${checks.length} placement checks`);
