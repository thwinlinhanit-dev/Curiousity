import { useEffect, useMemo, useRef, useState } from "react";
import { plural } from "../utils/plural";

const rand = Math.random;

function Galton() {
  const [balls, setBalls] = useState(0);
  const bins = useRef<number[]>(Array(9).fill(0));
  const cv = useRef<HTMLCanvasElement | null>(null);
  const drop = () => {
    let slot = 0; for (let i = 0; i < 8; i++) slot += rand() < 0.5 ? 0 : 1;
    bins.current[slot]++; setBalls((n) => n + 1);
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, bw = W / 9;
    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < 8; r++) for (let c = 0; c <= r; c++) {
      ctx.fillStyle = "#5f656b"; ctx.beginPath(); ctx.arc(W / 2 + (c - r / 2) * 34, 60 + r * 32, 3, 0, 7); ctx.fill();
    }
    const max = Math.max(1, ...bins.current);
    bins.current.forEach((n, i) => { ctx.fillStyle = "#2e6fb7"; ctx.fillRect(i * bw + 4, H - 20 - (n / max) * (H - 80), bw - 8, (n / max) * (H - 80)); });
  };
  useEffect(() => { const ctx = cv.current?.getContext("2d"); if (!ctx) return; const W = ctx.canvas.width; ctx.clearRect(0, 0, 640, 320); for (let r = 0; r < 8; r++) for (let c = 0; c <= r; c++) { ctx.fillStyle = "#5f656b"; ctx.beginPath(); ctx.arc(W / 2 + (c - r / 2) * 34, 60 + r * 32, 3, 0, 7); ctx.fill(); } }, []);
  return <>
    <p className="app-muted">Balls bounce left or right at every peg. The heap in the bins is the binomial distribution — the bell curve emerging from simple random choices.</p>
    <canvas ref={cv} width={640} height={320} className="sim-canvas" />
    <div className="app-toolbar"><button className="btn-primary" onClick={drop}>Drop a ball</button><button className="btn" onClick={() => { for (let i = 0; i < 100; i++) drop(); }}>Drop 100</button><span className="app-muted">{plural(balls, "ball")}</span></div>
  </>;
}

function Monty() {
  const [n, setN] = useState(500), [res, setRes] = useState<{ switchWin: number; stayWin: number } | null>(null);
  const run = () => {
    let sw = 0, st = 0;
    for (let i = 0; i < n; i++) {
      const car = Math.floor(rand() * 3), pick = Math.floor(rand() * 3);
      if (pick === car) st++; else sw++; // switching wins exactly when the first pick was wrong
    }
    setRes({ switchWin: sw / n, stayWin: st / n });
  };
  return <>
    <p className="app-muted">Pick a door; the host opens a goat door. Should you switch? Simulate it — switching wins whenever your first pick was wrong, which is two times in three.</p>
    <div className="app-toolbar"><label>Trials <input type="number" min={10} max={20000} value={n} onChange={(e) => setN(Number(e.target.value))} /></label><button className="btn-primary" onClick={run}>Simulate</button></div>
    {res && <div className="app-panel"><p><b>Switch and win: {(res.switchWin * 100).toFixed(1)}%</b></p><p><b>Stay and win: {(res.stayWin * 100).toFixed(1)}%</b></p></div>}
  </>;
}

function Buffon() {
  const [n, setN] = useState(2000), [pi, setPi] = useState<number | null>(null);
  const run = () => {
    let hits = 0;
    for (let i = 0; i < n; i++) { const y = rand(), a = rand() * Math.PI; if (y <= 0.5 * Math.sin(a)) hits++; }
    setPi(hits === 0 ? 0 : (2 * n) / hits);
  };
  return <>
    <p className="app-muted">Drop needles on parallel lines. The chance of crossing a line is 2/π — so counting crossings estimates π without measuring a circle.</p>
    <div className="app-toolbar"><label>Needles <input type="number" min={100} max={100000} value={n} onChange={(e) => setN(Number(e.target.value))} /></label><button className="btn-primary" onClick={run}>Drop needles</button></div>
    {pi !== null && <p className="app-feedback">π ≈ <b className="tabular">{pi.toFixed(4)}</b> <span className="app-muted">from {n.toLocaleString()} needles (true π = 3.14159…)</span></p>}
  </>;
}

