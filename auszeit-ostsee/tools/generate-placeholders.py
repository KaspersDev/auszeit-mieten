#!/usr/bin/env python3
"""
Erzeugt die Platzhalter-Bilder fuer die Website.

Die Bilder sind bewusst abstrakt gehalten (weiche Farbverlaeufe in der
Ostsee-Palette) und trage eine dezente Beschriftung mit dem Dateinamen,
damit klar ist, welche Datei durch welches echte Foto ersetzt wird.

Benutzung:  python3 tools/generate-placeholders.py
Abhaengigkeit: Pillow  (pip install Pillow)
"""

import os
import random
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "images")
GALLERY = os.path.join(IMAGES, "gallery")
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

JPEG_OPTS = dict(quality=82, optimize=True, progressive=True, subsampling=1)


# --------------------------------------------------------------------------
# Hilfsfunktionen
# --------------------------------------------------------------------------

def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def ease(t):
    """Weiche S-Kurve, damit Verlaeufe nicht linear/technisch wirken."""
    return t * t * (3 - 2 * t)


def vertical_gradient(size, stops):
    """stops: Liste aus (position 0..1, '#rrggbb')."""
    w, h = size
    img = Image.new("RGB", (1, h))
    px = img.load()
    cols = [(p, hex_rgb(c)) for p, c in stops]
    for y in range(h):
        t = y / max(h - 1, 1)
        lo = cols[0]
        hi = cols[-1]
        for i in range(len(cols) - 1):
            if cols[i][0] <= t <= cols[i + 1][0]:
                lo, hi = cols[i], cols[i + 1]
                break
        span = max(hi[0] - lo[0], 1e-6)
        px[0, y] = mix(lo[1], hi[1], ease(min(max((t - lo[0]) / span, 0), 1)))
    return img.resize((w, h), Image.BILINEAR)


def soft_blob(layer, box, color, alpha, blur):
    """Weicher Farbfleck - simuliert Wolken, Lichtinseln, Reflexe."""
    overlay = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    ImageDraw.Draw(overlay).ellipse(box, fill=hex_rgb(color) + (alpha,))
    overlay = overlay.filter(ImageFilter.GaussianBlur(blur))
    layer.alpha_composite(overlay)


def add_grain(img, sigma=5):
    noise = Image.effect_noise(img.size, sigma).convert("L")
    noise = Image.merge("RGB", (noise, noise, noise))
    return ImageChops.overlay(img, noise.point(lambda v: 110 + (v - 128) * 0.45))


def add_vignette(img, strength=0.30):
    w, h = img.size
    mask = Image.new("L", (64, 64), 0)
    ImageDraw.Draw(mask).ellipse((-14, -14, 78, 78), fill=255)
    mask = mask.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(w / 22))
    dark = img.point(lambda v: int(v * (1 - strength)))
    return Image.composite(img, dark, mask)


def add_label(img, text):
    """Dezenter Hinweis, welche Datei hier ersetzt werden soll."""
    w, h = img.size
    size = max(13, round(h * 0.021))
    try:
        font = ImageFont.truetype(FONT_PATH, size)
    except OSError:
        font = ImageFont.load_default()

    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    pad_x, pad_y = round(size * 0.85), round(size * 0.5)
    box = draw.textbbox((0, 0), text, font=font)
    tw, th = box[2] - box[0], box[3] - box[1]
    margin = round(h * 0.035)
    x0, y0 = margin, h - margin - th - pad_y * 2
    draw.rounded_rectangle(
        (x0, y0, x0 + tw + pad_x * 2, y0 + th + pad_y * 2),
        radius=round(size * 0.45), fill=(14, 26, 35, 105),
    )
    draw.text((x0 + pad_x - box[0], y0 + pad_y - box[1]), text,
              font=font, fill=(255, 255, 255, 190))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def finish(img, label, path, soften=1.1):
    img = img.convert("RGB").filter(ImageFilter.GaussianBlur(soften))
    img = add_grain(img)
    img = add_vignette(img)
    img = add_label(img, label)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "JPEG", **JPEG_OPTS)
    print("  %-34s %5d x %-5d %6.1f kB" % (
        os.path.relpath(path, ROOT), img.width, img.height,
        os.path.getsize(path) / 1024))


# --------------------------------------------------------------------------
# Motive
# --------------------------------------------------------------------------

