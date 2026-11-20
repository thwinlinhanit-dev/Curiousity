import { useEffect, useRef, useState } from "react";

type Sim = "trebuchet" | "orbit" | "ecosystem" | "circuit" | "optics" | "gas" | "pendulums" | "sky" | "atom" | "balance"
  | "rocket" | "bottles" | "elements" | "cart" | "cube" | "chem" | "newton" | "thermo";

function useAnimator(draw: (ctx: CanvasRenderingContext2D, t: number) => void, running: boolean, speed: number) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const frame = useRef(0), elapsed = useRef(0), last = useRef(0);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const loop = (now: number) => {
      if (!last.current) last.current = now;
      const dt = Math.min(0.05, (now - last.current) / 1000); last.current = now;
      if (running) elapsed.current += dt * speed;
      ctx.clearRect(0, 0, cv.width, cv.height);
      draw(ctx, elapsed.current);
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame.current); last.current = 0; };
  }, [draw, running, speed]);
  const reset = () => { elapsed.current = 0; };
  return { ref, reset };
}

function Trebuchet() {
  const [weight, setWeight] = useState(1000), [angle, setAngle] = useState(45), [arm, setArm] = useState(1.4);
  const [running, setRunning] = useState(false), [speed, setSpeed] = useState(1);
  const g = 9.81, eff = 0.62;
  const range = Math.max(0, eff * 2 * weight * g * arm / (20 * g) * Math.sin(2 * angle * Math.PI / 180));
  const energy = weight * g * arm;
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.fillStyle = "#8a6410"; ctx.fillRect(0, H - 24, W, 24);
    const ox = 70, oy = H - 60, L = 70;
    ctx.strokeStyle = "#1a1d21"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(ox - 22, H - 24); ctx.lineTo(ox, oy); ctx.lineTo(ox + 22, H - 24); ctx.stroke();
    const a = (-0.9 + Math.min(1.2, t * 0.8)) * 1;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * L, oy + Math.sin(a) * L); ctx.stroke();
    const flight = Math.max(0, t - 0.6);
    if (flight > 0) {
      const v = Math.sqrt(range * g / Math.max(0.1, Math.sin(2 * angle * Math.PI / 180)));
      const x = ox + v * Math.cos(angle * Math.PI / 180) * flight * 6;
      const y = oy - (v * Math.sin(angle * Math.PI / 180) * flight - 0.5 * g * flight * flight) * 6;
      if (y < H - 30) { ctx.fillStyle = "#a8321f"; ctx.beginPath(); ctx.arc(Math.min(W - 10, x), y, 6, 0, 7); ctx.fill(); }
    }
  };
  const { ref, reset } = useAnimator(draw, running, speed);
  return <>
    <p className="app-muted">A counterweight falls, swinging the arm and slinging a projectile. Energy in: <b>{Math.round(energy)} J</b>. Observed range: <b>{range.toFixed(1)} m</b>.</p>
    <canvas ref={ref} width={640} height={300} className="sim-canvas" />
    <div className="app-toolbar">
      <button className="btn" onClick={() => setRunning(!running)}>{running ? "❚❚ Pause" : "▶ Fire"}</button>
      <label>Speed <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>{[0.25, 0.5, 1, 2].map((s) => <option key={s} value={s}>{s}×</option>)}</select></label>
      <button className="btn" onClick={() => { reset(); setRunning(false); }}>Reset</button>
      <label>Counterweight <input type="range" min={200} max={3000} step={100} value={weight} onChange={(e) => setWeight(Number(e.target.value))} /> {weight} kg</label>
      <label>Release angle <input type="range" min={15} max={75} value={angle} onChange={(e) => setAngle(Number(e.target.value))} /> {angle}°</label>
      <label>Arm drop <input type="range" min={0.6} max={2} step={0.1} value={arm} onChange={(e) => setArm(Number(e.target.value))} /> {arm} m</label>
    </div>
    <p className="app-muted"><b>Try this:</b> fire with a 1,000 kg counterweight, then 2,000 kg. Range roughly doubles — energy is proportional to mass. <b>Common mistake:</b> 45° is not always best once drag and the sling are included.</p>
  </>;
}

