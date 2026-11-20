// Map ingredient ids to store aisles for the meal planner's shopping list.
// Source: trb/data/meals/ingredients.yaml (CC BY-NC 4.0, Teddy Rook Book).
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.resolve(root, "../trb/data/meals/ingredients.yaml");
const dst = path.resolve(root, "content/apps/aisles.json");

const doc = YAML.parse(fs.readFileSync(src, "utf8"));
const groupName = Object.fromEntries((doc.groups ?? []).map((g) => [g.id, g.name]));
const map = {};
for (const ing of doc.ingredients ?? []) {
  const aisle = groupName[ing.group] ?? "Other";
  map[ing.id] = aisle;
  for (const id of ing.items ?? []) map[id] = aisle;
}
const out = {
  source: "Teddy Rook Book — Meal Prep ingredients",
  source_url: "https://teddyrookbook.com/meal-prep/",
  license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required",
  aisles: map,
  ingredients: (doc.ingredients ?? []).map((i) => ({ id: i.id, name: i.name, group: groupName[i.group] ?? "Other", items: i.items ?? [] })),
};
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, `${JSON.stringify(out)}\n`);
console.log(`aisles: ${Object.keys(map).length} ids, ${out.ingredients.length} ingredient guides`);
