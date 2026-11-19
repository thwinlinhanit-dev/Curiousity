import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(here, "../../content/library/links.json");
const doc = JSON.parse(fs.readFileSync(file, "utf8")) as {
  byTopic: Record<string, { dataset: string; key: string; confidence: string }[]>;
  byItem: Record<string, { dataset: string; lessons: { topicId: string; href: string }[] }>;
};

describe("library links", () => {
  it("is bidirectional: every byItem lesson has the matching byTopic row", () => {
    for (const [key, entry] of Object.entries(doc.byItem)) {
      for (const l of entry.lessons) {
        const rows = doc.byTopic[l.topicId] ?? [];
        expect(rows.some((r) => r.key === key), `${key} → ${l.topicId}`).toBe(true);
      }
    }
  });

  it("ships only exact/strong confidence", () => {
    for (const rows of Object.values(doc.byTopic))
      for (const r of rows) expect(["exact", "strong"]).toContain(r.confidence);
  });

  it("uses lesson hrefs the app router understands", () => {
    for (const entry of Object.values(doc.byItem))
      for (const l of entry.lessons)
        expect(l.href).toMatch(/^\?s=[^&]+&c=[^&]+&t=[^&]+$/);
  });

  it("has the curated science-lab hubs (spec: labs never title-match)", () => {
    const lab = doc.byItem["science-lab:2"]?.lessons.map((l) => l.topicId) ?? [];
    expect(lab).toContain("phys1.free-fall");
    expect(doc.byItem["elements:0"]?.lessons.length).toBeGreaterThan(0);
  });
});
