import { useEffect, useState } from "react";
import { plural } from "../utils/plural";

const BASE = import.meta.env.BASE_URL;
const SECTIONS = [
  { id: "shell", name: "App shell", desc: "Styles, scripts and the home view", urls: ["./", "./index.html", "./styles.css"] },
  { id: "words", name: "Daily word puzzle", desc: "The Greek and Latin word deck", urls: ["content/apps/words.json"] },
  { id: "connections", name: "Connections", desc: "All 31 cross-subject regions", urls: ["content/apps/connections.json"] },
  { id: "puzzles", name: "Brain puzzles", desc: "Puzzle families and anagram words", urls: ["content/apps/puzzles.json", "content/apps/words.json"] },
  { id: "debate", name: "Debate tools", desc: "Formats and the 50 resolutions", urls: ["content/apps/debate-formats.json", "content/data/debate.json"] },
  { id: "meals", name: "Meal planner", desc: "Recipes and ingredient aisles", urls: ["content/data/recipes.json", "content/apps/aisles.json"] },
  { id: "life", name: "Life skills", desc: "The 34 Being an Adult guides", urls: ["content/apps/life-skills.json"] },
  { id: "paths", name: "Reading paths & timeline", desc: "Paths and ancient-world events", urls: ["content/apps/reading-paths.json", "content/data/timeline.json"] },
  { id: "languages", name: "Language lab", desc: "Passages and every word form", urls: ["content/apps/language.json", "content/apps/words.json"] },
  { id: "school", name: "Homeschool planner", desc: "Planner subjects and placement checks", urls: ["content/apps/school.json"] },
  { id: "ladders", name: "All 20 ladders", desc: "Course lists, skill graph and generators", urls: ["content/catalog.json", "content/graph.json", "content/courses-index.json"] },
];

const EMBEDS = [
  { key: "practice-topic", title: "Practice one topic", path: "/embed/practice/", query: "topic=g3.add-within-1000", height: 560, text: "Problems for one ladder topic, checked as you go, with the lesson a tap away.", input: "topic", label: "Topic id" },
  { key: "practice-course", title: "Practice a whole course", path: "/embed/practice/", query: "course=alg1", height: 620, text: "The ladder's own practice for one course: new topics, mixed reviews and checkpoints.", input: "course", label: "Course key" },
  { key: "word", title: "Vocabulary word of the day", path: "/embed/word/", query: "", height: 600, text: "One word from the Vocabulary Ladder each day, with its picture and memory hook.", input: "word", label: "Word (optional)" },
  { key: "reading", title: "Today's Harvard Classics reading", path: "/embed/reading/", query: "", height: 420, text: "The day's fifteen-minute reading, with a link to the full text.", input: "", label: "" },
  { key: "lang-word", title: "Greek or Latin word of the day", path: "/embed/lang-word/", query: "lang=grc", height: 560, text: "One common word from the Gospels each day, with a real form and a verse.", input: "lang", label: "grc or lat" },
  { key: "alphabet", title: "Greek alphabet practice", path: "/embed/alphabet/", query: "", height: 520, text: "Practise the Greek alphabet in the browser.", input: "", label: "" },
  { key: "cartouche", title: "Write your name in hieroglyphs", path: "/embed/hieroglyphs/", query: "", height: 520, text: "A cartouche maker for Egyptian hieroglyphs.", input: "", label: "" },
];

const ONLINE = [
  { name: "Markets & Economy", url: "https://teddyrookbook.com/markets/", desc: "Stock screener, charts, economic calendar, 80+ indicators, Treasuries, forex, Bitcoin, VIX and calculators.", icon: "📈" },
  { name: "Science Lab", url: "https://teddyrookbook.com/science-lab/", desc: "Simulations on real physics, chemistry and biology, with missions and lessons.", icon: "⚗️" },
  { name: "Music courses", url: "https://teddyrookbook.com/music/", desc: "Piano, guitar, ukulele and banjo, reading music, and 62 songs with synced scores.", icon: "🎹" },
  { name: "All games", url: "https://teddyrookbook.com/games/", desc: "Festival Tycoon, Hero's Road, the board games of antiquity and more.", icon: "🎲" },
];