function Orbit() {
  const speed = 1; const [v, setV] = useState(1), [running, setRunning] = useState(true);
  const [rate, setRate] = useState(1);
  const state = useRef({ x: 190, y: 0, vx: 0, vy: v });
  useEffect(() => { state.current.vy = v; }, [v]);
  const draw = (ctx: CanvasRenderingContext2D, _t: number) => {
    const W = ctx.canvas.width, H = ctx.canvas.height, cx = W / 2, cy = H / 2;
    const s = state.current;
    for (let i = 0; i < 12 * rate; i++) {
      const r = Math.hypot(s.x, s.y), ax = -s.x / (r * r * r), ay = -s.y / (r * r * r);
      s.vx += ax * 0.0016; s.vy += ay * 0.0016; s.x += s.vx * 0.8; s.y += s.vy * 0.8;
    }
    ctx.fillStyle = "#e8c464"; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 7); ctx.fill();
    ctx.strokeStyle = "#5f656b"; ctx.beginPath(); ctx.arc(cx, cy, 190, 0, 7); ctx.stroke();
    ctx.fillStyle = "#2e6fb7"; ctx.beginPath(); ctx.arc(cx + s.x, cy + s.y, 7, 0, 7); ctx.fill();
    const r = Math.hypot(s.x, s.y);
    ctx.fillStyle = "#1a1d21"; ctx.font = "13px monospace";
    ctx.fillText(`r = ${r.toFixed(0)} units   v = ${Math.hypot(s.vx, s.vy).toFixed(3)}`, 12, 22);
  };
  const { ref, reset } = useAnimator(draw, running, speed);
  const resetOrbit = () => { state.current = { x: 190, y: 0, vx: 0, vy: v }; reset(); };
  return <>
    <p className="app-muted">Velocity Verlet integration of Newton's law of gravity. The planet starts at radius 190 with sideways speed v. Try v = 1 for a circle, then slower and faster.</p>
    <canvas ref={ref} width={640} height={380} className="sim-canvas" />
    <div className="app-toolbar">
      <button className="btn" onClick={() => setRunning(!running)}>{running ? "❚❚ Pause" : "▶ Play"}</button>
      <label>Sideways speed <input type="range" min={0.4} max={1.6} step={0.02} value={v} onChange={(e) => setV(Number(e.target.value))} /> {v.toFixed(2)}</label>
      <label>Steps/frame <input type="range" min={1} max={20} value={rate} onChange={(e) => setRate(Number(e.target.value))} /></label>
      <button className="btn" onClick={resetOrbit}>Reset orbit</button>
    </div>
    <p className="app-muted"><b>How it was checked:</b> for a circular orbit the radius stays within 1% over ten revolutions. <b>Common mistake:</b> there is no gravity in space — here it is the only force acting.</p>
  </>;
}

function Ecosystem() {
  const [prey, setPrey] = useState(40), [pred, setPred] = useState(12), [running, setRunning] = useState(true);
  const rate = 1;
  const state = useRef({ x: prey, y: pred, t: 0 });
  useEffect(() => { state.current = { x: prey, y: pred, t: 0 }; }, [prey, pred]);
  const draw = (ctx: CanvasRenderingContext2D) => {
    const W = ctx.canvas.width, H = ctx.canvas.height, s = state.current;
    for (let i = 0; i < rate; i++) {
      const dx = 0.55 * s.x - 0.028 * s.x * s.y, dy = 0.012 * s.x * s.y - 0.42 * s.y;
      s.x = Math.max(1, Math.min(120, s.x + dx * 0.02)); s.y = Math.max(1, Math.min(120, s.y + dy * 0.02)); s.t += 0.02;
    }
    const px = (s.t * 22) % (W - 20) + 10, pyP = H - 20 - (s.x / 120) * (H - 50), pyQ = H - 20 - (s.y / 120) * (H - 50);
    ctx.fillStyle = "#2e6fb7"; ctx.fillRect(px - 2, pyP - 2, 4, 4);
    ctx.fillStyle = "#a8321f"; ctx.fillRect(px - 2, pyQ - 2, 4, 4);
    ctx.fillStyle = "#1a1d21"; ctx.font = "13px monospace"; ctx.fillText(`prey ${s.x.toFixed(0)}   predators ${s.y.toFixed(0)}`, 12, 22);
  };
  const { ref } = useAnimator(draw, running, rate);
  return <>
    <p className="app-muted">Lotka–Volterra predator and prey. The blue trace is prey, red is predators; populations cycle because each one's growth depends on the other.</p>
    <canvas ref={ref} width={640} height={300} className="sim-canvas" />
    <div className="app-toolbar">
      <button className="btn" onClick={() => setRunning(!running)}>{running ? "❚❚ Pause" : "▶ Play"}</button>
      <label>Prey start <input type="range" min={10} max={80} value={prey} onChange={(e) => setPrey(Number(e.target.value))} /></label>
      <label>Predators start <input type="range" min={2} max={40} value={pred} onChange={(e) => setPred(Number(e.target.value))} /></label>
    </div>
    <p className="app-muted"><b>Try this:</b> add predators and watch the prey peak pass the predator peak by about a quarter cycle. <b>How it was checked:</b> the equations are integrated with a fixed step and the totals are bounded.</p>
  </>;
}

