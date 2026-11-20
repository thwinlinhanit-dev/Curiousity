"""Extract tech-stack signals and readable UI strings from the live apps' JS bundles."""
import os, re, json

BASE = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\video-research\live"

SIGS = {
    "three.js": ["THREE.", "WebGLRenderer", "BufferGeometry", "MeshStandardMaterial"],
    "react": ["createElement", "useState", "react-dom", "__SECRET_INTERNALS_DO_NOT_USE"],
    "vue": ["createBlock", "defineComponent", "__vue"],
    "svelte": ["svelte", "SvelteComponent"],
    "canvas2d": ["getContext(\"2d\")", "getContext('2d')"],
    "svg": ["createElementNS", "<svg", "SVGElement"],
    "gsap/motion": ["gsap", "framer-motion", "motion.div"],
    "web audio": ["AudioContext", "OscillatorNode"],
    "vite": ["import.meta", "__vite"],
    "indexeddb/localstorage": ["localStorage", "indexedDB"],
}

for name in ["motor", "hydraulics", "roverkit", "systemdesign"]:
    p = os.path.join(BASE, name + ".js")
    s = open(p, "r", encoding="utf-8", errors="ignore").read()
    print(f"\n===== {name} ({len(s):,} chars) =====")
    found = {}
    for label, pats in SIGS.items():
        hits = {pat: s.count(pat) for pat in pats if s.count(pat) > 0}
        if hits:
            found[label] = hits
    print("STACK SIGNALS:", json.dumps(found, ensure_ascii=False)[:900])

    # Readable strings: quoted runs of mostly letters/spaces, 18+ chars
    strs = re.findall(r"[\"'`]([A-Za-z][A-Za-z0-9 ,.'’!?:/()×–—\-°²³µΩ=CmNVsA]{17,140})[\"'`]", s)
    seen, out = set(), []
    for x in strs:
        if x in seen:
            continue
        seen.add(x)
        if sum(c.isalpha() for c in x) / max(1, len(x)) < 0.55:
            continue
        out.append(x)
    print(f"READABLE STRINGS ({len(out)}):")
    for x in out[:70]:
        print("   ", x[:130])
