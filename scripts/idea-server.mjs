// Tiny local idea collector for IdeaBox. No accounts, no framework.
// POST /ideas  { role, text, at }   GET /ideas -> stored ideas
// Hardening: origins are allow-listed and, when IDEA_TOKEN is set, a bearer
// token is required. Both are optional so local development still works.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DB = path.resolve(here, "..", "ideas.json");
const PORT = Number(process.env.IDEA_PORT || 8787);
const TOKEN = process.env.IDEA_TOKEN || "";
const ALLOWED = new Set(
  (process.env.IDEA_ORIGINS || "http://localhost:4173,http://localhost:5173,http://127.0.0.1:4173,http://127.0.0.1:5173")
    .split(",").map((s) => s.trim()).filter(Boolean),
);

const read = () => { try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return []; } };
const write = (items) => fs.writeFileSync(DB, JSON.stringify(items.slice(-500), null, 2));
const deny = (res, code, msg) => res.writeHead(code, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, error: msg }));

http.createServer((req, res) => {
  const origin = req.headers.origin || "";
  if (origin && !ALLOWED.has(origin)) return deny(res, 403, "Origin not allowed");
  res.setHeader("Access-Control-Allow-Origin", origin || [...ALLOWED][0]);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }

  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) return deny(res, 401, "Unauthorized");

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
        items.push({ role: String(idea.role || "Curious").slice(0, 60), text: idea.text.slice(0, 2000), at: new Date().toISOString() });
        write(items);
        res.writeHead(201, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, count: items.length }));
      } catch (e) { deny(res, 400, String(e)); }
    });
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`Idea endpoint listening on http://localhost:${PORT}/ideas`));