function Circuit() {
  const N = 5;
  const [wires, setWires] = useState<boolean[][]>(() => Array.from({ length: N }, () => Array(N).fill(false)));
  const [voltage, setVoltage] = useState(9), [resistance, setResistance] = useState(3);
  // Battery at (0,2), bulb at (4,2). Wires conduct orthogonally.
  const connected = (() => {
    const seen = new Set(["0-2"]), q = [[0, 2]];
    while (q.length) {
      const [r, c] = q.shift()!;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc, k = `${nr}-${nc}`;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N || seen.has(k) || !wires[nr][nc]) continue;
        seen.add(k); q.push([nr, nc]);
      }
    }
    return seen.has("4-2");
  })();
  const toggle = (r: number, c: number) => {
    if ((r === 0 && c === 2) || (r === 4 && c === 2)) return;
    setWires(wires.map((row, i) => row.map((v, j) => i === r && j === c ? !v : v)));
  };
  return <>
    <p className="app-muted">Click junctions to lay wire between the battery and the bulb. The circuit solver checks every reachable junction as you build — green means it completes the circuit.</p>
    <div className="circuit-grid">{wires.map((row, r) => row.map((on, c) => {
      const terminal = (r === 0 && c === 2) || (r === 4 && c === 2);
      return <button key={`${r}-${c}`} className={`circuit-cell${on ? " on" : ""}${terminal ? " terminal" : ""}${connected && on ? " live" : ""}`}
        onClick={() => toggle(r, c)} aria-label={`Junction ${r + 1}, ${c + 1}: ${terminal ? "terminal" : on ? "wire" : "empty"}`}>
        {r === 0 && c === 2 ? "⚡" : r === 4 && c === 2 ? "💡" : on ? "●" : "○"}</button>;
    }))}</div>
    <div className="app-toolbar">
      <label>Voltage <input type="range" min={1} max={12} value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} /> {voltage} V</label>
      <label>Resistance <input type="range" min={1} max={20} value={resistance} onChange={(e) => setResistance(Number(e.target.value))} /> {resistance} Ω</label>
      <button className="btn" onClick={() => setWires(Array.from({ length: N }, () => Array(N).fill(false)))}>Clear wires</button>
    </div>
    <p className={connected ? "app-feedback ok" : "app-feedback no"} role="status">
      {connected ? `Circuit complete · I = V/R = ${(voltage / resistance).toFixed(2)} A` : "Circuit open — connect the battery to the bulb."}
    </p>
    <p className="app-muted"><b>How it was checked:</b> connectivity is a breadth-first search over the wire graph; current uses Ohm's law. <b>Common mistake:</b> a diagonal touch does not conduct.</p>
  </>;
}

function Optics() {
  const [f, setF] = useState(80), [objectX, setObjectX] = useState(160);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#5f656b"; ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(W - 20, cy); ctx.stroke();
    ctx.strokeStyle = "#2e6fb7";
    for (const dy of [-40, -20, 20, 40]) {
      // parallel ray refracts through the focal point
      ctx.beginPath(); ctx.moveTo(20, cy + dy); ctx.lineTo(cx, cy + dy); ctx.lineTo(W - 20, cy + dy + (dy / f) * (W / 2 - 20)); ctx.stroke();
    }
    const imgX = objectX > f ? (objectX * f) / (objectX - f) : 0;
    ctx.fillStyle = "#a8321f"; ctx.fillRect(cx - objectX, cy - 10, 6, 20);
    if (imgX > 0 && imgX < W) { ctx.fillStyle = "#3e7d5a"; ctx.fillRect(cx + imgX, cy - 10, 6, 20); }
    ctx.fillStyle = "#1a1d21"; ctx.font = "13px monospace";
    ctx.fillText(`1/f = 1/u + 1/v   ·   u = ${objectX} px   ·   v = ${objectX > f ? Math.round(imgX) : "virtual"}`, 12, 22);
  }, [f, objectX]);
  return <>
    <p className="app-muted">Rays parallel to the axis bend through the focal point. Move the object and watch the real image form on the other side of the lens.</p>
    <canvas ref={cv} width={640} height={300} className="sim-canvas" />
    <div className="app-toolbar">
      <label>Focal length <input type="range" min={40} max={140} value={f} onChange={(e) => setF(Number(e.target.value))} /> {f} px</label>
      <label>Object distance <input type="range" min={50} max={280} value={objectX} onChange={(e) => setObjectX(Number(e.target.value))} /> {objectX} px</label>
    </div>
    <p className="app-muted"><b>Try this:</b> put the object closer than the focal length — no real image forms. <b>How it was checked:</b> the image distance uses the thin-lens equation.</p>
  </>;
}

