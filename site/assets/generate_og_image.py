"""Generate the Open Graph / Twitter card image for tinyclips.app.

Usage (from the repo root):
    python site/assets/generate_og_image.py

Produces site/assets/og-image.png (1200x630). Uses the real Windows and macOS
screenshots already in site/assets so the card matches the live site.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS = Path(__file__).resolve().parent
W, H = 1200, 630

BG = (7, 10, 20)
TEXT = (243, 245, 255)
MUTED = (169, 179, 209)
ACCENT = (79, 180, 255)
GRAD_A = (61, 139, 255)
GRAD_B = (106, 79, 240)

FONT_CANDIDATES = {
    "bold": [
        "C:/Windows/Fonts/segoeuib.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "semibold": [
        "C:/Windows/Fonts/seguisb.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "regular": [
        "C:/Windows/Fonts/segoeui.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
}


def font(kind: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in FONT_CANDIDATES[kind]:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def radial_glow(size: tuple[int, int], center: tuple[int, int], radius: int, color: tuple[int, int, int], alpha: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(*color, alpha))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def gradient_text(draw_target: Image.Image, xy: tuple[int, int], text: str, fnt: ImageFont.FreeTypeFont) -> None:
    """Draw text filled with the brand gradient."""
    tmp = Image.new("L", draw_target.size, 0)
    ImageDraw.Draw(tmp).text(xy, text, font=fnt, fill=255)
    grad = Image.new("RGB", draw_target.size, GRAD_A)
    gd = ImageDraw.Draw(grad)
    left, top, right, bottom = ImageDraw.Draw(tmp).textbbox(xy, text, font=fnt)
    for x in range(left, right + 1):
        t = (x - left) / max(1, right - left)
        gd.line((x, top, x, bottom), fill=lerp(GRAD_A, GRAD_B, t))
    draw_target.paste(grad, (0, 0), tmp)


def framed_screenshot(path: Path, width: int, radius: int = 14) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    scale = width / src.width
    img = src.resize((width, round(src.height * scale)), Image.LANCZOS)
    mask = rounded_mask(img.size, radius)
    framed = Image.new("RGBA", (img.width + 2, img.height + 2), (150, 172, 230, 90))
    framed_mask = rounded_mask(framed.size, radius + 1)
    out = Image.new("RGBA", framed.size, (0, 0, 0, 0))
    out.paste(framed, (0, 0), framed_mask)
    out.paste(img, (1, 1), mask)
    return out


def corner_brackets(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], size: int = 26, width: int = 4) -> None:
    x0, y0, x1, y1 = box
    c = ACCENT
    draw.line((x0, y0 + size, x0, y0, x0 + size, y0), fill=c, width=width, joint="curve")
    draw.line((x1 - size, y0, x1, y0, x1, y0 + size), fill=c, width=width, joint="curve")
    draw.line((x0, y1 - size, x0, y1, x0 + size, y1), fill=c, width=width, joint="curve")
    draw.line((x1 - size, y1, x1, y1, x1, y1 - size), fill=c, width=width, joint="curve")


def build() -> Image.Image:
    canvas = Image.new("RGBA", (W, H), (*BG, 255))

    # Ambient brand glows (blue top-right, violet bottom-left) + faint grid.
    canvas.alpha_composite(radial_glow((W, H), (930, 120), 420, GRAD_A, 120))
    canvas.alpha_composite(radial_glow((W, H), (180, 560), 360, GRAD_B, 110))
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grid)
    for gx in range(0, W, 48):
        gdraw.line((gx, 0, gx, H), fill=(150, 172, 230, 9))
    for gy in range(0, H, 48):
        gdraw.line((0, gy, W, gy), fill=(150, 172, 230, 9))
    canvas.alpha_composite(grid)

    draw = ImageDraw.Draw(canvas)

    # --- Left column: copy ---
    x = 64
    icon = Image.open(ASSETS / "app-icon-256.png").convert("RGBA").resize((72, 72), Image.LANCZOS)
    canvas.alpha_composite(icon, (x, 56))
    draw.text((x + 88, 64), "Tiny Clips", font=font("bold", 34), fill=TEXT)
    draw.text((x + 88, 104), "for Windows & Mac", font=font("regular", 20), fill=MUTED)

    title_font = font("bold", 66)
    draw.text((x, 170), "Capture it.", font=title_font, fill=TEXT)
    draw.text((x, 242), "Polish it.", font=title_font, fill=TEXT)
    gradient_text(canvas, (x, 314), "Share it.", title_font)
    draw = ImageDraw.Draw(canvas)

    draw.text((x, 408), "Screenshots · MP4 · GIF · OCR · Webcam · Teleprompter", font=font("semibold", 21), fill=MUTED)

    # Store pills (drawn on their own layer so the translucent fill blends)
    pill_font = font("semibold", 17)
    pills = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pills)
    py = 462
    for label in ("Microsoft Store", "Mac App Store"):
        tw = pd.textlength(label, font=pill_font)
        pw = int(tw + 36)
        pd.rounded_rectangle((x, py, x + pw, py + 38), radius=19, fill=(255, 255, 255, 22), outline=(150, 172, 230, 80), width=1)
        pd.ellipse((x + 14, py + 14, x + 24, py + 24), fill=(61, 220, 151, 255))
        pd.text((x + 32, py + 8), label, font=pill_font, fill=(*TEXT, 255))
        x += pw + 10
    canvas.alpha_composite(pills)
    draw = ImageDraw.Draw(canvas)
    x = 64
    draw.text((x, 524), "Free · no account · no telemetry", font=font("regular", 19), fill=MUTED)
    draw.text((x, 556), "tinyclips.app", font=font("bold", 26), fill=ACCENT)

    # --- Right column: two real screenshots, layered ---
    win_shot = framed_screenshot(ASSETS / "windows-screenshot-editor.png", 540)
    mac_shot = framed_screenshot(ASSETS / "app-store-artwork-1.png", 330)

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((640, 96, 640 + win_shot.width, 96 + win_shot.height), radius=16, fill=(0, 0, 0, 170))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)), (0, 22))
    canvas.alpha_composite(win_shot, (640, 96))

    shadow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow2).rounded_rectangle((840, 372, 840 + mac_shot.width, 372 + mac_shot.height), radius=16, fill=(0, 0, 0, 190))
    canvas.alpha_composite(shadow2.filter(ImageFilter.GaussianBlur(24)), (0, 18))
    canvas.alpha_composite(mac_shot, (840, 372))

    draw = ImageDraw.Draw(canvas)
    corner_brackets(draw, (620, 76, 640 + win_shot.width + 20, 96 + win_shot.height + 20))

    # Platform badges on the screenshots
    badge_font = font("semibold", 14)
    for label, bx, by in (("Windows", 656, 110), ("macOS", 856, 386)):
        tw = draw.textlength(label, font=badge_font)
        draw.rounded_rectangle((bx, by, bx + tw + 22, by + 26), radius=13, fill=(7, 10, 20, 215), outline=(150, 172, 230, 90))
        draw.text((bx + 11, by + 4), label, font=badge_font, fill=TEXT)

    return canvas.convert("RGB")


def main() -> None:
    out = ASSETS / "og-image.png"
    build().save(out, optimize=True)
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