function Collatz() {
  const [start, setStart] = useState(27), [seq, setSeq] = useState<number[]>([]);
  const run = () => { const xs = [start]; let x = start; for (let i = 0; i < 500 && x !== 1; i++) { x = x % 2 === 0 ? x / 2 : 3 * x + 1; xs.push(x); } setSeq(xs); };
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx || seq.length < 2) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.clearRect(0, 0, W, H);
    const mx = Math.max(...seq); ctx.strokeStyle = "#a8321f"; ctx.lineWidth = 2; ctx.beginPath();
    seq.forEach((v, i) => { const x = (i / (seq.length - 1)) * W, y = H - (v / mx) * (H - 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.fillStyle = "#1a1d21"; ctx.font = "13px monospace"; ctx.fillText(`${seq.length} steps · peak ${mx}`, 12, 22);
  }, [seq]);
  return <>
    <p className="app-muted">Halve even numbers, triple-and-add one for odd ones. Every start seems to reach 1 — nobody has proved why.</p>
    <div className="app-toolbar"><label>Start <input type="number" min={1} max={100000} value={start} onChange={(e) => setStart(Number(e.target.value))} /></label><button className="btn-primary" onClick={run}>Trace it</button></div>
    <canvas ref={cv} width={640} height={300} className="sim-canvas" />
  </>;
}

function DoublePendulum() {
  const [running, setRunning] = useState(true);
  const s = useRef({ a1: 2, a2: 2, w1: 0, w2: 0 });
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    let f = 0, last = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      if (running) {
        const q = s.current, g = 9.81, L = 1, m = 1;
        const d = q.a1 - q.a2;
        const den = 2 * m * L * (1 - Math.cos(2 * d));
        const a1 = (-g * (2 * m + m) * Math.sin(q.a1) - m * g * Math.sin(q.a1 - 2 * q.a2) - 2 * Math.sin(d) * m * (q.w2 * q.w2 * L + q.w1 * q.w1 * L * Math.cos(d))) / den;
        const a2 = (2 * Math.sin(d) * (q.w1 * q.w1 * L * (m + m) + g * (m + m) * Math.cos(q.a1) + q.w2 * q.w2 * L * m * Math.cos(d))) / den;
        q.w1 += a1 * dt; q.w2 += a2 * dt; q.a1 += q.w1 * dt; q.a2 += q.w2 * dt;
      }
      const W = ctx.canvas.width, H = ctx.canvas.height, cx = W / 2, cy = 120, L = 90;
      const q = s.current, x1 = cx + L * Math.sin(q.a1), y1 = cy + L * Math.cos(q.a1), x2 = x1 + L * Math.sin(q.a2), y2 = y1 + L * Math.cos(q.a2);
      ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = "#1a1d21";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = "#a8321f"; ctx.beginPath(); ctx.arc(x2, y2, 8, 0, 7); ctx.fill();
      f = requestAnimationFrame(loop);
    };
    f = requestAnimationFrame(loop); return () => cancelAnimationFrame(f);
  }, [running]);
  return <>
    <p className="app-muted">Two coupled pendulums: a tiny change in the starting angle produces a completely different path. This is chaos, drawn from Newton's equations.</p>
    <canvas ref={cv} width={640} height={320} className="sim-canvas" />
    <div className="app-toolbar"><button className="btn" onClick={() => setRunning(!running)}>{running ? "❚❚ Pause" : "▶ Play"}</button>
      <button className="btn" onClick={() => { s.current = { a1: 2.001, a2: 2, w1: 0, w2: 0 }; }}>Perturb by 0.001</button></div>
  </>;
}