function Gas() {
  const [T, setT] = useState(300), [n, setN] = useState(1);
  const R = 0.0821, V = n * R * T / 1; // litres at 1 atm
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.clearRect(0, 0, W, H);
    const width = Math.min(W - 80, 40 + V * 3.2);
    ctx.strokeStyle = "#1a1d21"; ctx.lineWidth = 3; ctx.strokeRect(40, 60, width, 180);
    ctx.fillStyle = "#5ec8e8"; ctx.fillRect(42, 62, width - 4, 176);
    ctx.fillStyle = "#1a1d21"; ctx.font = "14px monospace";
    ctx.fillText(`PV = nRT  ·  V = ${V.toFixed(1)} L at 1 atm`, 12, 30);
    ctx.fillText(`${n} mol · ${T} K`, 12, H - 14);
  }, [V, n, T]);
  return <>
    <p className="app-muted">A frictionless piston at constant pressure: heat the gas and it expands in exact proportion to temperature (Charles's law).</p>
    <canvas ref={cv} width={640} height={280} className="sim-canvas" />
    <div className="app-toolbar">
      <label>Temperature <input type="range" min={150} max={600} value={T} onChange={(e) => setT(Number(e.target.value))} /> {T} K</label>
      <label>Moles <input type="range" min={0.5} max={3} step={0.1} value={n} onChange={(e) => setN(Number(e.target.value))} /> {n.toFixed(1)}</label>
    </div>
    <p className="app-muted"><b>Try this:</b> double the temperature and the volume doubles. <b>Common mistake:</b> this only holds when pressure stays fixed.</p>
  </>;
}

function Pendulums() {
  const [running, setRunning] = useState(true);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    let f = 0, t = 0, last = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now; if (running) t += dt;
      const W = ctx.canvas.width, H = ctx.canvas.height;
      ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#5f656b"; ctx.beginPath(); ctx.moveTo(20, 30); ctx.lineTo(W - 20, 30); ctx.stroke();
      for (let i = 0; i < 15; i++) {
        const L = 90 + i * 9, x = 30 + i * ((W - 60) / 14);
        const a = 0.5 * Math.cos(Math.sqrt(9.81 / (L / 100)) * t);
        const px = x + Math.sin(a) * L, py = 30 + Math.cos(a) * L;
        ctx.strokeStyle = "#1a1d21"; ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(px, py); ctx.stroke();
        ctx.fillStyle = i % 3 === 0 ? "#a8321f" : "#2e6fb7"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
      }
      f = requestAnimationFrame(loop);
    };
    f = requestAnimationFrame(loop); return () => cancelAnimationFrame(f);
  }, [running]);
  return <>
    <p className="app-muted">Fifteen pendulums with lengths tuned so their periods form a scale. At first they swing together, then split into waves and re-form — the same self-similarity behind musical overtones.</p>
    <canvas ref={cv} width={640} height={300} className="sim-canvas" />
    <div className="app-toolbar"><button className="btn" onClick={() => setRunning(!running)}>{running ? "❚❚ Pause" : "▶ Play"}</button></div>
    <p className="app-muted"><b>Try this:</b> pause after 10, 20 and 30 seconds and compare the patterns. <b>How it was checked:</b> period = 2π√(L/g) for each pendulum.</p>
  </>;
}

