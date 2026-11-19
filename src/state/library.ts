// Bidirectional links between library datasets and curriculum lessons.
// Built offline by scripts/library-map.mjs → content/library/links.json.
// Only exact/strong matches ship; weak ones stay in links-report.txt.

export type LibraryLink = { dataset: string; key: string; title: string; confidence: "exact" | "strong" };
type LinksDoc = {
  generated: string;
  stats: Record<string, number>;
  byTopic: Record<string, LibraryLink[]>;
  byItem: Record<string, { dataset: string; index: number; title: string; lessons: { topicId: string; ladder: string; course: string; href: string }[] }>;
};

let doc: LinksDoc | null | undefined;
let pending: Promise<LinksDoc | null> | null = null;

export function loadLinks(): Promise<LinksDoc | null> {
  if (doc !== undefined) return Promise.resolve(doc);
  if (pending) return pending;
  pending = fetch(`${import.meta.env.BASE_URL}content/library/links.json`)
    .then((r) => (r.ok ? (r.json() as Promise<LinksDoc>) : null))
    .catch(() => null)
    .then((d) => { doc = d; pending = null; return d; });
  return pending;
}

export const DATASET_LABELS: Record<string, string> = {
  "science-lab": "Science Lab", elements: "Periodic table", memory: "Memory lists",
  recipes: "Recipes", music: "Music", trades: "Trades", debate: "Debate",
  greatbooks: "Great Books", papers: "Founding papers", harvard: "Harvard Classics",
  garden: "Food garden", timeline: "Timeline", infographics: "Infographics",
};

// Group a lesson's links by dataset, capped per dataset for the strip.
export function groupedLinks(rows: LibraryLink[] | undefined, cap = 4): { dataset: string; label: string; items: LibraryLink[]; extra: number }[] {
  if (!rows?.length) return [];
  const by = new Map<string, LibraryLink[]>();
  for (const r of rows) (by.get(r.dataset) ?? by.set(r.dataset, []).get(r.dataset)!).push(r);
  return [...by.entries()].map(([dataset, items]) => ({
    dataset,
    label: DATASET_LABELS[dataset] ?? dataset,
    items: items.slice(0, cap),
    extra: Math.max(0, items.length - cap),
  }));
}

// The stable key for one dataset item, identical to the one library-map.mjs
// writes: slug, then meta.id, then index.
export function itemKey(dataset: string, meta: Record<string, unknown> | undefined, index: number): string {
  return `${dataset}:${String(meta?.slug ?? meta?.id ?? index)}`;
}

export function lessonsForItem(key: string): Promise<{ topicId: string; href: string }[]> {
  return loadLinks().then((d) => (d ? d.byItem[key]?.lessons ?? [] : []));
}