function Logistic() {
  const [r, setR] = useState(3.2); const n = 160;
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.clearRect(0, 0, W, H);
    let x = 0.2;
    for (let i = 0; i < 400 + n; i++) {
      x = r * x * (1 - x);
      if (i >= 400) { const px = ((i - 400) / n) * W; ctx.fillStyle = "#2e6fb7"; ctx.fillRect(px, H - x * H, 2, 2); }
    }
  }, [r, n]);
  return <>
    <p className="app-muted">The logistic map x → r·x·(1−x). Increase r past 3 and the population splits into cycles; past 3.57, chaos. A whole route to unpredictability in one line.</p>
    <canvas ref={cv} width={640} height={300} className="sim-canvas" />
    <div className="app-toolbar"><label>Growth rate r <input type="range" min={2.5} max={4} step={0.001} value={r} onChange={(e) => setR(Number(e.target.value))} /> {r.toFixed(3)}</label></div>
  </>;
}

function Birthday() {
  const [people, setPeople] = useState(23), [trials, setTrials] = useState(5000), [p, setP] = useState<number | null>(null);
  const run = () => {
    let hit = 0;
    for (let t = 0; t < trials; t++) { const seen = new Set<number>(); let dup = false; for (let i = 0; i < people; i++) { const d = Math.floor(rand() * 365); if (seen.has(d)) { dup = true; break; } seen.add(d); } if (dup) hit++; }
    setP(hit / trials);
  };
  return <>
    <p className="app-muted">How many people before two share a birthday? Only 23 gives an even chance — because there are 253 possible pairs, not 23 comparisons.</p>
    <div className="app-toolbar"><label>People <input type="number" min={2} max={100} value={people} onChange={(e) => setPeople(Number(e.target.value))} /></label>
      <label>Trials <input type="number" min={100} max={50000} value={trials} onChange={(e) => setTrials(Number(e.target.value))} /></label>
      <button className="btn-primary" onClick={run}>Simulate</button></div>
    {p !== null && <p className="app-feedback">Matching birthday in {people} people: <b>{(p * 100).toFixed(1)}%</b> of {trials.toLocaleString()} trials</p>}
  </>;
}

function Ulam() {
  const [size, setSize] = useState(41);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, cell = Math.min(W, H) / size;
    ctx.clearRect(0, 0, W, H);
    const prime = (n: number) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
    let x = Math.floor(size / 2), y = Math.floor(size / 2), dir = 0;
    const dirs = [[1, 0], [0, -1], [-1, 0], [0, 1]];
    let stepLen = 1, taken = 0, turns = 0;
    for (let n = 1; n <= size * size; n++) {
      if (prime(n)) { ctx.fillStyle = "#a8321f"; ctx.fillRect(x * cell, y * cell, Math.max(1, cell - 1), Math.max(1, cell - 1)); }
      x += dirs[dir][0]; y += dirs[dir][1]; taken++;
      if (taken === stepLen) { taken = 0; dir = (dir + 1) % 4; turns++; if (turns % 2 === 0) stepLen++; }
    }
  }, [size]);
  return <>
    <p className="app-muted">Write numbers in a spiral and mark the primes: diagonal lines appear, a pattern nobody has explained. Try a larger grid.</p>
    <canvas ref={cv} width={420} height={420} className="sim-canvas" />
    <div className="app-toolbar"><label>Grid <input type="range" min={21} max={81} step={2} value={size} onChange={(e) => setSize(Number(e.target.value))} /> {size}×{size}</label></div>
  </>;
}

function Mandelbrot() {
  const [zoom, setZoom] = useState(1), [iter, setIter] = useState(60);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, img = ctx.createImageData(W, H);
    const scale = 3 / zoom;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const cx = (px / W - 0.5) * scale - 0.5, cy = (py / H - 0.5) * scale;
      let zx = 0, zy = 0, i = 0;
      while (zx * zx + zy * zy < 4 && i < iter) { const t = zx * zx - zy * zy + cx; zy = 2 * zx * zy + cy; zx = t; i++; }
      const k = (py * W + px) * 4, v = i === iter ? 0 : 30 + (i / iter) * 220;
      img.data[k] = v; img.data[k + 1] = v * 0.7; img.data[k + 2] = i === iter ? 20 : 255 - v * 0.4; img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [zoom, iter]);
  return <>
    <p className="app-muted">The set of points c where z → z² + c does not escape. Every zoom reveals more structure — an infinite boundary drawn from one short rule.</p>
    <canvas ref={cv} width={420} height={300} className="sim-canvas" />
    <div className="app-toolbar"><label>Zoom <input type="range" min={1} max={40} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /> {zoom}×</label>
      <label>Detail <input type="range" min={20} max={200} value={iter} onChange={(e) => setIter(Number(e.target.value))} /></label></div>
  </>;
}

