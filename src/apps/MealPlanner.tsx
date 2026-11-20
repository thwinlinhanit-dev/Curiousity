import { useEffect, useMemo, useState } from "react";
import { plural } from "../utils/plural";

type Ingredient = { item: string; amount?: number; unit?: string; prep?: string; optional?: boolean };
type Recipe = { title: string; body?: string; meta: { id: string; ingredients: Ingredient[]; tags?: string[]; times?: Record<string, number> } };
type Recipes = { items: Recipe[] };
type Aisles = { aisles: Record<string, string>; ingredients: { id: string; name: string; group: string; items: string[] }[] };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS = ["breakfast", "lunch", "dinner"];
const fmtAmount = (n: number) => Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
const DESSERT = /(cake|cookie|brownie|pie|tart|frosting|buttercream|fudge|candy|pudding|ice cream|sorbet|cheesecake)/i;
const BREAKFAST = /(breakfast|pancake|waffle|oatmeal|granola|smoothie|yogurt|muffin|scone|biscuit|french toast|eggs benedict|scramble|omelet|frittata|hash|strat|coffee cake|crepe|bagel|porridge|parfait)/i;
const LUNCH = /(salad|sandwich|wrap|soup|taco|burrito|quesadilla|pita|bowl|leftover|pizza|melt|toastie)/i;
const DINNER = /(chicken|beef|pork|fish|salmon|shrimp|roast|stew|curry|chili|casserole|lasagna|pasta|rice|noodle|stir-fry|grill|burger|meatloaf|soup|bake)/i;
const suggestedFor = (slot: string, title: string) => {
  if (DESSERT.test(title)) return false;
  if (slot === "breakfast") return BREAKFAST.test(title);
  if (slot === "lunch") return LUNCH.test(title);
  return DINNER.test(title);
};
const load = (u: string) => fetch(`${import.meta.env.BASE_URL}${u}`).then((r) => r.json());

