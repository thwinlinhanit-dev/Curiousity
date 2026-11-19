"""Group the installed-skill inventory into a readable Markdown catalog."""
import json, collections

IN = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\SKILLS_INVENTORY.json"
OUT = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\SKILLS_CATALOG.md"
data = json.load(open(IN, "r", encoding="utf-8"))

# ordered, first-match groups
GROUPS = [
    ("3D / anatomy / technical illustration", ["anatomy", "teardown", "exploded-view", "colorfigures", "threejs-scene", "hairline", "diagram", "technical illustration", "isometric"]),
    ("Image & video generation (Scenario / treg)", ["scenario-", "image generation", "video generation", "text-to-image", "text-to-video", "image-to-video", "make-ugc", "motion-assets", "frame-capture", "scroll-film", "alpha-cutout", "cursor-rig", "rea-video", "video editing", "caption", "storyboard", "thumbnail"]),
    ("UI / visual design & review", ["design", "interface", "ui", "layout", "typography", "color", "unslop", "impeccable", "better-", "frontend", "apple-design", "android", "material", "mobile-native", "emil-", "design-artifact", "web-design-guidelines", "build-design", "design-extract"]),
    ("Animation & motion", ["animat", "motion", "choreograph", "transition", "spring", "review-animations", "find-animation", "remove-animations", "improve-animations", "frame-capture", "scroll-film"]),
    ("HTML / canvas / prototyping artifacts", ["html", "canvas", "prototype", "wireframe", "one-pager", "writing-beats", "writing-shape", "writing-fragments"]),
    ("Browser & GUI automation", ["agent-browser", "browser", "cua", "gui", "sandbox", "space", "web-access", "web-design-guidelines"]),
    ("Engineering quality: review, debug, security, test", ["review", "security", "debug", "diagnos", "test", "tdd", "code-review", "bugbot", "site-check", "break-ui", "improve-codebase", "codebase-design", "domain-modeling", "migrate-"]),
    ("Agent workflow, planning & research", ["planning", "brainstorm", "grill", "research", "spec", "to-tickets", "to-questionnaire", "onboard", "handoff", "retro", "triage", "goal", "wayfinder", "chief-of-staff", "executing-plans", "implement", "loop", "teach", "write", "pr", "split-to-prs", "autopilot"]),
    ("RE / binary / web reverse engineering", ["reverse-engineer", "rea-", "leanrea", "awesome-rea", "craft-anything"]),
    ("Data, SEO, ads & external platforms", ["lead-signals", "treg", "seo", "serp", "ads", "analytics", "termix", "scenario-admin"]),
    ("Tooling, config, hooks, rules, skills", ["create-skill", "skill-creator", "create-rule", "create-hook", "setup-", "update-", "statusline", "git-guardrails", "new-repo", "origin", "share", "deploy", "instabox", "find-skills", "migrate-to-skills", "migrate-to-shoehorn", "shell", "sdk", "mygo", "ui-sdk"]),
]

def group(s):
    hay = (s["name"] + " " + s["description"]).lower()
    for label, keys in GROUPS:
        if any(k in hay for k in keys):
            return label
    return "Other / miscellaneous"

g = collections.defaultdict(list)
for s in data:
    g[group(s)].append(s)

lines = [
    "# Installed Skills Catalog",
    "",
    f"**{len(data)} unique skills** discovered in `C:\\Users\\thwin\\.agents\\skills` (240 folders) and `C:\\Users\\thwin\\.claude\\skills` (50 folders). Machine-readable index: `SKILLS_INVENTORY.json`.",
    "",
    "Categories are derived from each SKILL.md frontmatter description (skills can fit more than one; first match shown).",
    "",
]
for label, _ in GROUPS + [("Other / miscellaneous", [])]:
    items = g.get(label, [])
    if not items:
        continue
    lines += [f"## {label} ({len(items)})", "", "| Skill | What it does |", "|---|---|"]
    for s in items:
        d = s["description"].replace("|", "\\|")
        if len(d) > 210: d = d[:207] + "…"
        lines.append(f"| `{s['name']}` | {d} |")
    lines.append("")
open(OUT, "w", encoding="utf-8").write("\n".join(lines))
print("wrote", OUT)
for label, _ in GROUPS:
    print(f"  {label}: {len(g.get(label, []))}")
print("  Other:", len(g.get("Other / miscellaneous", [])))
