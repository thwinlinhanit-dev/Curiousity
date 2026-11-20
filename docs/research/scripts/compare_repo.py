import os, hashlib

LOCAL = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\build\physics-app"
REMOTE = r"C:\Users\thwin\AppData\Local\Temp\opencode\Curiousity-check"
IGNORE_DIRS = {"node_modules", "dist", ".npm-cache", ".cache", ".git", "public"}
DIRS = ["src", "scripts", "docs"]

def h(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()

def scan(base, sub):
    out = {}
    root = os.path.join(base, sub)
    if not os.path.isdir(root):
        return out
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in IGNORE_DIRS]
        for f in fns:
            p = os.path.join(dp, f)
            out[os.path.relpath(p, base).replace("\\", "/")] = h(p)
    return out

for sub in DIRS:
    a, b = scan(LOCAL, sub), scan(REMOTE, sub)
    added = sorted(set(a) - set(b))
    removed = sorted(set(b) - set(a))
    changed = sorted(k for k in set(a) & set(b) if a[k] != b[k])
    print(f"\n## {sub}: local={len(a)} remote={len(b)} added={len(added)} removed={len(removed)} changed={len(changed)}")
    for k in added[:40]: print("  ADDED   ", k)
    for k in removed[:40]: print("  REMOVED ", k)
    for k in changed[:60]: print("  CHANGED ", k)

for f in ["index.html", "package.json", "package-lock.json", "README.md", "tsconfig.json", "vite.config.ts", ".gitignore", ".env.example"]:
    pa, pb = os.path.join(LOCAL, f), os.path.join(REMOTE, f)
    if not os.path.exists(pa) or not os.path.exists(pb):
        continue
    if h(pa) != h(pb):
        print("  ROOT CHANGED", f)