function Lorenz() {
  const [rho, setRho] = useState(28);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    let x = 0.1, y = 0, z = 0; const dt = 0.006;
    ctx.strokeStyle = "#a8321f"; ctx.beginPath();
    for (let i = 0; i < 9000; i++) {
      const dx = 10 * (y - x), dy = x * (rho - z) - y, dz = x * y - (8 / 3) * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
      const px = W / 2 + x * 5, py = H / 2 + (z - 25) * 5;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }, [rho]);
  return <>
    <p className="app-muted">Three simple equations for convection produce a butterfly-shaped trajectory that never repeats. This is the original strange attractor.</p>
    <canvas ref={cv} width={640} height={400} className="sim-canvas" />
    <div className="app-toolbar"><label>Rayleigh number ρ <input type="range" min={10} max={50} value={rho} onChange={(e) => setRho(Number(e.target.value))} /> {rho}</label></div>
  </>;
}

function RandomWalk() {
  const [n, setN] = useState(400), [runs, setRuns] = useState(20);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#5f656b"; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    const colors = ["#2e6fb7", "#a8321f", "#3e7d5a", "#8a6410", "#6b3fa0"];
    for (let r = 0; r < runs; r++) {
      let x = W / 2, y = H / 2; ctx.strokeStyle = colors[r % colors.length]; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < n; i++) { const a = rand() * Math.PI * 2; x += Math.cos(a) * 3; y += Math.sin(a) * 3; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [n, runs]);
  return <>
    <p className="app-muted">A drunkard's walk: each step is a random direction, yet the cloud of paths spreads in a predictable way — the square root of the number of steps.</p>
    <canvas ref={cv} width={640} height={360} className="sim-canvas" />
    <div className="app-toolbar"><label>Steps <input type="range" min={50} max={1200} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      <label>Walks <input type="range" min={1} max={60} value={runs} onChange={(e) => setRuns(Number(e.target.value))} /></label></div>
  </>;
}

function Life() {
  const [running, setRunning] = useState(false), [gen, setGen] = useState(0);
  const grid = useRef<boolean[][]>(Array.from({ length: 30 }, () => Array(40).fill(false)));
  const cv = useRef<HTMLCanvasElement | null>(null);
  const seed = () => { grid.current = Array.from({ length: 30 }, () => Array(40).fill(false)).map((r) => r.map(() => rand() < 0.22)); setGen(0); };
  useEffect(() => { seed(); }, []);
  const step = () => {
    const g = grid.current;
    grid.current = g.map((row, y) => row.map((v, x) => {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const yy = (y + dy + 30) % 30, xx = (x + dx + 40) % 40; if (g[yy][xx]) n++; }
      return n === 3 || (v && n === 2);
    }));
    setGen(gen + 1);
  };
  useEffect(() => {
    const id = running ? setInterval(step, 90) : null; return () => { if (id) clearInterval(id); };
  });
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const cw = 12, ch = 12; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, 480, 360);
    grid.current.forEach((row, y) => row.forEach((v, x) => { if (v) { ctx.fillStyle = "#2e6fb7"; ctx.fillRect(x * cw, y * ch, cw - 1, ch - 1); } }));
  });
  return <>
    <p className="app-muted">Conway's Game of Life: a cell lives, dies or is born by counting its eight neighbours. Gliders, blinkers and still lifes emerge from pure local rules.</p>
    <canvas ref={cv} width={480} height={360} className="sim-canvas" />
    <div className="app-toolbar"><button className="btn-primary" onClick={() => setRunning(!running)}>{running ? "❚❚ Pause" : "▶ Run"}</button>
      <button className="btn" onClick={step}>Step</button><button className="btn" onClick={seed}>Randomise</button><span className="app-muted">generation {gen}</span></div>
  </>;
}

