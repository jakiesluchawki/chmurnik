#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path("/Users/mieszkomahboob/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my")
APP = ROOT / "chmurnik"
OUT = ROOT / "outputs" / "chmurnik-instastories"
FULL = OUT / "full"
PREVIEW = OUT / "preview"

W, H = 1080, 1920

PINK = "#F6DCE6"
PINK_LIGHT = "#FBEAF0"
OLIVE = "#79713F"
OLIVE_DARK = "#5E582F"
PURPLE = "#8B63FF"
PURPLE_DARK = "#665FD0"
CREAM = "#F6F0E7"
NAVY = "#0A3559"
MIST = "#DDEBF2"
CORAL = "#D04632"
WHITE = "#FFFDF8"

ROMIE_PATH = APP / "public/fonts/Romie-Regular.otf"
ROOBERT_PATH = APP / "public/fonts/Roobert-Regular.otf"
ROOBERT_BOLD_PATH = APP / "public/fonts/Roobert-Bold.otf"

WORDMARK_PATH = APP / "public/brand/chmurnik-wordmark.png"
HERO_ART_PATH = Path("/tmp/linkedin-1.jpg")
WINDY_UI_PATH = Path("/tmp/linkedin-2.jpg")
ATLAS_UI_PATH = Path("/tmp/linkedin-3.jpg")
METAR_UI_PATH = Path("/tmp/linkedin-4.jpg")
NLC_PATH = APP / "public/assets/upper-atmosphere/noctilucent-clouds-laboe.jpg"
ATMOSPHERE_ART_PATH = APP / "public/assets/atmosphere-still-life.png"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def romie(size: int) -> ImageFont.FreeTypeFont:
    return font(ROMIE_PATH, size)


def roobert(size: int) -> ImageFont.FreeTypeFont:
    return font(ROOBERT_PATH, size)


def roobert_bold(size: int) -> ImageFont.FreeTypeFont:
    return font(ROOBERT_BOLD_PATH, size)


def fit_crop(image: Image.Image, size: tuple[int, int], focus: tuple[float, float] = (0.5, 0.5)) -> Image.Image:
    image = image.convert("RGB")
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((math.ceil(image.width * scale), math.ceil(image.height * scale)), Image.Resampling.LANCZOS)
    left = max(0, min(resized.width - target_w, int((resized.width - target_w) * focus[0])))
    top = max(0, min(resized.height - target_h, int((resized.height - target_h) * focus[1])))
    return resized.crop((left, top, left + target_w, top + target_h))


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def paste_rounded(canvas: Image.Image, image: Image.Image, box: tuple[int, int, int, int], radius: int = 34, shadow: bool = True) -> None:
    x, y, width, height = box
    crop = fit_crop(image, (width, height))
    mask = rounded_mask((width, height), radius)
    if shadow:
        shadow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        shadow_shape = Image.new("L", (width, height), 0)
        ImageDraw.Draw(shadow_shape).rounded_rectangle((0, 0, width - 1, height - 1), radius=radius, fill=110)
        shadow_shape = shadow_shape.filter(ImageFilter.GaussianBlur(18))
        shadow_layer.paste((34, 25, 47, 100), (x, y + 14), shadow_shape)
        canvas.alpha_composite(shadow_layer)
    canvas.paste(crop.convert("RGBA"), (x, y), mask)


def image_overlay(image: Image.Image, color: str, opacity: int) -> Image.Image:
    overlay = Image.new("RGBA", image.size, color)
    overlay.putalpha(opacity)
    base = image.convert("RGBA")
    base.alpha_composite(overlay)
    return base


def add_grain(canvas: Image.Image, amount: int = 7, opacity: int = 12) -> None:
    random.seed(1706)
    noise = Image.effect_noise(canvas.size, amount).convert("L")
    alpha = noise.point(lambda value: int(value * opacity / 255))
    layer = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    layer.putalpha(alpha)
    canvas.alpha_composite(layer)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        words = paragraph.split()
        line = words[0]
        for word in words[1:]:
            candidate = f"{line} {word}"
            if draw.textbbox((0, 0), candidate, font=text_font)[2] <= max_width:
                line = candidate
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def draw_text_block(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    text_font: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    spacing: int = 12,
) -> int:
    x, y = xy
    lines = wrap_text(draw, text, text_font, max_width)
    ascent, descent = text_font.getmetrics()
    line_height = ascent + descent + spacing
    for line in lines:
        draw.text((x, y), line, font=text_font, fill=fill)
        y += line_height
    return y