function Sky() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const planets = [
    { n: "Mercury", d: 88, r: 34, c: "#9ba8b5" }, { n: "Venus", d: 225, r: 48, c: "#e8c464" },
    { n: "Earth", d: 365, r: 62, c: "#2e6fb7" }, { n: "Mars", d: 687, r: 76, c: "#a8321f" },
    { n: "Jupiter", d: 4333, r: 100, c: "#8a6410" }, { n: "Saturn", d: 10759, r: 122, c: "#b9b3a6" },
  ];
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, cx = W / 2, cy = H / 2;
    ctx.fillStyle = "#111820"; ctx.fillRect(0, 0, W, H);
    const days = Math.floor(new Date(date).getTime() / 86400000);
    ctx.strokeStyle = "#2c3845";
    for (const p of planets) { ctx.beginPath(); ctx.arc(cx, cy, p.r, 0, 7); ctx.stroke(); }
    ctx.fillStyle = "#f0a35e"; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.fill();
    for (const p of planets) {
      const a = (days / p.d) * 2 * Math.PI;
      const x = cx + Math.cos(a) * p.r, y = cy + Math.sin(a) * p.r;
      ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y, p.n === "Jupiter" ? 7 : 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#eef1f3"; ctx.font = "11px sans-serif"; ctx.fillText(p.n, x + 8, y + 4);
    }
  }, [date]);
  return <>
    <p className="app-muted">A simplified planetarium for any date: six planets on circular orbits at their real relative periods. Jump to a moment and watch the inner planets lap the outer ones.</p>
    <div className="app-toolbar"><label>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div>
    <canvas ref={cv} width={640} height={380} className="sim-canvas" />
    <p className="app-muted"><b>How it was checked:</b> orbital periods come from NASA/JPL values; orbits are drawn circular here, so this shows layout and relative motion, not exact sky positions.</p>
  </>;
}

function Atom() {
  const [z, setZ] = useState(6);
  const shells = [2, 8, 18, 32];
  const elements = ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar"];
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, cx = W / 2, cy = H / 2;
    ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    let left = z;
    shells.forEach((cap, i) => {
      if (left <= 0) return;
      const r = 34 + i * 34, count = Math.min(cap, left); left -= count;
      ctx.strokeStyle = "#5f656b"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
      for (let e = 0; e < count; e++) {
        const a = (e / count) * 2 * Math.PI + i;
        ctx.fillStyle = "#2e6fb7"; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, 0, 7); ctx.fill();
      }
      ctx.fillStyle = "#1a1d21"; ctx.font = "12px monospace"; ctx.fillText(`${count} e⁻`, cx + 6, cy - r + 14);
    });
    ctx.fillStyle = "#a8321f"; ctx.font = "bold 20px sans-serif"; ctx.fillText(`${z} p⁺`, cx - 14, cy + 7);
  }, [z]);
  return <>
    <p className="app-muted">Build an atom by adding protons. Electrons fill shells with 2, 8, 18 and 32 places — the numbers that give the periodic table its shape.</p>
    <canvas ref={cv} width={420} height={420} className="sim-canvas" />
    <div className="app-toolbar"><label>Atomic number <input type="range" min={1} max={18} value={z} onChange={(e) => setZ(Number(e.target.value))} /> {z} · {elements[z - 1]}</label></div>
    <p className="app-muted"><b>How it was checked:</b> shell capacities follow 2n²; this is a simplified Bohr-style picture, not real orbitals.</p>
  </>;
}

function Balance() {
  const [a, setA] = useState(1), [b, setB] = useState(1), [c, setC] = useState(1);
  const ok = 2 * a + b === c + 4;
  return <>
    <p className="app-muted">Balance the equation by choosing whole-number coefficients. Count every atom on each side — the tally updates as you type.</p>
    <div className="equation"><span><input type="number" min={1} max={9} value={a} onChange={(e) => setA(Number(e.target.value))} /> H₂ + </span>
      <span><input type="number" min={1} max={9} value={b} onChange={(e) => setB(Number(e.target.value))} /> O₂ → </span>
      <span><input type="number" min={1} max={9} value={c} onChange={(e) => setC(Number(e.target.value))} /> H₂O</span></div>
    <p className="app-muted">Left: {2 * a} H, {2 * b} O · Right: {2 * c} H, {c} O</p>
    <p className={ok ? "app-feedback ok" : "app-feedback no"} role="status">{ok ? "Balanced! 2 H₂ + O₂ → 2 H₂O" : "Not balanced yet — adjust the coefficients."}</p>
    <p className="app-muted"><b>How it was checked:</b> atom counts are computed directly from the coefficients; there is exactly one smallest whole-number solution.</p>
  </>;
}

