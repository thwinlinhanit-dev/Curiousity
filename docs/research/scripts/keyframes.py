"""Save full-resolution key frames at chosen timestamps for close reading."""
import os, sys
import cv2
from PIL import Image

DL = r"C:\Users\thwin\Downloads"
OUT = r"C:\Users\thwin\Documents\Default Project\app-reverse-engineer\video-research\frames"
os.makedirs(OUT, exist_ok=True)

VIDEOS = {
    "motor": "Si siempre quisiste entender cómo funciona un motor eléctrico, ve estoAlguien ….mp4",
    "robot": "Building a robot is easier when you take it one step at a time.So I made an ap….mp4",
    "survival": "Updated the survival skills app with more lessons!Learn how to navigate with o….mp4",
    "hydraulics": "How Hydraulics Work visualized in 3D by Claude Opus 5.5.mp4",
    "certification": "Most devices fail certification over one metal part nobody saw near the antenna….mp4",
    "current": "Si siempre quisiste entender como funciona la corriente, ve estoClaude escribi….mp4",
    "interview": "面试准备神器：一个非常优秀的i介绍系统设计的动画网站。可以收藏：.mp4",
}
TIMES = {
    "motor": [0, 25, 44, 70, 105],
    "robot": [0, 12, 32, 61, 70, 95],
    "survival": [0, 10, 22, 45, 58, 75, 88],
    "hydraulics": [0, 10, 20, 30, 45],
    "certification": [0, 6, 12, 18],
    "current": [0, 6, 12, 16],
    "interview": [0, 12, 18, 30],
}


def resolve(fname):
    p = os.path.join(DL, fname)
    if os.path.exists(p):
        return p
    for f in os.listdir(DL):
        if f.lower().startswith(fname[:12].lower()) and f.lower().endswith(".mp4"):
            return os.path.join(DL, f)
    return None


def main():
    for key, fname in VIDEOS.items():
        path = resolve(fname)
        if not path:
            print(f"{key}: missing"); continue
        cap = cv2.VideoCapture(path)
        for t in TIMES[key]:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, frame = cap.read()
            if not ok:
                continue
            out = os.path.join(OUT, f"{key}_{t:03d}s.png")
            cv2.imwrite(out, frame)
            print(f"{key} t={t} -> {out}")
        cap.release()


if __name__ == "__main__":
    main()
