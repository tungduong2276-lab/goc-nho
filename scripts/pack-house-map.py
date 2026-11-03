"""Pack the four house-map renders without touching scene.json or any user data."""
from pathlib import Path
from PIL import Image

source = Path("out_house")
target = Path("assets/3d")
target.mkdir(parents=True, exist_ok=True)
for time in ("sang", "ngay", "chieu", "dem"):
    path = source / f"ban_do_{time}@3x.png"
    with Image.open(path) as im:
        if im.size != (1170, 2532):
            raise ValueError(f"{path}: unexpected dimensions {im.size}")
        crop = im.convert("RGBA").crop((0, 0, 1170, 1960))
        if crop.getbbox() is None:
            raise ValueError(f"{path}: empty render")
        output = target / f"ban_do_{time}.webp"
        crop.save(output, "WEBP", quality=84, method=6)
        with Image.open(output) as check:
            if check.size != (1170, 1960):
                raise ValueError(f"{output}: bad encoded size")
        print(f"Rendered {output}: {output.stat().st_size} bytes")
