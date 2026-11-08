#!/usr/bin/env python3
"""Pack CI-rendered 3D architecture studies into an isolated, read-only V2 namespace.

This does not rewrite assets/3d/scene.json, legacy WebPs, Firestore, or live
room metadata. Source: _xuong-3d/architecture.js / architecture-plan.js.
"""
import json
import pathlib
import sys
import hashlib
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parent.parent
SOURCE = REPO / (sys.argv[1] if len(sys.argv) > 1 else "out_arch")
DEST = REPO / "assets/3d/v2arch"
ROOMS = (
    ("phong-khach", "Phòng khách"),
    ("bep", "Bếp"),
    ("phong-anh", "Phòng Anh"),
    ("phong-em", "Phòng Em"),
    ("goc-sang-tao", "Góc sáng tạo"),
    ("gac", "Gác kỷ niệm"),
)
TIMES = ("ngay", "dem")

SOURCE_FILES = [
    "_xuong-3d/architecture-plan.js", "_xuong-3d/architecture.js",
    "_xuong-3d/lib.js", "_xuong-3d/furn.js", "_xuong-3d/run.js",
    "scripts/pack-architecture-preview.py",
]


def fingerprint():
    digest = hashlib.sha256()
    for name in SOURCE_FILES:
        digest.update(name.encode("utf-8"))
        digest.update((REPO / name).read_bytes())
    return digest.hexdigest()


def is_current():
    file = DEST / "preview.json"
    if not file.is_file():
        return False
    try:
        m = json.loads(file.read_text(encoding="utf-8"))
        if m.get("sourceHash") != fingerprint():
            return False
        return all(
            (DEST / (slug + "_" + when + ".webp")).is_file()
            for slug, _ in ROOMS for when in TIMES
        )
    except (OSError, ValueError, TypeError):
        return False



def main():
    meta = json.loads((SOURCE / "meta.json").read_text(encoding="utf-8"))
    DEST.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schemaVersion": 1,
        "mode": "render-only",
        "sourceHash": fingerprint(),
        "source": "_xuong-3d/architecture.js",
        "canvas": [1170, 1170],
        "rooms": {},
    }
    for slug, title in ROOMS:
        key = "kien_truc_" + slug + "_meta"
        data = meta[key]
        assert data["id"] == slug and data["title"] == title
        images = {}
        for time in TIMES:
            name = slug + "_" + time + ".webp"
            src = SOURCE / ("kien_truc_" + slug + "_" + time + "@3x.png")
            with Image.open(src) as image:
                assert image.size == (1170, 1170), (slug, time, image.size)
                rgba = image.convert("RGBA")
                rgba.save(DEST / name, "WEBP", quality=84, method=6)
            images[time] = name
        manifest["rooms"][slug] = {
            "title": title, "images": images,
            "areaSqm": data["areaSqm"],
            "originalAreaSqm": data["originalAreaSqm"],
            "floorCornersPixels": data["floorCornersPixels"],
            "doorway": data["doorway"],
            "furniture": data["furniture"],
        }
        print(slug, images, "area", data["areaSqm"])
    (DEST / "preview.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8")
    print("Packaged", len(ROOMS) * len(TIMES), "architecture WebPs into", DEST)


if __name__ == "__main__":
    if "--check" in sys.argv:
        if not is_current():
            print("Need regenerate architecture gallery")
            sys.exit(1)
        print("Architecture gallery source hash and 12 images verified")
    else:
        main()
