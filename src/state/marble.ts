// Read-only, lazily-loaded cross-curriculum data for a lesson.
//
// The Marble Skill Taxonomy (https://github.com/withmarbleapp/os-taxonomy) is
// imported into a separate namespace under content/marble/ and never merged into
// the app's own corpus: ODbL 1.0 share-alike stays contained, and a lesson with
// no match costs nothing (404 is cached and ignored).

export type MarbleWrong = { wrong: string | null; revealedBy: string; fix: string; reteach: string | null };
export type MarblePrereq = { id: string; name: string; strength: "hard" | "soft"; reason: string; appId: string | null; href?: string | null };

export type MarbleData = {
  attribution: string;
  licence: string;
  topicId: string;
  marble: {
    id: string;
    name: string;
    subject: string;
    domain: string;
    ages: [number, number] | null;
    description: string | null;
    prompt: string | null;
  };
  cluster: { summary: string } | null;
  standards: string[];
  misconceptions: string[];
  representations: string[];
  authoredAnswer: string | null;
  probe: string | null;
  wrongAnswers: MarbleWrong[];
  before: MarblePrereq[];
  after: { id: string; name: string; strength: "hard" | "soft" }[];
  match: { how: string; confidence: number };
};

const cache = new Map<string, MarbleData | null>();
const inflight = new Map<string, Promise<MarbleData | null>>();

export function loadMarble(topicId: string): Promise<MarbleData | null> {
  if (!topicId) return Promise.resolve(null);
  if (cache.has(topicId)) return Promise.resolve(cache.get(topicId) ?? null);
  const pending = inflight.get(topicId);
  if (pending) return pending;

  const base = import.meta.env.BASE_URL;
  const url = `${base}content/marble/by-topic/${encodeURIComponent(topicId)}.json`;
  const p = fetch(url)
    .then((r) => (r.ok ? (r.json() as Promise<MarbleData>) : null))
    .catch(() => null)
    .then((d) => { cache.set(topicId, d); inflight.delete(topicId); return d; });
  inflight.set(topicId, p);
  return p;
}

// "ngss-k5:1-PS4-1" → "NGSS · 1-PS4-1", "uk-nc-2013:Y4.Sci.Snd.1" → "UK · Y4.Sci.Snd.1"
const CURRICULUM: Record<string, string> = {
  "ngss-k5": "NGSS",
  "ngss-ms": "NGSS",
  "ngss-hs": "NGSS",
  "acara-v9": "ACARA v9",
  "uk-nc-2013": "UK NC",
  "common-core": "CCSS",
  ccss: "CCSS",
};
export function prettyStandard(id: string): { label: string; code: string } {
  const [rawKey, ...rest] = id.split(":");
  const code = rest.join(":") || id;
  const key = rawKey.toLowerCase();
  if (CURRICULUM[key]) return { label: CURRICULUM[key], code };
  const words = key.replace(/-(19|20)\d\d$/, "").split(/[-_]/).filter(Boolean);
  const skip = new Set(["the", "curriculum", "and", "of", "for", "standards", "standard", "science", "technology", "20", "20"]);
  const picked = words.filter((w) => !skip.has(w)).slice(0, 2);
  const label = picked.length
    ? picked.map((w) => (w.length <= 3 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1))).join(" ")
    : rawKey;
  return { label, code };
}