def coast_scene(w, h, sky, sea, horizon, glow, seed):
    random.seed(seed)
    hy = int(h * horizon)
    img = Image.new("RGB", (w, h))
    img.paste(vertical_gradient((w, hy), [(0.0, sky[0]), (0.6, sky[1]), (1.0, sky[2])]), (0, 0))
    img.paste(vertical_gradient((w, h - hy), [(0.0, sea[0]), (0.45, sea[1]), (1.0, sea[2])]), (0, hy))
    layer = img.convert("RGBA")

    # Lichtschein am Horizont
    soft_blob(layer, (w * 0.18, hy - h * 0.30, w * 0.86, hy + h * 0.10), glow, 92, w / 14)

    # Wolkenbaenke
    for _ in range(7):
        cy = random.uniform(0.05, 0.72) * hy
        cw = random.uniform(0.22, 0.62) * w
        ch = random.uniform(0.03, 0.09) * h
        cx = random.uniform(-0.1, 0.9) * w
        soft_blob(layer, (cx, cy, cx + cw, cy + ch), "#ffffff",
                  random.randint(28, 62), h / 28)

    # Lichtstreifen auf dem Wasser
    for _ in range(16):
        sy = random.uniform(hy + 4, h)
        depth = (sy - hy) / max(h - hy, 1)
        sw = random.uniform(0.10, 0.48) * w
        sx = random.uniform(-0.05, 0.95) * w
        soft_blob(layer, (sx, sy, sx + sw, sy + max(2.0, 5 * depth * h / 300)),
                  "#ffffff", int(20 + 40 * (1 - depth)), h / 260)

    return layer


def interior_scene(w, h, wall, floor, light, accent, seed):
    random.seed(seed)
    fy = int(h * 0.72)
    img = Image.new("RGB", (w, h))
    img.paste(vertical_gradient((w, fy), [(0.0, wall[0]), (1.0, wall[1])]), (0, 0))
    img.paste(vertical_gradient((w, h - fy), [(0.0, floor[0]), (1.0, floor[1])]), (0, fy))
    layer = img.convert("RGBA")

    # Fensterlicht
    wx = random.choice([0.08, 0.52]) * w
    soft_blob(layer, (wx, h * 0.04, wx + w * 0.34, h * 0.62), light, 150, w / 16)
    soft_blob(layer, (wx - w * 0.06, h * 0.30, wx + w * 0.52, h * 0.92), light, 70, w / 10)

    # Farbakzent (Textil, Moebel) - stark unscharf, nur als Farbstimmung
    ax = random.uniform(0.30, 0.68) * w
    soft_blob(layer, (ax, h * 0.42, ax + w * 0.40, h * 0.86), accent, 95, w / 13)
    soft_blob(layer, (w * 0.62, h * 0.55, w * 1.05, h * 1.02), accent, 60, w / 12)

    return layer


def map_scene(w, h):
    random.seed(404)
    img = Image.new("RGB", (w, h), hex_rgb("#eae4d9"))
    draw = ImageDraw.Draw(img)

    # Ostsee
    draw.polygon([(0, h * 0.30), (w * 0.30, h * 0.22), (w * 0.62, h * 0.30),
                  (w, h * 0.20), (w, 0), (0, 0)], fill=hex_rgb("#b6cbd6"))
    draw.polygon([(0, h * 0.33), (w * 0.30, h * 0.25), (w * 0.62, h * 0.33),
                  (w, h * 0.23), (w, h * 0.18), (0, h * 0.26)], fill=hex_rgb("#dcd3c2"))

    # Strassen
    for frac in (0.46, 0.66, 0.86):
        draw.line([(0, h * frac), (w, h * (frac - 0.05))], fill=hex_rgb("#ffffff"),
                  width=max(3, round(h * 0.012)))
    for frac in (0.22, 0.44, 0.70, 0.88):
        draw.line([(w * frac, h * 0.30), (w * (frac + 0.05), h)], fill=hex_rgb("#ffffff"),
                  width=max(2, round(h * 0.008)))

    # Gruenflaechen
    for box in [(w * 0.05, h * 0.52, w * 0.24, h * 0.74),
                (w * 0.70, h * 0.40, w * 0.94, h * 0.62)]:
        draw.rounded_rectangle(box, radius=round(h * 0.03), fill=hex_rgb("#d3d9c4"))

    img = img.filter(ImageFilter.GaussianBlur(0.4))
    layer = img.convert("RGBA")

    # Markierung
    d = ImageDraw.Draw(layer)
    cx, cy, r = w * 0.47, h * 0.55, h * 0.055
    d.ellipse((cx - r * 2.2, cy - r * 2.2, cx + r * 2.2, cy + r * 2.2),
              fill=hex_rgb("#2f6a86") + (48,))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=hex_rgb("#2f6a86") + (255,),
              outline=(255, 255, 255, 255), width=max(2, round(h * 0.007)))
    return layer