def recolor_wordmark(color: str, width: int) -> Image.Image:
    source = Image.open(WORDMARK_PATH).convert("RGBA")
    height = round(source.height * width / source.width)
    source = source.resize((width, height), Image.Resampling.LANCZOS)
    alpha = source.getchannel("A")
    mark = Image.new("RGBA", source.size, color)
    mark.putalpha(alpha)
    return mark


def draw_header(canvas: Image.Image, index: int, color: str, mark_color: str | None = None) -> None:
    draw = ImageDraw.Draw(canvas)
    mark = recolor_wordmark(mark_color or color, 360)
    canvas.alpha_composite(mark, (64, 140))
    draw.ellipse((65, 220, 79, 234), fill=color)
    draw.text((90, 214), "atlas chmur i atmosfery", font=roobert(24), fill=color)
    bar_y = 86
    gap = 12
    bar_width = 176
    for i in range(5):
        x = 64 + i * (bar_width + gap)
        fill = color if i <= index - 1 else color + "55"
        draw.rounded_rectangle((x, bar_y, x + bar_width, bar_y + 7), radius=4, fill=fill)


def draw_footer(draw: ImageDraw.ImageDraw, index: int, color: str) -> None:
    draw.text((64, 1814), f"0{index} / 05", font=roobert_bold(24), fill=color)
    draw.text((865, 1814), "CHMURNIK", font=roobert_bold(24), fill=color)


def story_1() -> Image.Image:
    canvas = Image.new("RGBA", (W, H), PINK)
    draw_header(canvas, 1, OLIVE)
    draw = ImageDraw.Draw(canvas)
    draw.text((64, 330), "PRZED SEZONEM MAZURSKIM", font=roobert_bold(25), fill=OLIVE)
    y = draw_text_block(draw, (64, 395), "Bangla?\nNie bangla?", romie(142), OLIVE, 930, spacing=-6)
    draw_text_block(
        draw,
        (64, y + 42),
        "I czy na Mazury brać sztormiak, czy wystarczy lekka wiatrówka?",
        roobert(46),
        OLIVE,
        920,
        spacing=14,
    )
    hero = Image.open(HERO_ART_PATH)
    paste_rounded(canvas, hero, (64, 1115, 952, 560), radius=46, shadow=True)
    draw.rounded_rectangle((100, 1574, 452, 1634), radius=30, fill=CREAM)
    draw.text((130, 1584), "NIE ZGADUJ. SPRAWDŹ.", font=roobert_bold(24), fill=OLIVE)
    draw_footer(draw, 1, OLIVE)
    add_grain(canvas)
    return canvas