function Koch() {
  const [depth, setDepth] = useState(3);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    const seg = (x1: number, y1: number, x2: number, y2: number, d: number) => {
      if (d === 0) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); return; }
      const dx = (x2 - x1) / 3, dy = (y2 - y1) / 3;
      const ax = x1 + dx, ay = y1 + dy, bx = x2 - dx, by = y2 - dy;
      const px = ax - dy * 0.866, py = ay + dx * 0.866;
      seg(x1, y1, ax, ay, d - 1); seg(ax, ay, px, py, d - 1); seg(px, py, bx, by, d - 1); seg(bx, by, x2, y2, d - 1);
    };
    ctx.strokeStyle = "#2e6fb7"; ctx.lineWidth = 1.2;
    seg(90, 250, 390, 250, depth); seg(390, 250, 240, 70, depth); seg(240, 70, 90, 250, depth);
  }, [depth]);
  return <>
    <p className="app-muted">A snowflake curve: replace each line segment with four smaller ones. Its length grows without bound while it encloses a finite area.</p>
    <canvas ref={cv} width={480} height={300} className="sim-canvas" />
    <div className="app-toolbar"><label>Depth <input type="range" min={0} max={5} value={depth} onChange={(e) => setDepth(Number(e.target.value))} /> {depth}</label></div>
  </>;
}

function Fourier() {
  const [terms, setTerms] = useState(5);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    const path: [number, number][] = [];
    for (let t = 0; t < 6.3; t += 0.02) {
      let px = 120, py = 140;
      for (let i = 1; i <= terms * 2; i += 2) { const r = 46 / i; px += r * Math.cos(i * t); py += r * Math.sin(i * t); }
      path.push([px, py + 10]);
    }
    ctx.strokeStyle = "#a8321f"; ctx.beginPath(); path.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke();
    ctx.strokeStyle = "#5f656b"; ctx.beginPath(); ctx.moveTo(120, 140); ctx.lineTo(120, 10); ctx.stroke();
  }, [terms]);
  return <>
    <p className="app-muted">Add odd harmonics 1, 3, 5, 7… each a little smaller, and the wiggle sharpens into a square wave. This is how sound and images are rebuilt from frequencies.</p>
    <canvas ref={cv} width={420} height={280} className="sim-canvas" />
    <div className="app-toolbar"><label>Harmonics <input type="range" min={1} max={30} value={terms} onChange={(e) => setTerms(Number(e.target.value))} /> {terms}</label></div>
  </>;
}

function Sunflower() {
  const [n, setN] = useState(500), [angle, setAngle] = useState(137.5);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const a = i * angle * Math.PI / 180, r = 3.2 * Math.sqrt(i);
      ctx.fillStyle = i % 8 === 0 ? "#a8321f" : "#3e7d5a";
      ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, 2.4, 0, 7); ctx.fill();
    }
  }, [n, angle]);
  return <>
    <p className="app-muted">Seeds spiral out from the centre at a fixed angle. 137.5° — the golden angle — packs them most tightly and gives sunflowers their famous interlaced spirals.</p>
    <canvas ref={cv} width={420} height={320} className="sim-canvas" />
    <div className="app-toolbar"><label>Angle <input type="range" min={130} max={145} step={0.1} value={angle} onChange={(e) => setAngle(Number(e.target.value))} /> {angle.toFixed(1)}°</label>
      <label>Seeds <input type="range" min={100} max={1500} value={n} onChange={(e) => setN(Number(e.target.value))} /></label></div>
  </>;
}

