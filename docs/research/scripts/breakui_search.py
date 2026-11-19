"""break-ui: worst-case corpus title through the global search at 320px and 200% zoom."""
from playwright.sync_api import sync_playwright

URL = "http://localhost:4173/"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\video-research\breakui"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for width, zoom, tag in [(320, 1, "320"), (320, 2, "320-zoom2"), (1440, 1, "1440")]:
        ctx = b.new_context(viewport={"width": width, "height": 900})
        page = ctx.new_page()
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_selector(".global-search input")
        if zoom != 1:
            page.evaluate(f"document.body.style.zoom = '{zoom}'")
        page.fill(".global-search input", "Universal Instantiation")
        page.wait_for_timeout(400)
        data = page.evaluate("""() => {
          const btn = document.querySelector('.global-search li button');
          const span = btn?.querySelector('span');
          const list = document.querySelector('.global-search ul');
          const r = btn?.getBoundingClientRect();
          const s = span?.getBoundingClientRect();
          const lr = list?.getBoundingClientRect();
          return {
            label: btn?.querySelector('b')?.textContent,
            sub: span?.textContent,
            btnWidth: r && Math.round(r.width), btnRight: r && Math.round(r.right),
            subWidth: s && Math.round(s.width), subRight: s && Math.round(s.right),
            listRight: lr && Math.round(lr.right),
            docScrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            overflow: document.documentElement.scrollWidth > window.innerWidth
          };
        }""")
        print(tag, data)
        page.screenshot(path=f"{OUT}-{tag}.png", full_page=False)
        ctx.close()
    b.close()