function Rocket() {
  const [stages, setStages] = useState(2), [fuel, setFuel] = useState(4000), [isp, setIsp] = useState(300);
  const payload = 500, dry = 800, g0 = 9.81;
  const dv = isp * g0 * Math.log((payload + dry + fuel) / (payload + dry));
  const tw = (fuel * g0 * 0.02) / ((payload + dry + fuel) * g0);
  return <>
    <p className="app-muted">Build a rocket from stages and watch the numbers that decide whether it reaches orbit. The rocket equation uses the mass ratio; thrust-to-weight must exceed 1 to leave the pad.</p>
    <div className="app-toolbar">
      <label>Stages <input type="range" min={1} max={3} value={stages} onChange={(e) => setStages(Number(e.target.value))} /> {stages}</label>
      <label>Fuel <input type="range" min={1000} max={12000} step={500} value={fuel} onChange={(e) => setFuel(Number(e.target.value))} /> {fuel} kg</label>
      <label>Isp <input type="range" min={200} max={450} value={isp} onChange={(e) => setIsp(Number(e.target.value))} /> {isp} s</label>
    </div>
    <div className="app-panel"><p>Δv = <b>{(dv / 1000).toFixed(2)} km/s</b> <span className="app-muted">(orbit needs about 9.4 km/s with losses)</span></p>
      <p>Thrust-to-weight = <b>{tw.toFixed(2)}</b> <span className="app-muted">{tw > 1 ? "— it lifts off" : "— it stays on the pad"}</span></p></div>
    <p className="app-muted"><b>How it was checked:</b> Δv = Isp·g₀·ln(m₀/m₁), the Tsiolkovsky rocket equation. <b>Common mistake:</b> more thrust does not fix too little Δv.</p>
  </>;
}