function Ford() {
  const [max, setMax] = useState(12);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, scale = W / max; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1a1d21"; ctx.beginPath(); ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); ctx.stroke();
    for (let q = 1; q <= max; q++) for (let p = 0; p <= q; p++) {
      if (p && requireGcd(p, q) !== 1) continue;
      const x = p * scale, r = scale / (2 * q * q), y = H - 30 - r;
      ctx.strokeStyle = "#2e6fb7"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    }
  }, [max]);
  const requireGcd = (a: number, b: number): number => b ? requireGcd(b, a % b) : a;
  return <>
    <p className="app-muted">One circle for every fraction p/q, with radius 1/(2q²). Neighbouring circles touch exactly when the fractions are Farey neighbours — a picture of rational numbers.</p>
    <canvas ref={cv} width={420} height={280} className="sim-canvas" />
    <div className="app-toolbar"><label>Max denominator <input type="range" min={4} max={30} value={max} onChange={(e) => setMax(Number(e.target.value))} /> {max}</label></div>
  </>;
}

function Hilbert() {
  const [depth, setDepth] = useState(4);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = 400, H = 400, pts: [number, number][] = [];
    const d2xy = (d: number, n: number): [number, number] => {
      let rx = 0, ry = 0, t = d;
      for (let s = 1; s < n; s *= 2) {
        rx = 1 & (t / 2); ry = 1 & (t ^ rx);
        if (ry === 0) { if (rx === 1) { t = s * s - 1 - t; } [rx, ry] = [ry, rx]; }
        t = Math.floor(t / 4);
      }
      return [rx, ry];
    };
    const n = 2 ** depth;
    for (let d = 0; d < n * n; d++) { const [a, b] = d2xy(d, n); pts.push([a * W / n + 5, b * H / n + 5]); }
    ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#2e6fb7"; ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke();
  }, [depth]);
  return <>
    <p className="app-muted">A curve that visits every point of a square. As the order rises it fills more of the area — a rigorous answer to “how long is a coastline?”</p>
    <canvas ref={cv} width={400} height={400} className="sim-canvas" />
    <div className="app-toolbar"><label>Order <input type="range" min={1} max={6} value={depth} onChange={(e) => setDepth(Number(e.target.value))} /> {depth}</label></div>
  </>;
}

function Hypercube() {
  const [rot, setRot] = useState(0.5);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = 420, H = 360, cx = W / 2, cy = H / 2; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    const verts: number[][] = [];
    for (let i = 0; i < 16; i++) verts.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    const proj = (v: number[]) => {
      const a = rot, b = rot * 0.6;
      const x1 = v[0] * Math.cos(a) - v[3] * Math.sin(a), z1 = v[0] * Math.sin(a) + v[3] * Math.cos(a);
      const y1 = v[1] * Math.cos(b) - z1 * Math.sin(b), z2 = v[1] * Math.sin(b) + z1 * Math.cos(b);
      const k = 2.4 / (2.4 + z2 * 0.6);
      return [cx + x1 * 70 * k, cy + y1 * 70 * k];
    };
    const pts = verts.map(proj);
    ctx.strokeStyle = "#2e6fb7";
    verts.forEach((v, i) => v.forEach((val, d) => { if (val === 1) { const j = i ^ (1 << d); ctx.beginPath(); ctx.moveTo(...(pts[i] as [number, number])); ctx.lineTo(...(pts[j] as [number, number])); ctx.stroke(); } }));
  }, [rot]);
  return <>
    <p className="app-muted">A four-dimensional cube projected to the screen. Rotate it and watch the inner cube appear to turn inside out — the 4D analogue of a wireframe box.</p>
    <canvas ref={cv} width={420} height={360} className="sim-canvas" />
    <div className="app-toolbar"><label>Rotation <input type="range" min={0} max={3.1} step={0.05} value={rot} onChange={(e) => setRot(Number(e.target.value))} /></label></div>
  </>;
}

