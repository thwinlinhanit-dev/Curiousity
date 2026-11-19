import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prettyStandard } from "./marble";

const here = path.dirname(fileURLToPath(import.meta.url));
const BY_TOPIC = path.resolve(here, "../../content/marble/by-topic");
const MAP = path.resolve(here, "../../content/marble/map.json");

describe("prettyStandard", () => {
  it("shortens known curriculum prefixes and keeps the code", () => {
    expect(prettyStandard("ngss-k5:1-PS4-1")).toEqual({ label: "NGSS", code: "1-PS4-1" });
    expect(prettyStandard("uk-nc-2013:Y4.Sci.Snd.1")).toEqual({ label: "UK NC", code: "Y4.Sci.Snd.1" });
    expect(prettyStandard("acara-v9:AC9S2U02")).toEqual({ label: "ACARA v9", code: "AC9S2U02" });
  });

  it("falls back to a readable label for an unknown curriculum", () => {
    const { label, code } = prettyStandard("the-ontario-curriculum-science-and-technology-20:ON-SCI-2022-G4-C2");
    expect(code).toBe("ON-SCI-2022-G4-C2");
    expect(label).not.toContain("the-");
  });
});

describe("imported Marble data", () => {
  const files = fs.existsSync(BY_TOPIC) ? fs.readdirSync(BY_TOPIC).filter((f) => f.endsWith(".json")) : [];

  it("has at least one matched lesson and a map that agrees", () => {
    expect(files.length).toBeGreaterThan(0);
    const map = JSON.parse(fs.readFileSync(MAP, "utf8")) as { topics: Record<string, unknown> };
    expect(Object.keys(map.topics).length).toBe(files.length);
  });

  it("never ships upstream parent-facing placeholders", () => {
    for (const f of files) {
      const raw = fs.readFileSync(path.join(BY_TOPIC, f), "utf8");
      expect(raw.includes("{{name}}"), `${f} contains {{name}}`).toBe(false);
    }
  });

  it("carries attribution and a licence on every lesson payload", () => {
    for (const f of files) {
      const doc = JSON.parse(fs.readFileSync(path.join(BY_TOPIC, f), "utf8")) as Record<string, unknown>;
      expect(String(doc.attribution ?? "")).toContain("Marble");
      expect(String(doc.licence ?? "")).toContain("ODbL");
    }
  });
});
