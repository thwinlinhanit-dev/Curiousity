"""Inventory all installed skills by parsing SKILL.md frontmatter."""
import os, re, json, collections

ROOTS = [r"C:\Users\thwin\.agents\skills", r"C:\Users\thwin\.claude\skills"]
OUT = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\SKILLS_INVENTORY.json"

skills = {}
for root in ROOTS:
    if not os.path.isdir(root):
        continue
    for d in os.listdir(root):
        p = os.path.join(root, d, "SKILL.md")
        if not os.path.isfile(p):
            continue
        text = open(p, "r", encoding="utf-8", errors="ignore").read()
        m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
        fm = m.group(1) if m else ""
        name = re.search(r'^name:\s*(.+)$', fm, re.M)
        desc = re.search(r'^description:\s*(.+)$', fm, re.M)
        name = name.group(1).strip() if name else d
        desc = desc.group(1).strip() if desc else ""
        # unwrap simple quoted yaml
        if (desc.startswith('"') and desc.endswith('"')) or (desc.startswith("'") and desc.endswith("'")):
            desc = desc[1:-1]
        desc = re.sub(r"\s+", " ", desc)
        rec = skills.setdefault(name, {"name": name, "description": desc, "paths": [], "size": 0})
        rec["paths"].append(os.path.join(root, d))
        rec["size"] += len(text)

data = sorted(skills.values(), key=lambda x: x["name"])
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"total unique skills: {len(data)}  -> {OUT}")
# domain buckets by keyword
buckets = collections.Counter()
for s in data:
    d = (s["name"] + " " + s["description"]).lower()
    tags = []
    if any(k in d for k in ["scenario", "image", "video", "audio", "music", "3d", "asset"]): tags.append("media-generation")
    if any(k in d for k in ["ui", "design", "interface", "layout", "typography", "color", "anima", "apple", "android", "frontend", "html"]): tags.append("design-ui")
    if any(k in d for k in ["browser", "cua", "gui", "sandbox", "space"]): tags.append("automation-browser")
    if any(k in d for k in ["review", "security", "accessib", "code", "debug", "test", "tdd", "diagnos"]): tags.append("engineering-quality")
    if any(k in d for k in ["research", "plan", "writing", "brainstorm", "grill", "spec", "ticket", "onboard", "handoff"]): tags.append("planning-research")
    if any(k in d for k in ["skill", "rule", "hook", "config", "setup", "install", "deploy", "git", "repo", "share"]): tags.append("tooling-meta")
    if not tags: tags.append("other")
    for t in tags: buckets[t] += 1
print("overlapping domain buckets:", dict(buckets))
for s in data[:12]:
    print(" -", s["name"], "::", s["description"][:110])
