"""Create static social-sharing media and favicons from GitHub Studio content.

Run during GitHub Actions, before Vite copies /public into /dist.
No separate server, database, image CDN, or external deployment required.
"""
import json
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MANIFEST = ROOT / "src/data/published-portfolio.json"
STUDIO_MEDIA = re.compile(r"^site://images/studio/[a-f0-9]{64}\.(?:png|jpe?g|webp|avif)$", re.I)
BUNDLED = re.compile(r"^(?:https://jordanferrary\.github\.io)?/(?:portfolio_jordan/)?images/[\w\-/]+\.(?:png|jpe?g|webp|avif)$", re.I)


def bundled_file(source: str) -> Path | None:
    """Resolve only files inside the repository; never fetch arbitrary web URLs."""
    if STUDIO_MEDIA.fullmatch(source or ""):
        relative = source.removeprefix("site://")
    elif BUNDLED.fullmatch(source or ""):
        relative = source.split("/images/", 1)[-1]
        relative = "images/" + relative
    elif (source or "").startswith("images/"):
        relative = source
    else:
        return None
    path = (PUBLIC / relative).resolve()
    if not path.is_relative_to(PUBLIC.resolve()) or not path.is_file():
        return None
    return path


def rgba_to_rgb(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    resized = ImageOps.fit(image.convert("RGBA"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    background = Image.new("RGB", size, "#170d24")
    background.paste(resized, mask=resized.getchannel("A"))
    return background


def create_social_image(home_image: Path) -> None:
    Image.MAX_IMAGE_PIXELS = 35_000_000
    with Image.open(home_image) as source:
        output = rgba_to_rgb(source, (1200, 630))
        output.save(PUBLIC / "social-preview.jpg", "JPEG", quality=88, optimize=True, progressive=True)
    print("Social sharing image: 1200x630 JPEG from", home_image.relative_to(ROOT))


def create_favicons(icon: Path | None) -> None:
    if icon is None:
        existing = PUBLIC / "favicon-32x32.png"
        if not existing.is_file():
            return
        # Keep the supplied small-size originals unchanged.
        with Image.open(existing) as source:
            ImageOps.contain(source.convert("RGBA"), (180, 180), method=Image.Resampling.LANCZOS).save(PUBLIC / "apple-touch-icon.png")
        print("Default JF favicon retained")
        return
    with Image.open(icon) as source:
        image = source.convert("RGBA")
        for size in (16, 32, 180):
            resized = ImageOps.contain(image, (size, size), method=Image.Resampling.LANCZOS)
            frame = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            frame.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
            output = "apple-touch-icon.png" if size == 180 else f"favicon-{size}x{size}.png"
            frame.save(PUBLIC / output, "PNG", optimize=True)
    print("Custom favicon exported from", icon.relative_to(ROOT))


def main() -> None:
    content = json.loads(MANIFEST.read_text(encoding="utf8"))
    store = content.get("store") or {}
    home = store.get("home") or {}
    image = bundled_file(home.get("background", ""))
    if image is None:
        image = PUBLIC / "images/hero/hero-character.webp"
    if not image.is_file():
        raise RuntimeError("Home background image was not found; unable to generate social preview")
    create_social_image(image)
    favicon_ref = store.get("siteFavicon", "")
    favicon_path = bundled_file(favicon_ref) if favicon_ref else None
    if favicon_ref and favicon_path is None:
        raise RuntimeError("Configured favicon is not available in /public")
    create_favicons(favicon_path)


if __name__ == "__main__":
    main()