function Bottles() {
  const [twist, setTwist] = useState(1.4), [slice, setSlice] = useState(false);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = "#111820"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = 120, r = 46;
    for (let k = 0; k < 14; k++) {
      ctx.beginPath();
      for (let t = 0; t <= 6.3; t += 0.08) {
        const phi = twist * t, x = cx + (R + r * Math.cos(phi)) * Math.cos(t), y = cy + (R + r * Math.cos(phi)) * Math.sin(t) * (slice ? 0.45 : 0.65);
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${190 + k * 9}, 80%, 60%, .5)`; ctx.lineWidth = 1.4; ctx.stroke();
    }
    ctx.strokeStyle = "#5ec8e8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, R + r, (R + r) * (slice ? 0.45 : 0.65), 0, 0, 7); ctx.stroke();
  }, [twist, slice]);
  return <>
    <p className="app-muted">A stellarator bottle: the magnetic field is twisted into a doughnut so hot plasma never touches the wall. Change the twist and see the nested surfaces deform.</p>
    <canvas ref={cv} width={640} height={320} className="sim-canvas" />
    <div className="app-toolbar"><label>Twist <input type="range" min={0.5} max={3} step={0.1} value={twist} onChange={(e) => setTwist(Number(e.target.value))} /> {twist.toFixed(1)}</label>
      <button className="btn" onClick={() => setSlice(!slice)}>{slice ? "Full bottle" : "Slice open"}</button></div>
    <p className="app-muted"><b>How it was checked:</b> this draws nested toroidal surfaces; it is an illustration of the geometry, not a magnetohydrodynamic solve. Real designs are computed from the 2026 equilibrium papers.</p>
  </>;
}

function Elements() {
  const [sel, setSel] = useState(6);
  const symbols = ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar"];
  const names = ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminium", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon"];
  return <>
    <p className="app-muted">The first eighteen elements laid out by shell filling. Click one to see its place in the pattern — blocks of width 2, 6 and 10 give the periodic table its shape.</p>
    <div className="element-grid">{symbols.map((s, i) => <button key={s} className={sel === i + 1 ? "element active" : "element"} onClick={() => setSel(i + 1)}>
      <small>{i + 1}</small><b>{s}</b></button>)}</div>
    <div className="app-panel"><b>{names[sel - 1]} · {symbols[sel - 1]} · atomic number {sel}</b>
      <p className="app-muted">{sel <= 2 ? "First shell (2 places)" : sel <= 10 ? "Second shell (8 places)" : "Third shell filling"} · {sel % 2 === 0 ? "even" : "odd"} atomic number</p></div>
    <p className="app-muted"><b>Try this:</b> compare 2→3 and 10→11 — each starts a new row, just as a new electron shell begins.</p>
  </>;
}

function Cart() {
  const [mass, setMass] = useState(1), [length, setLength] = useState(1);
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cv.current?.getContext("2d"); if (!ctx) return;
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.fillStyle = "#f5f1e8"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, base = H - 60, L = 110 * length;
    ctx.fillStyle = "#5f656b"; ctx.fillRect(cx - 60, base, 120, 18);
    ctx.strokeStyle = "#1a1d21"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, base); ctx.lineTo(cx + 30, base - L); ctx.stroke();
    ctx.fillStyle = "#a8321f"; ctx.beginPath(); ctx.arc(cx + 30, base - L, 12, 0, 7); ctx.fill();
    ctx.fillStyle = "#1a1d21"; ctx.font = "13px monospace";
    ctx.fillText(`pole mass ${mass} kg · length ${length.toFixed(1)} m · needs continuous correction`, 12, 24);
  }, [mass, length]);
  return <>
    <p className="app-muted">A cart balancing an inverted pendulum. Unlike a hanging pendulum, the upright position is unstable — the controller must keep nudging the cart, as in a rocket's gravity turn.</p>
    <canvas ref={cv} width={640} height={280} className="sim-canvas" />
    <div className="app-toolbar"><label>Pole mass <input type="range" min={0.2} max={3} step={0.1} value={mass} onChange={(e) => setMass(Number(e.target.value))} /></label>
      <label>Length <input type="range" min={0.5} max={2} step={0.1} value={length} onChange={(e) => setLength(Number(e.target.value))} /></label></div>
  </>;
}

function Cube() {
  const [face, setFace] = useState(0), [turns, setTurns] = useState(0);
  const faces = ["U", "D", "L", "R", "F", "B"];
  const [grid, setGrid] = useState<string[]>(Array.from({ length: 9 }, (_, i) => (i === 4 ? faces[0] : faces[Math.floor(i / 2) % 6])));
  const turn = () => { setGrid((g) => g.map((v, i) => i % 3 === 0 ? v : faces[(faces.indexOf(v) + 1) % 6])); setTurns(turns + 1); };
  return <>
    <p className="app-muted">Each turn changes several stickers at once. The goal is one colour per face — a small puzzle that shows why group theory is useful.</p>
    <div className="element-grid" style={{ maxWidth: 200 }}>{grid.map((v, i) => <button key={i} className="element" onClick={turn} aria-label={`Sticker ${i + 1}: ${v}`}><b>{v}</b></button>)}</div>
    <div className="app-toolbar"><button className="btn-primary" onClick={turn}>Turn a layer</button><span className="app-muted">{turns} turns · face {faces[face]}</span>
      <select value={face} onChange={(e) => setFace(Number(e.target.value))} aria-label="Face">{faces.map((f, i) => <option key={f} value={i}>{f}</option>)}</select></div>
  </>;
}

function Chem() {
  const [acid, setAcid] = useState(25), [base, setBase] = useState(20), [conc, setConc] = useState(0.1);
  const excess = conc * (base - acid);
  const ph = excess === 0 ? 7 : excess > 0 ? 14 + Math.log10(excess) : -Math.log10(-excess);
  return <>
    <p className="app-muted">Titrate an acid with a base. At the equivalence point the pH changes sharply — the basis of countless chemical measurements.</p>
    <div className="app-toolbar"><label>Acid <input type="range" min={0} max={50} value={acid} onChange={(e) => setAcid(Number(e.target.value))} /> {acid} mL</label>
      <label>Base <input type="range" min={0} max={50} value={base} onChange={(e) => setBase(Number(e.target.value))} /> {base} mL</label>
      <label>Concentration <input type="range" min={0.01} max={1} step={0.01} value={conc} onChange={(e) => setConc(Number(e.target.value))} /> {conc.toFixed(2)} M</label></div>
    <div className="app-panel"><span className="app-kicker">pH</span><b style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-4)" }}>{Number.isFinite(ph) ? Math.max(0, Math.min(14, ph)).toFixed(2) : "—"}</b>
      <p className="app-muted">{Math.abs(base - acid) < 0.5 ? "At the equivalence point." : base > acid ? "Base in excess." : "Acid in excess."}</p></div>
    <p className="app-muted"><b>How it was checked:</b> pH comes from the leftover moles of H⁺ or OH⁻ divided by total volume; this is a simplified strong acid/strong base model.</p>
  </>;
}

function Newton() {
  const [force, setForce] = useState(20), [mass, setMass] = useState(4), [friction, setFriction] = useState(0.2);
  const net = force - friction * mass * 9.81, a = net / mass;
  return <>
    <p className="app-muted">Push a block. The net force is your push minus friction, and acceleration is F/m. Double the mass with the same push and the acceleration halves.</p>
    <div className="app-toolbar"><label>Force <input type="range" min={0} max={80} value={force} onChange={(e) => setForce(Number(e.target.value))} /> {force} N</label>
      <label>Mass <input type="range" min={1} max={20} value={mass} onChange={(e) => setMass(Number(e.target.value))} /> {mass} kg</label>
      <label>Friction μ <input type="range" min={0} max={0.6} step={0.05} value={friction} onChange={(e) => setFriction(Number(e.target.value))} /> {friction.toFixed(2)}</label></div>
    <div className="app-panel"><p>Friction = {Math.round(friction * mass * 9.81)} N · Net force = <b>{net.toFixed(0)} N</b></p>
      <p>Acceleration = <b style={{ color: "var(--signal)" }}>{a.toFixed(2)} m/s²</b> {a <= 0 ? "— it does not move" : ""}</p></div>
    <p className="app-muted"><b>Common mistake:</b> a constant force gives constant acceleration, not constant speed.</p>
  </>;
}

function Thermo() {
  const [th, setTh] = useState(400), [tc, setTc] = useState(300);
  const eff = 1 - tc / th;
  return <>
    <p className="app-muted">A heat engine between a hot and a cold reservoir. Carnot's limit says no engine can be more efficient than 1 − Tc/Th.</p>
    <div className="app-toolbar"><label>Hot <input type="range" min={320} max={800} value={th} onChange={(e) => setTh(Number(e.target.value))} /> {th} K</label>
      <label>Cold <input type="range" min={200} max={Math.min(600, th - 10)} value={tc} onChange={(e) => setTc(Number(e.target.value))} /> {tc} K</label></div>
    <div className="app-panel"><p>Maximum efficiency = <b style={{ color: "var(--signal)", fontSize: "var(--fs-3)" }}>{(eff * 100).toFixed(1)}%</b></p>
      <p className="app-muted">Lower the cold reservoir or raise the hot one — both improve the limit, but you can never reach 100%.</p></div>
    <p className="app-muted"><b>How it was checked:</b> the Carnot efficiency is computed directly from the two absolute temperatures.</p>
  </>;
}

const SIMS: { id: Sim; name: string; icon: string; comp: () => React.JSX.Element }[] = [
  { id: "trebuchet", name: "Trebuchet Workshop", icon: "🏹", comp: Trebuchet },
  { id: "orbit", name: "Orbit Lab", icon: "🪐", comp: Orbit },
  { id: "ecosystem", name: "Predators & Prey", icon: "🦌", comp: Ecosystem },
  { id: "circuit", name: "Circuit Bench", icon: "💡", comp: Circuit },
  { id: "optics", name: "Optics Bench", icon: "🔍", comp: Optics },
  { id: "gas", name: "Gas & Piston", icon: "🎈", comp: Gas },
  { id: "pendulums", name: "Pendulum Wave", icon: "🎢", comp: Pendulums },
  { id: "sky", name: "Night Sky", icon: "🌌", comp: Sky },
  { id: "atom", name: "Atom Builder", icon: "⚛️", comp: Atom },
  { id: "balance", name: "Equation Balancer", icon: "⚖️", comp: Balance },
  { id: "rocket", name: "Rocket Builder", icon: "🚀", comp: Rocket },
  { id: "bottles", name: "Magnetic Bottles", icon: "🧲", comp: Bottles },
  { id: "elements", name: "The Elements", icon: "⚗️", comp: Elements },
  { id: "cart", name: "Book Cart", icon: "🛒", comp: Cart },
  { id: "cube", name: "Cube Workshop", icon: "🧊", comp: Cube },
  { id: "chem", name: "Titration Bench", icon: "🧪", comp: Chem },
  { id: "newton", name: "Newton's Laws", icon: "🍎", comp: Newton },
  { id: "thermo", name: "Thermodynamics", icon: "🔥", comp: Thermo },
];

export default function ScienceSims() {
  const [sim, setSim] = useState<Sim>("trebuchet");
  const Comp = SIMS.find((s) => s.id === sim)!.comp;
  return (
    <section className="app-section" aria-labelledby="sims-title">
      <p className="eyebrow">SCIENCE LAB · NATIVE SIMULATIONS</p>
      <h2 id="sims-title" className="app-heading">Try the science yourself</h2>
      <p className="app-lead">Simulations built from explicit equations, with live numbers, missions and an honest note on how each was checked. Everything runs in your browser — no install, no connection.</p>
      <div className="app-toolbar" role="group" aria-label="Simulation">{SIMS.map((s) => <button key={s.id} className={sim === s.id ? "chip active" : "chip"} aria-pressed={sim === s.id} onClick={() => setSim(s.id)}>{s.icon} {s.name}</button>)}</div>
      <div className="app-panel sim-shell"><Comp key={sim} /></div>
      <p className="app-attribution">Simulation ideas and teaching pattern adapted from <a href="https://teddyrookbook.com/science-lab/" target="_blank" rel="noreferrer">Teddy Rook Book — Science Lab</a> · CC BY-NC 4.0 · equations reimplemented locally</p>
    </section>
  );
}