function Mobius() {
  const [twists, setTwists] = useState(1);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = 420, H = 320, cx = W / 2, cy = H / 2; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = twists === 1 ? "#a8321f" : "#2e6fb7";
    for (let v = -0.35; v <= 0.35; v += 0.07) {
      ctx.beginPath();
      for (let t = 0; t <= 6.3; t += 0.03) {
        const half = twists * t / 2, R = 110 + v * Math.cos(half);
        const x = cx + R * Math.cos(t), y = cy + R * Math.sin(t) * 0.55 + v * Math.sin(half) * 60;
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [twists]);
  return <>
    <p className="app-muted">A Möbius strip has only one side and one edge. Trace a line down the middle: after one lap you are on the “other” side, and after two you return to the start.</p>
    <canvas ref={cv} width={420} height={320} className="sim-canvas" />
    <div className="app-toolbar"><label>Half-twists <input type="range" min={1} max={3} value={twists} onChange={(e) => setTwists(Number(e.target.value))} /> {twists}</label></div>
  </>;
}

function Konigsberg() {
  return <>
    <p className="app-muted">Can you cross each of the seven bridges of Königsberg exactly once? Euler proved no — and invented graph theory doing it. Count the odd-degree islands.</p>
    <div className="graph-box">
      <div className="graph-node" style={{ left: "18%", top: "30%" }}>North</div>
      <div className="graph-node" style={{ left: "18%", top: "70%" }}>South</div>
      <div className="graph-node" style={{ left: "70%", top: "22%" }}>Kneiphof</div>
      <div className="graph-node" style={{ left: "70%", top: "78%" }}>Lomse</div>
    </div>
    <div className="app-panel"><p>Degrees: North 3 · South 3 · Kneiphof 5 · Lomse 3 — four odd vertices.</p>
      <p className="app-muted">A route using every edge once exists only with 0 or 2 odd vertices. Here there are 4, so it is impossible.</p></div>
  </>;
}

function Brachistochrone() {
  const [cyc, setCyc] = useState(true);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = 420, H = 300, x0 = 30, y0 = 30, x1 = 380, y1 = 230;
    ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#5f656b"; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = cyc ? "#a8321f" : "#2e6fb7"; ctx.beginPath();
    const R = 130;
    for (let a = 0; a <= 2.4; a += 0.02) { const x = x0 + R * (a - Math.sin(a)), y = y0 + R * (1 - Math.cos(a)); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = "#1a1d21"; ctx.font = "13px monospace";
    ctx.fillText(cyc ? "cycloid — fastest descent" : "straight line — shortest but slower", 20, 280);
  }, [cyc]);
  return <>
    <p className="app-muted">The shortest path is a straight line, but the fastest is a cycloid: it drops steeply first to gain speed. Galileo got this wrong; Bernoulli proved it in 1696.</p>
    <canvas ref={cv} width={420} height={300} className="sim-canvas" />
    <div className="app-toolbar"><button className="btn" onClick={() => setCyc(!cyc)}>{cyc ? "Show straight line" : "Show cycloid"}</button></div>
  </>;
}

function Schelling() {
  const [tolerance, setTolerance] = useState(35), [step, setStep] = useState(0);
  const grid = useMemo(() => Array.from({ length: 20 }, () => Array(20).fill(0).map(() => Math.random() < 0.5 ? 1 : 2)), []);
  const similar = () => {
    let ok = 0;
    grid.forEach((row, y) => row.forEach((v, x) => {
      let same = 0, total = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const yy = (y + dy + 20) % 20, xx = (x + dx + 20) % 20; total++; if (grid[yy][xx] === v) same++; }
      if (same / total * 100 >= tolerance) ok++;
    }));
    return Math.round(ok / 400 * 100);
  };
  const pct = similar();
  return <>
    <p className="app-muted">Even a mild preference for similar neighbours produces strong segregation. This is Schelling's model: individual choices add up to a pattern nobody planned.</p>
    <div className="app-panel"><p>Happy with their neighbourhood: <b>{pct}%</b> <span className="app-muted">at {tolerance}% tolerance, round {step}</span></p></div>
    <div className="app-toolbar"><label>Tolerance <input type="range" min={10} max={70} value={tolerance} onChange={(e) => { setTolerance(Number(e.target.value)); setStep(step + 1); }} /> {tolerance}%</label>
      <button className="btn" onClick={() => setStep(step + 1)}>Shuffle again</button></div>
    <p className="app-muted"><b>Try this:</b> raise tolerance to 60% and watch how quickly the pattern locks in.</p>
  </>;
}

