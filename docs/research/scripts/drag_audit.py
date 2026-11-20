"""apple-design: check 1:1 drag tracking, snap behaviour and boundary feel in BreadboardLab."""
from playwright.sync_api import sync_playwright

URL = "http://localhost:4173/?lab=breadboard"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    page = b.new_page(viewport={"width": 1280, "height": 900})
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_selector("#led", timeout=10000)
    page.wait_for_timeout(300)

    led = page.locator("#led")
    box = led.bounding_box()
    print("LED box:", {k: round(v) for k, v in box.items()})
    cy = box["y"] + box["height"] / 2
    # grab off-centre horizontally to test whether the grab offset is respected
    gx = box["x"] + box["width"] * 0.25
    page.mouse.move(gx, cy)
    page.mouse.down()
    samples = []
    for dx in [0, 20, 45, 70, 95, 120, 150, 200, 260, 320]:
        page.mouse.move(gx + dx, cy, steps=3)
        page.wait_for_timeout(30)
        samples.append(page.evaluate("""() => {
          const g = document.querySelector('#led');
          const m = /translate\\(([-\\d.]+),\\s*([-\\d.]+)\\)/.exec(g?.getAttribute('transform') || '');
          return {x: m ? +m[1] : null, label: document.querySelector('.figure-controls')?.textContent.slice(0,26)};
        }"""))
    page.mouse.up()
    print("during drag:", samples)
    final = page.evaluate("document.querySelector('.figure-controls')?.textContent.slice(0,60)")
    print("final:", final)

    # keyboard alternative (accessibility: WCAG 2.5.7)
    page.locator("#led").focus()
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(100)
    print("after ArrowRight:", page.evaluate("document.querySelector('.figure-controls')?.textContent.slice(0,26)"))
    b.close()
