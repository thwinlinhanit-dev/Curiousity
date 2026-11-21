import marbleIndex from "../../content/marble/matched.json";

// The library collections, in browsing order. One source of truth for the
// shell search, the library index and the dataset router.
export const DATASETS: [string, string][] = [
  ["science-lab", "Science Lab"], ["elements", "Periodic table"], ["memory", "Memory lists"],
  ["recipes", "Recipes"], ["music", "Music"], ["trades", "Trades"], ["debate", "Debate"],
  ["greatbooks", "Great Books"], ["papers", "Founding papers"], ["harvard", "Harvard Classics"],
  ["garden", "Food garden"],
  ["timeline", "Timeline"], ["infographics", "Infographics"], ["resources", "Resources"], ["credits", "Credits & licences"],
];

// Lessons cross-checked against curriculum standards (Marble Skill Taxonomy).
const MARBLE_IDS = new Set(marbleIndex.ids);
export const hasStandards = (id: string) => MARBLE_IDS.has(id);
export const standardsCount = marbleIndex.count;