# --------------------------------------------------------------------------
# Bildliste
# --------------------------------------------------------------------------

def build():
    print("Platzhalter werden erzeugt ...")

    finish(coast_scene(2400, 1350, ["#c6d8ea", "#dfe1de", "#eee2cf"],
                       ["#7b96a6", "#496c7f", "#2f4c5b"], 0.58, "#f7e7cd", 11),
           "hero.jpg", os.path.join(IMAGES, "hero.jpg"), soften=1.4)

    finish(coast_scene(1200, 630, ["#c6d8ea", "#dfe1de", "#eee2cf"],
                       ["#7b96a6", "#496c7f", "#2f4c5b"], 0.58, "#f7e7cd", 11),
           "og-image.jpg", os.path.join(IMAGES, "og-image.jpg"), soften=1.0)

    finish(interior_scene(1600, 1200, ["#f2ece2", "#e6ddd0"], ["#c8b79f", "#b6a48b"],
                          "#fff6e6", "#9fb3bd", 21),
           "wohnung1.jpg", os.path.join(IMAGES, "wohnung1.jpg"), soften=1.3)

    finish(interior_scene(1600, 1200, ["#eef0f0", "#dee4e6"], ["#bfb5a6", "#a89c8c"],
                          "#f7fbfd", "#8aa6b4", 22),
           "wohnung2.jpg", os.path.join(IMAGES, "wohnung2.jpg"), soften=1.3)

    finish(interior_scene(1200, 1200, ["#eee7dc", "#ded4c4"], ["#c3b298", "#ad9a80"],
                          "#fff5e4", "#93a7ae", 31),
           "gastgeber.jpg", os.path.join(IMAGES, "gastgeber.jpg"), soften=1.6)

    finish(map_scene(1600, 900), "karte-platzhalter.jpg",
           os.path.join(IMAGES, "karte-platzhalter.jpg"), soften=0.6)

    gallery = [
        ("galerie-01.jpg", coast_scene(1400, 1050, ["#c9daea", "#dfe3e2", "#ece3d4"],
                                       ["#839dab", "#527483", "#375563"], 0.52, "#f4e8d4", 51)),
        ("galerie-02.jpg", interior_scene(1400, 1050, ["#f3ede3", "#e7ded1"],
                                          ["#c9b8a0", "#b7a58c"], "#fff7e8", "#a3b6c0", 52)),
        ("galerie-03.jpg", coast_scene(1400, 1050, ["#b7cddd", "#d3dde3", "#e6e6e0"],
                                       ["#cabea5", "#b5a38a", "#9b8970"], 0.40, "#f0e8d8", 53)),
        ("galerie-04.jpg", interior_scene(1400, 1050, ["#eff1f1", "#dfe5e7"],
                                          ["#c0b6a7", "#a99d8d"], "#f8fcfe", "#8ba7b5", 54)),
        ("galerie-05.jpg", coast_scene(1400, 1050, ["#cad9e6", "#dee2e0", "#ece1cd"],
                                       ["#7d97a6", "#4d7083", "#33505f"], 0.62, "#f6e9d6", 55)),
        ("galerie-06.jpg", interior_scene(1400, 1050, ["#f1ebe1", "#e4dbce"],
                                          ["#c6b59d", "#b4a289"], "#fff6e6", "#9db1bb", 56)),
        ("galerie-07.jpg", coast_scene(1400, 1050, ["#bdd0e0", "#d6dee2", "#e8e5dc"],
                                       ["#c7bba2", "#b2a087", "#98866d"], 0.46, "#efe7d7", 57)),
        ("galerie-08.jpg", interior_scene(1400, 1050, ["#edefef", "#dde3e5"],
                                          ["#beb4a5", "#a79b8b"], "#f6fafc", "#89a5b3", 58)),
    ]
    for name, scene in gallery:
        finish(scene, name, os.path.join(GALLERY, name), soften=1.2)

    print("Fertig.")


if __name__ == "__main__":
    build()