export default function MealPlanner() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [aisles, setAisles] = useState<Aisles | null>(null);
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [household, setHousehold] = useState(4);
  const [slot, setSlot] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [useId, setUseId] = useState("");
  const [onlyForSlot, setOnlyForSlot] = useState(true);

  useEffect(() => {
    load("content/data/recipes.json").then((d: Recipes) => setRecipes(d.items)).catch(() => undefined);
    load("content/apps/aisles.json").then(setAisles).catch(() => undefined);
    try { setPlan(JSON.parse(localStorage.getItem("trb-meal-plan") || "{}")); } catch { /* nothing */ }
  }, []);
  const save = (p: Record<string, string>) => { setPlan(p); try { localStorage.setItem("trb-meal-plan", JSON.stringify(p)); } catch { /* private */ } };

  const byId = useMemo(() => Object.fromEntries(recipes.map((r) => [r.meta.id, r])), [recipes]);
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return recipes
      .filter((r) => !onlyForSlot || !slot || suggestedFor(slot.split("-")[1], r.title))
      .filter((r) => !needle || r.title.toLowerCase().includes(needle))
      .slice(0, 40);
  }, [recipes, q, onlyForSlot, slot]);

  const shopping = useMemo(() => {
    const sums = new Map<string, { item: string; unit: string; amount: number; aisle: string }>();
    for (const id of Object.values(plan)) {
      const r = byId[id]; if (!r) continue;
      for (const ing of r.meta.ingredients ?? []) {
        if (ing.optional || !ing.item || !ing.amount) continue;
        const key = `${ing.item}|${ing.unit ?? ""}`;
        const amount = ing.amount * household / 4;
        const aisle = aisles?.aisles[ing.item] ?? "Other";
        const prev = sums.get(key);
        sums.set(key, { item: ing.item, unit: ing.unit ?? "", amount: (prev?.amount ?? 0) + amount, aisle });
      }
    }
    const groups = new Map<string, { item: string; unit: string; amount: number }[]>();
    for (const v of sums.values()) {
      if (!groups.has(v.aisle)) groups.set(v.aisle, []);
      groups.get(v.aisle)!.push({ item: v.item, unit: v.unit, amount: v.amount });
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([aisle, items]) => ({ aisle, items: items.sort((a, b) => a.item.localeCompare(b.item)) }));
  }, [plan, byId, household, aisles]);

  const useRecipes = useMemo(() => {
    const ing = aisles?.ingredients.find((i) => i.id === useId);
    if (!ing) return [];
    const ids = new Set([ing.id, ...ing.items]);
    return recipes.filter((r) => (r.meta.ingredients ?? []).some((i) => ids.has(i.item))).slice(0, 30);
  }, [useId, aisles, recipes]);

  const planCount = Object.values(plan).filter(Boolean).length;

  return (
    <section className="app-section" aria-labelledby="meal-title">
      <p className="eyebrow">MEAL PREP · FOR FAMILIES</p>
      <h2 id="meal-title" className="app-heading">Plan a week of meals</h2>
      <p className="app-lead">Put meals on a calendar, scale them to your household, and get one shopping list added up by store aisle. {plural(recipes.length, "recipe")} from the corpus, all local to your browser.</p>

      <div className="app-toolbar">
        <label>People at the table <input type="number" min={1} max={20} value={household} onChange={(e) => setHousehold(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} /></label>
        <button className="btn" onClick={() => { save({}); setChecked({}); }}>Clear plan</button>
        <button className="btn" onClick={() => window.print()}>Print week & list</button>
        <span className="app-muted">{plural(planCount, "meal")} planned</span>
      </div>

      <div className="mp-week">
        {DAYS.map((day) => (
          <div className="mp-day" key={day}>
            <h3>{day}</h3>
            {SLOTS.map((s) => {
              const key = `${day}-${s}`, id = plan[key], r = byId[id];
              return (
                <div className="mp-slot" key={key}>
                  <span className="app-kicker">{s}</span>
                  <button className="mp-pick" onClick={() => { setSlot(key); setQ(""); setOnlyForSlot(true); }}>
                    {r ? r.title : "+ Choose a recipe"}
                  </button>
                  {r && <button className="mp-remove" aria-label={`Remove ${r.title} from ${day} ${s}`} onClick={() => { const n = { ...plan }; delete n[key]; save(n); }}>×</button>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {slot && (
        <div className="app-panel" role="dialog" aria-label="Choose a recipe">
          <div className="mp-picker-head"><h3 style={{ marginTop: 0 }}>Choose {slot.split("-")[1]} for {slot.split("-")[0]}</h3>
            <button className="btn" onClick={() => setSlot(null)}>Close</button></div>
          <input aria-label="Search recipes" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes…" style={{ width: "100%", marginBottom: "var(--sp-3)" }} />
          <div className="app-toolbar">
            <button className={onlyForSlot ? "chip active" : "chip"} aria-pressed={onlyForSlot} onClick={() => setOnlyForSlot(true)}>Suggested for {slot.split("-")[1]}</button>
            <button className={!onlyForSlot ? "chip active" : "chip"} aria-pressed={!onlyForSlot} onClick={() => setOnlyForSlot(false)}>All recipes</button>
            <span className="app-muted">{plural(matches.length, "recipe")} shown</span>
          </div>
          {matches.length === 0 && <p className="app-muted">No suggested recipes match this search. <button className="btn-link" onClick={() => { setOnlyForSlot(false); }}>Show all recipes</button></p>}
          <div className="mp-results">{matches.map((r) => <button key={r.meta.id} onClick={() => { save({ ...plan, [slot]: r.meta.id }); setSlot(null); }}>{r.title}</button>)}</div>
        </div>
      )}

      <div className="app-grid-2" style={{ marginTop: "var(--sp-5)" }}>
        <div className="app-panel mp-list">
          <h3 style={{ marginTop: 0 }}>Shopping list · by aisle</h3>
          {shopping.length === 0 ? <p className="app-muted">Plan a meal to build the list.</p> : shopping.map(({ aisle, items }) => (
            <div key={aisle} className="mp-aisle">
              <h4>{aisle}</h4>
              <ul>{items.map((i) => {
                const key = `${i.item}|${i.unit}`;
                return <li key={key}><label><input type="checkbox" checked={!!checked[key]} onChange={(e) => setChecked({ ...checked, [key]: e.target.checked })} />
                  <span className={checked[key] ? "mp-done" : ""}>{fmtAmount(i.amount)} {i.unit} {i.item.replace(/-/g, " ")}</span></label></li>;
              })}</ul>
            </div>
          ))}
        </div>
        <div className="app-panel">
          <h3 style={{ marginTop: 0 }}>Use up an ingredient</h3>
          <label className="app-muted">What do you have too much of?
            <select value={useId} onChange={(e) => setUseId(e.target.value)} style={{ display: "block", marginTop: 4 }}>
              <option value="">Choose an ingredient…</option>
              {aisles?.ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></label>
          {useId && <div className="mp-results" style={{ marginTop: "var(--sp-3)" }}>
            {useRecipes.length ? useRecipes.map((r) => <button key={r.meta.id} onClick={() => { setSlot("any-recipe"); setQ(r.title); }}>{r.title}</button>) : <p className="app-muted">No recipes found for that ingredient.</p>}
          </div>}
          <p className="app-muted" style={{ marginTop: "var(--sp-4)" }}>Amounts are scaled from the published recipe for {household} people. Check the recipe itself for cooking times and pan sizes.</p>
        </div>
      </div>

      <p className="app-attribution">
        Recipes and ingredient guides adapted from <a href="https://teddyrookbook.com/meal-prep/" target="_blank" rel="noreferrer">Teddy Rook Book — Meal Prep</a> · CC BY-NC 4.0 · nutrition data USDA
      </p>
    </section>
  );
}