def story_2() -> Image.Image:
    canvas = Image.new("RGBA", (W, H), OLIVE)
    draw_header(canvas, 2, CREAM, mark_color=CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.text((64, 330), "MODEL TO NIE CAŁE NIEBO", font=roobert_bold(25), fill=PINK_LIGHT)
    y = draw_text_block(
        draw,
        (64, 395),
        "Prognoza to jedno.\nPatrzenie w niebo\nto drugie.",
        romie(94),
        PINK_LIGHT,
        940,
        spacing=-2,
    )
    draw_text_block(
        draw,
        (64, y + 34),
        "Windy staje się znacznie lepsze, kiedy rozumiesz, co właściwie pokazuje.",
        roobert(38),
        CREAM,
        900,
        spacing=12,
    )
    windy = Image.open(WINDY_UI_PATH)
    paste_rounded(canvas, windy, (64, 1150, 952, 500), radius=34, shadow=True)
    draw.rounded_rectangle((88, 1120, 340, 1180), radius=30, fill=PURPLE)
    draw.text((120, 1131), "WARSTWY / WINDY", font=roobert_bold(23), fill=WHITE)
    draw_footer(draw, 2, PINK_LIGHT)
    add_grain(canvas)
    return canvas


def story_3() -> Image.Image:
    canvas = Image.new("RGBA", (W, H), PINK)
    draw_header(canvas, 3, OLIVE)
    draw = ImageDraw.Draw(canvas)
    draw.text((64, 330), "INTRODUCING CHMURNIK", font=roobert_bold(25), fill=PURPLE)
    y = draw_text_block(draw, (64, 395), "Taki zielnik,\ntylko z chmurami.", romie(118), OLIVE, 940, spacing=-2)
    draw_text_block(
        draw,
        (64, y + 35),
        "Od pierwszego spojrzenia po ekspercką klasyfikację. Zawsze ze źródłami.",
        roobert(40),
        OLIVE,
        910,
        spacing=13,
    )
    atlas = Image.open(ATLAS_UI_PATH)
    paste_rounded(canvas, atlas, (64, 1120, 952, 500), radius=34, shadow=True)
    draw.rounded_rectangle((90, 1582, 506, 1646), radius=32, fill=PURPLE)
    draw.text((122, 1593), "ATLAS · DOWÓD · ŹRÓDŁA", font=roobert_bold(23), fill=WHITE)
    draw_footer(draw, 3, OLIVE)
    add_grain(canvas)
    return canvas


def story_4() -> Image.Image:
    canvas = Image.new("RGBA", (W, H), NAVY)
    draw_header(canvas, 4, CREAM, mark_color=CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.text((64, 330), "ATLAS TO DOPIERO POCZĄTEK", font=roobert_bold(25), fill=CORAL)
    y = draw_text_block(
        draw,
        (64, 395),
        "Pogoda ma też\nswój język.",
        romie(118),
        CREAM,
        940,
        spacing=-2,
    )
    draw_text_block(
        draw,
        (64, y + 35),
        "Zjawiska atmosferyczne, pogodowi „false friends” i METAR bez tajemnic.",
        roobert(40),
        MIST,
        910,
        spacing=13,
    )
    metar = Image.open(METAR_UI_PATH)
    paste_rounded(canvas, metar, (64, 1120, 952, 500), radius=34, shadow=True)
    draw.rounded_rectangle((88, 1090, 475, 1154), radius=32, fill=PURPLE)
    draw.text((120, 1101), "ĆWICZENIA · TESTY · METAR", font=roobert_bold(23), fill=WHITE)
    draw_footer(draw, 4, CREAM)
    add_grain(canvas)
    return canvas


def story_5() -> Image.Image:
    nlc = fit_crop(Image.open(NLC_PATH), (W, 780), focus=(0.5, 0.45)).convert("RGBA")
    nlc = image_overlay(nlc, NAVY, 58)
    canvas = Image.new("RGBA", (W, H), PURPLE_DARK)
    canvas.alpha_composite(nlc, (0, 0))
    draw = ImageDraw.Draw(canvas)
    mark = recolor_wordmark(CREAM, 360)
    canvas.alpha_composite(mark, (64, 140))
    draw.ellipse((65, 220, 79, 234), fill=CREAM)
    draw.text((90, 214), "atlas chmur i atmosfery", font=roobert(24), fill=CREAM)
    for i in range(5):
        x = 64 + i * 188
        draw.rounded_rectangle((x, 86, x + 176, 93), radius=4, fill=CREAM)

    draw.rounded_rectangle((64, 690, 500, 750), radius=30, fill=PINK)
    draw.text((96, 701), "BEZPŁATNIE · BEZ KONTA", font=roobert_bold(23), fill=OLIVE)
    draw.text((64, 870), "W SAM RAZ PRZED SEZONEM MAZURSKIM", font=roobert_bold(25), fill=PINK_LIGHT)
    y = draw_text_block(
        draw,
        (64, 935),
        "Można zadać szyku.\nMożna też po prostu\nnie zmoknąć.",
        romie(94),
        CREAM,
        950,
        spacing=-3,
    )
    draw.rounded_rectangle((64, y + 70, 1016, y + 200), radius=32, fill=PINK)
    draw.text((104, y + 94), "OTWÓRZ CHMURNIK", font=roobert_bold(30), fill=OLIVE)
    draw.text((104, y + 138), "jakiesluchawki.github.io/chmurnik", font=roobert(26), fill=OLIVE)
    draw.text((64, 1740), "atlas · warstwy · testy · METAR · źródła", font=roobert(28), fill=PINK_LIGHT)
    draw_footer(draw, 5, PINK_LIGHT)
    add_grain(canvas)
    return canvas


def story_6() -> Image.Image:
    canvas = Image.new("RGBA", (W, H), PINK)
    draw = ImageDraw.Draw(canvas)
    mark = recolor_wordmark(OLIVE, 360)
    canvas.alpha_composite(mark, (64, 140))
    draw.ellipse((65, 220, 79, 234), fill=OLIVE)
    draw.text((90, 214), "atlas chmur i atmosfery", font=roobert(24), fill=OLIVE)

    draw.text((64, 335), "PYTANIE DO INTERNETU", font=roobert_bold(25), fill=PURPLE)
    draw_text_block(draw, (64, 410), "Domena", romie(100), OLIVE, 940, spacing=0)
    draw.text((64, 530), "chmurnik.cloud", font=romie(104), fill=OLIVE)
    draw_text_block(draw, (64, 680), "jest dostępna.", romie(100), OLIVE, 940, spacing=0)
    draw_text_block(draw, (64, 835), "Bierzemy?", romie(138), OLIVE, 940, spacing=0)

    art = Image.open(ATMOSPHERE_ART_PATH)
    paste_rounded(canvas, art, (64, 1190, 952, 500), radius=44, shadow=True)
    draw.text((64, 1814), "BONUS / ANKIETA", font=roobert_bold(24), fill=OLIVE)
    draw.text((865, 1814), "CHMURNIK", font=roobert_bold(24), fill=OLIVE)
    add_grain(canvas)
    return canvas


def main() -> None:
    FULL.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    stories = [story_1(), story_2(), story_3(), story_4(), story_5(), story_6()]
    titles = [
        "Bangla? Nie bangla?",
        "Prognoza i patrzenie w niebo",
        "Chmurnik: zielnik z chmurami",
        "Pogoda ma swój język",
        "Otwórz Chmurnik",
        "Domena chmurnik.cloud",
    ]
    manifest = []
    for index, (story, title) in enumerate(zip(stories, titles), start=1):
        filename = f"story-{index:02d}.png"
        full_path = FULL / filename
        preview_path = PREVIEW / filename.replace(".png", ".jpg")
        story.convert("RGB").save(full_path, "PNG", optimize=True)
        preview = story.convert("RGB")
        preview.thumbnail((540, 960), Image.Resampling.LANCZOS)
        preview.save(preview_path, "JPEG", quality=86, optimize=True)
        manifest.append({
            "id": f"chmurnik-story-{index:02d}",
            "index": index,
            "title": title,
            "src": f"full/{filename}",
            "href": f"full/{filename}",
            "format": "Instagram Story",
            "width": W,
            "height": H,
        })
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    source_note = """CHMURNIK — Instagram Stories\n\nFormat: 1080 × 1920 px, 5 plansz głównych i bonusowa ankieta domenowa.\nTypografia: Romie Regular, Roobert Regular/Bold — fonty użytkownika z aplikacji CHMURNIK.\nTreść: publiczny post LinkedIn Mieszka Mahbooba z 18 czerwca 2026 oraz copy aplikacji.\nProdukt: prawdziwe zrzuty interfejsu; nie generowano fałszywego UI.\nFotografia NLC: Matthias Süßen, CC BY-SA 4.0, Wikimedia Commons.\nGrafika abstrakcyjna: materiał projektu wskazany przez użytkownika.\n"""
    (OUT / "provenance.txt").write_text(source_note, encoding="utf-8")


if __name__ == "__main__":
    main()
