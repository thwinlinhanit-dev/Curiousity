import { useEffect, useRef, useState } from "react";

type Opts = { e?: number; a?: number; mode?: string; [k: string]: unknown };

// Optional WebGL enhancement for orbit topics. three is loaded dynamically so
// the 2D-first experience stays light and accessible.
export default function OrbitMode({ opts }: { opts: Opts }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const stateRef = useRef({ playing, speed });
  stateRef.current = { playing, speed };
  const e = opts.e ?? 0.4;
  const a = opts.a ?? 5;

  useEffect(() => {
    let alive = true;
    let dispose = () => {};
    (async () => {
      try {
        const THREE = await import("three");
        if (!alive || !host.current) return;
        const el = host.current;
        const w = el.clientWidth || 900, h = 460;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#111820");
        const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
        camera.position.set(0, 9, 14);
        camera.lookAt(0, 0, 0);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(w, h);
        el.appendChild(renderer.domElement);

        const sun = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
        scene.add(sun);
        const planet = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), new THREE.MeshStandardMaterial({ color: 0x5ec8e8 }));
        scene.add(planet);
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const light = new THREE.PointLight(0xffffff, 40); light.position.set(0, 0, 0); scene.add(light);

        const b = a * Math.sqrt(1 - e * e);
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 160; i++) {
          const th = (i / 160) * Math.PI * 2;
          pts.push([a * Math.cos(th) - a * e, 0, b * Math.sin(th)]);
        }
        const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), true);
        const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(300)), new THREE.LineBasicMaterial({ color: 0x7f8b96 }));
        scene.add(orbit);

        let t = 0, last = 0, raf = 0;
        const tick = (now: number) => {
          if (!last) last = now;
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          if (stateRef.current.playing) t += dt * stateRef.current.speed;
          const p = curve.getPointAt((t * 0.12) % 1);
          planet.position.copy(p);
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        const ro = new ResizeObserver(() => {
          const nw = el.clientWidth || 900;
          camera.aspect = nw / h; camera.updateProjectionMatrix(); renderer.setSize(nw, h);
        });
        ro.observe(el);
        dispose = () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement); };
      } catch (err) { if (alive) setError(String(err)); }
    })();
    return () => { alive = false; dispose(); };
  }, [e, a]);

  return (
    <div className="orbit-mode">
      {error ? <p style={{ color: "var(--signal)" }}>3D unavailable: {error}</p> : <div ref={host} style={{ width: "100%", minHeight: 460 }} />}
      <div className="figure-controls">
        <button className="btn" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
        <label>speed {speed}×<input type="range" min="0.1" max="2" step="0.1" value={speed} onChange={(ev) => setSpeed(Number(ev.target.value))} /></label>
        <span style={{ color: "var(--ink-3)" }}>e = {e} · a = {a} · simplified two-body model</span>
      </div>
    </div>
  );
}
