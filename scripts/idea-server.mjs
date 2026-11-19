// Tiny local idea collector for IdeaBox. No accounts, no framework.
// POST /ideas  { role, text, at }   GET /ideas -> stored ideas
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DB = path.resolve(here, "..", "ideas.json");
const PORT = Number(process.env.IDEA_PORT || 8787);

const read = () => { try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return []; } };
const write = (items) => fs.writeFileSync(DB, JSON.stringify(items.slice(-500), null, 2));

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  if (req.method === "GET" && req.url === "/ideas") {
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(read()));
    return;
  }
  if (req.method === "POST" && req.url === "/ideas") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 10000) req.destroy(); });
    req.on("end", () => {
      try {
        const idea = JSON.parse(body);
        if (!idea.text || typeof idea.text !== "string") throw new Error("text required");
        const items = read();
        items.push({ role: idea.role || "Curious", text: idea.text.slice(0, 2000), at: idea.at || new Date().toISOString() });
        write(items);
        res.writeHead(201, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, count: items.length }));
      } catch (e) { res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, error: String(e) })); }
    });
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`Idea endpoint listening on http://localhost:${PORT}/ideas`));
