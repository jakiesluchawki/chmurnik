"""Validate the final document structure and render every page for visual QA."""

import argparse
import json
from pathlib import Path
import subprocess
import unicodedata

from pypdf import PdfReader


parser = argparse.ArgumentParser()
parser.add_argument("--pdftoppm", default="pdftoppm")
args = parser.parse_args()
campaign = Path(__file__).resolve().parent
root = campaign.parent.parent
manifest = json.loads((campaign / "site/manifest.json").read_text())
document = manifest["documents"][0]
reader = PdfReader(campaign / "site" / document["file"])
slides = [item for item in manifest["artworks"] if item["format"] == "carousel"]
assert len(reader.pages) == len(slides) == 10


def normalized(value):
    # PDF extractors infer spaces from font kerning; compare every visible character.
    return "".join(unicodedata.normalize("NFC", value).split())


def is_embedded(font):
    font = font.get_object()
    if font.get("/Subtype") == "/Type3":
        glyphs = font.get("/CharProcs", {}).get_object()
        return bool(glyphs) and "/ToUnicode" in font and all(glyph.get_object().get_data() for glyph in glyphs.values())
    descriptor = font.get("/FontDescriptor")
    if descriptor:
        return any(key in descriptor.get_object() for key in ("/FontFile", "/FontFile2", "/FontFile3"))
    return all(is_embedded(child) for child in font.get("/DescendantFonts", [])) and bool(font.get("/DescendantFonts"))


all_links = []
for number, (page, slide) in enumerate(zip(reader.pages, slides), start=1):
    assert abs(float(page.mediabox.width) - 810) < 1
    assert abs(float(page.mediabox.height) - 1012.5) < 1
    text = normalized(page.extract_text())
    for field in ("lead", "body", "note", "cta"):
        if slide.get(field):
            assert normalized(slide[field]) in text, f"Page {number}: missing {field}"
    fonts = page["/Resources"]["/Font"].get_object()
    assert fonts and all(is_embedded(font) for font in fonts.values()), f"Page {number}: unembedded font"
    links = [annotation.get_object().get("/A", {}).get("/URI") for annotation in page.get("/Annots", [])]
    all_links.extend(link for link in links if link)
    if number == 10:
        assert manifest["storeUrl"] in links
    print(f"Page {number:02}: full approved copy, embedded fonts, uniform geometry PASS")

assert "https://commons.wikimedia.org/wiki/File:CirrusField-color.jpg" in all_links
output = root / "build/social-full/pdf"
output.mkdir(parents=True, exist_ok=True)
subprocess.run([args.pdftoppm, "-png", "-r", "72", str(campaign / "site" / document["file"]), str(output / "page")], check=True)
assert len(list(output.glob("page-*.png"))) == 10
print("PDF PASS: ten pages, all approved text, embedded fonts, photo source and App Store links; rendered for visual review.")