export default function OfflineApp({ initialTab = "offline" }: { initialTab?: "offline" | "embeds" | "online" }) {
  const [tab, setTab] = useState<"offline" | "embeds" | "online">(initialTab);
  const [chosen, setChosen] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("trb-offline-sections") || "[]"); } catch { return []; } });
  const [status, setStatus] = useState("");
  const [embedKey, setEmbedKey] = useState(EMBEDS[0].key);
  const [param, setParam] = useState(EMBEDS[0].query.split("=")[1] ?? "");
  const [theme, setTheme] = useState("auto");

  useEffect(() => { try { localStorage.setItem("trb-offline-sections", JSON.stringify(chosen)); } catch { /* private */ } }, [chosen]);
  const embed = EMBEDS.find((e) => e.key === embedKey)!;
  const snippet = (() => {
    const qs = new URLSearchParams(embed.query);
    if (embed.input) qs.set(embed.input, param);
    qs.set("theme", theme);
    return `<iframe src="https://teddyrookbook.com${embed.path}?${qs.toString()}" width="100%" height="${embed.height}" title="${embed.title}" loading="lazy" style="border:0"></iframe>`;
  })();

  const save = async () => {
    const urls = SECTIONS.filter((s) => chosen.includes(s.id)).flatMap((s) => s.urls).map((u) => new URL(BASE + u, location.href).href);
    const reg = await navigator.serviceWorker?.ready.catch(() => null);
    if (reg?.active) {
      reg.active.postMessage({ urls });
      setStatus(`Saved ${plural(urls.length, "file")} to this device. Open the app again with no connection to check.`);
    } else {
      setStatus(`Your browser has no service worker here (e.g. dev mode). Download the list instead, or open the built site over HTTPS.`);
    }
  };
  const download = () => {
    const urls = SECTIONS.filter((s) => chosen.includes(s.id)).flatMap((s) => s.urls).map((u) => BASE + u);
    const blob = new Blob([JSON.stringify({ saved: new Date().toISOString(), urls }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "curiousity-offline-list.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="app-section" aria-labelledby="offline-title">
      <p className="eyebrow">OFFLINE · EMBEDS · ONLINE PANELS</p>
      <h2 id="offline-title" className="app-heading">Take it with you, or use it elsewhere</h2>
      <p className="app-lead">The app is static: no accounts, no server, no sign-up. Keep the parts you use most on this device, drop a practice widget into your co-op's site, or open the live dashboards that need an internet connection.</p>

      <div className="app-toolbar" role="group" aria-label="Offline tool">
        <button className={tab === "offline" ? "chip active" : "chip"} aria-pressed={tab === "offline"} onClick={() => setTab("offline")}>Use offline</button>
        <button className={tab === "embeds" ? "chip active" : "chip"} aria-pressed={tab === "embeds"} onClick={() => setTab("embeds")}>Embeds</button>
        <button className={tab === "online" ? "chip active" : "chip"} aria-pressed={tab === "online"} onClick={() => setTab("online")}>Online panels</button>
      </div>

      {tab === "offline" && (
        <div className="app-panel">
          <h3 style={{ marginTop: 0 }}>Choose what to keep offline</h3>
          <p className="app-muted">The app shell is always needed. Tick the sections you use, then save them. Clearing a choice does not delete files already cached.</p>
          <div className="of-list">{SECTIONS.map((s) => <label key={s.id}><input type="checkbox" checked={chosen.includes(s.id)} onChange={(e) => setChosen(e.target.checked ? [...chosen, s.id] : chosen.filter((x) => x !== s.id))} />
            <span><b>{s.name}</b><small>{s.desc}</small></span></label>)}</div>
          <div className="app-toolbar"><button className="btn-primary" onClick={save}>Save to this device</button>
            <button className="btn" onClick={download}>Download section list</button>
            <span className="app-muted">{plural(chosen.length, "section")} chosen</span></div>
          {status && <p className="app-feedback" role="status">{status}</p>}
        </div>
      )}

      {tab === "embeds" && (
        <div className="app-panel">
          <h3 style={{ marginTop: 0 }}>One line of HTML for your site</h3>
          <p className="app-muted">These embeds are served by Teddy Rook Book, so they get every new lesson and fix on their own. They always show a small link back.</p>
          <div className="app-toolbar"><label>Widget
            <select value={embedKey} onChange={(e) => { setEmbedKey(e.target.value); const x = EMBEDS.find((y) => y.key === e.target.value)!; setParam(x.query.split("=")[1] ?? ""); }}>
              {EMBEDS.map((e) => <option key={e.key} value={e.key}>{e.title}</option>)}
            </select></label>
            {embed.input && <label>{embed.label}<input value={param} onChange={(e) => setParam(e.target.value)} /></label>}
            <label>Theme<select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
          </div>
          <p style={{ color: "var(--ink-2)" }}>{embed.text}</p>
          <pre className="of-snippet"><code>{snippet}</code></pre>
          <button className="btn" onClick={() => navigator.clipboard?.writeText(snippet)}>Copy snippet</button>
        </div>
      )}

      {tab === "online" && (
        <div className="app-panel">
          <p className="app-muted">These need a connection and stay outside the offline core. They open the original pages on Teddy Rook Book.</p>
          <div className="of-online">{ONLINE.map((o) => <a key={o.name} className="app-card" href={o.url} target="_blank" rel="noreferrer">
            <span className="app-card-icon">{o.icon}</span><b>{o.name}</b><span>{o.desc}</span><span className="app-card-cta">Open on Teddy Rook Book →</span>
          </a>)}</div>
        </div>
      )}

      <p className="app-attribution">
        Embed contract from <a href="https://teddyrookbook.com/developers/" target="_blank" rel="noreferrer">Teddy Rook Book — For Developers</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