function Colliding() {
  const [big, setBig] = useState(100);
  const digits = Math.floor(Math.PI * big) * 0 + String(Math.PI).replace(".", "").slice(0, Math.min(12, String(big).length + 3));
  return <>
    <p className="app-muted">A heavy block hits a light one against a wall. Count the collisions: the number of hits spells out π. A mechanical calculator hidden in Newton's cradle.</p>
    <div className="app-toolbar"><label>Mass ratio (16ⁿ) <input type="range" min={1} max={5} value={big} onChange={(e) => setBig(Number(e.target.value))} /> 16^{big}</label></div>
    <div className="app-panel"><span className="app-kicker">COLLISIONS</span><b style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-4)" }}>{digits}</b>
      <p className="app-muted">{big === 1 ? "3 collisions — the first digit of π" : "each factor of 16 reveals another digit"}</p></div>
  </>;
}

const PIECES = [
  { id: "galton", name: "Galton board", icon: "🔵", comp: Galton },
  { id: "logistic", name: "Logistic map", icon: "📈", comp: Logistic },
  { id: "birthday", name: "Birthday problem", icon: "🎂", comp: Birthday },
  { id: "ulam", name: "Ulam spiral", icon: "✨", comp: Ulam },
  { id: "mandelbrot", name: "Mandelbrot", icon: "🌀", comp: Mandelbrot },
  { id: "lorenz", name: "Lorenz attractor", icon: "🦋", comp: Lorenz },
  { id: "walk", name: "Random walk", icon: "🚶", comp: RandomWalk },
  { id: "life", name: "Game of Life", icon: "🧬", comp: Life },
  { id: "koch", name: "Koch snowflake", icon: "❄️", comp: Koch },
  { id: "fourier", name: "Fourier epicycles", icon: "〰️", comp: Fourier },
  { id: "sunflower", name: "Golden-angle sunflower", icon: "🌻", comp: Sunflower },
  { id: "ford", name: "Ford circles", icon: "⭕", comp: Ford },
  { id: "hilbert", name: "Hilbert curve", icon: "🌀", comp: Hilbert },
  { id: "hypercube", name: "4-D hypercube", icon: "🧊", comp: Hypercube },
  { id: "mobius", name: "Möbius strip", icon: "♾️", comp: Mobius },
  { id: "konigsberg", name: "Königsberg bridges", icon: "🌉", comp: Konigsberg },
  { id: "brachistochrone", name: "Brachistochrone", icon: "🎢", comp: Brachistochrone },
  { id: "schelling", name: "Schelling segregation", icon: "🏘️", comp: Schelling },
  { id: "colliding", name: "Colliding blocks π", icon: "🔢", comp: Colliding },
  { id: "monty", name: "Monty Hall", icon: "🚪", comp: Monty },
  { id: "buffon", name: "Buffon's needle", icon: "📏", comp: Buffon },
  { id: "collatz", name: "Collatz", icon: "🌀", comp: Collatz },
  { id: "pendulum", name: "Double pendulum", icon: "🎢", comp: DoublePendulum },
];

export default function Gallery() {
  const [id, setId] = useState("galton");
  const Piece = PIECES.find((p) => p.id === id)!.comp;
  return (
    <section className="app-section" aria-labelledby="gal-title">
      <p className="eyebrow">MATH GALLERY · INTERACTIVE PICTURES</p>
      <h2 id="gal-title" className="app-heading">Pictures you can play with</h2>
      <p className="app-lead">Small deterministic experiments from the live Math Gallery: probability, chaos and number theory drawn in your browser.</p>
      <div className="app-toolbar" role="group" aria-label="Gallery piece">{PIECES.map((p) => <button key={p.id} className={id === p.id ? "chip active" : "chip"} aria-pressed={id === p.id} onClick={() => setId(p.id)}>{p.icon} {p.name}</button>)}</div>
      <div className="app-panel"><Piece key={id} /></div>
      <p className="app-attribution">Adapted from <a href="https://teddyrookbook.com/math/gallery/" target="_blank" rel="noreferrer">Teddy Rook Book — Math Gallery</a> · CC BY-NC 4.0</p>
    </section>
  );
}
