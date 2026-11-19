"""Extract storyboards and key frames from the app showcase videos using OpenCV."""
import os, sys, glob, math
import cv2
from PIL import Image, ImageDraw, ImageFont

DL = r"C:\Users\thwin\Downloads"
OUT = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\video-research"
os.makedirs(OUT, exist_ok=True)

VIDEOS = [
    "Si siempre quisiste entender cómo funciona un motor eléctrico, ve estoAlguien ….mp4",
    "Building a robot is easier when you take it one step at a time.So I made an ap….mp4",
    "Updated the survival skills app with more lessons!Learn how to navigate with o….mp4",
    "How Hydraulics Work visualized in 3D by Claude Opus 5.5.mp4",
    "Most devices fail certification over one metal part nobody saw near the antenna….mp4",
    "Si siempre quisiste entender como funciona la corriente, ve estoClaude escribi….mp4",
    "面试准备神器：一个非常优秀的i介绍系统设计的动画网站。可以收藏：.mp4",
]

# map display names -> short ids
IDS = ["motor", "robot", "survival", "hydraulics", "certification", "current", "interview"]


def resolve(fname):
    p = os.path.join(DL, fname)
    if os.path.exists(p):
        return p
    # fuzzy match by distinctive token
    key = fname[:18].lower()
    for f in os.listdir(DL):
        if f.lower().startswith(key[:12]) and f.lower().endswith(".mp4"):
            return os.path.join(DL, f)
    return None


def main():
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else -1
    targets = range(len(VIDEOS)) if idx < 0 else [idx]
    for i in targets:
        path = resolve(VIDEOS[i])
        if not path:
            print(f"[{IDS[i]}] NOT FOUND")
            continue
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        dur = n / fps
        print(f"[{IDS[i]}] {w}x{h} fps={fps:.2f} frames={n} dur={dur:.1f}s")

        # sample ~36 frames, but at least every 3s for short clips
        step = max(2.0, dur / 36.0)
        times = [round(t * step, 2) for t in range(int(dur / step) + 1)]
        thumb_w = 360
        thumb_h = int(h * thumb_w / w)
        cols = 5
        rows = math.ceil(len(times) / cols)
        label_h = 24
        sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), (245, 245, 245))
        draw = ImageDraw.Draw(sheet)
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 14)
        except Exception:
            font = ImageFont.load_default()

        for j, tsec in enumerate(times):
            cap.set(cv2.CAP_PROP_POS_MSEC, tsec * 1000)
            ok, frame = cap.read()
            if not ok:
                continue
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            im = Image.fromarray(frame).resize((thumb_w, thumb_h))
            x = (j % cols) * thumb_w
            y = (j // cols) * (thumb_h + label_h)
            sheet.paste(im, (x, y + label_h))
            draw.rectangle([x, y, x + thumb_w, y + label_h], fill=(20, 20, 20))
            draw.text((x + 6, y + 4), f"{IDS[i]}  t={tsec:.1f}s", fill=(255, 255, 255), font=font)

        sheet_path = os.path.join(OUT, f"{IDS[i]}_storyboard.jpg")
        sheet.save(sheet_path, quality=88)
        print(f"  storyboard -> {sheet_path} ({len(times)} frames)")
        cap.release()


if __name__ == "__main__":
    main()
