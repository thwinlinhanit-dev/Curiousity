// Course packs: one document per (ladder, course) holding the course index and
// every topic bundle in it. scripts/publish-content.mjs writes them; loading one
// course at a time is what keeps the published site inside its file budget.
import type { CourseIndex } from "./courseTypes";

export type CoursePack = { index: CourseIndex | null; topics: Record<string, unknown> };

const cache = new Map<string, Promise<CoursePack>>();

export function loadCoursePack(ladder: string, course: string): Promise<CoursePack> {
  const key = `${ladder}/${course}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fetch(`${import.meta.env.BASE_URL}content/pack/${encodeURIComponent(ladder)}/${encodeURIComponent(course)}.json`)
    .then((r) => (r.ok ? (r.json() as Promise<CoursePack>) : { index: null, topics: {} }))
    .catch(() => ({ index: null, topics: {} }) as CoursePack)
    .then((pack) => ({ index: pack.index ?? null, topics: pack.topics ?? {} }));
  cache.set(key, p);
  return p;
}
