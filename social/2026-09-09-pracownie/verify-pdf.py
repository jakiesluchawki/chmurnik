"""Independent PDF text/link checks and PDFium render, not browser automation."""
import json
from pathlib import Path
import unicodedata
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image

here = Path(__file__).resolve().parent
site = here / "site"
qa = here.parent.parent / "build/social-pracownie-qa"
qa.mkdir(parents=True, exist_ok=True)
manifest = json.loads((site / "exports-manifest.json").read_text())
slides = [a for a in manifest["artworks"] if a["format"] == "karuzela"]
file = site / "CHMURNIK-PRACOWNIE-LINKEDIN.pdf"
reader = PdfReader(file)
doc = pdfium.PdfDocument(file)
assert len(reader.pages) == len(doc) == 10
normalize = lambda s: " ".join(unicodedata.normalize("NFKC", s).split())
results = []
sheet = Image.new("RGB", (1120, 564), "#d9d0c5")
for i, (page, slide) in enumerate(zip(reader.pages, slides)):
    assert float(page.mediabox.width) == 1080
    assert float(page.mediabox.height) == 1350
    text = normalize(page.extract_text())
    assert normalize(slide["title"]) in text, (i + 1, "headline missing")
    assert normalize(slide["text"]) in text, (i + 1, "body missing")
    links = [a.get_object().get("/A", {}).get("/URI") for a in page.get("/Annots", [])]
    assert "https://chmurnik.cloud/pogoda-preview/" in links
    bitmap = doc[i].render(scale=1)
    image = bitmap.to_pil().convert("RGB")
    image.save(qa / f"pdf-{i + 1:02d}.png")
    sheet.paste(image.resize((216, 270)), (8 + i % 5 * 224, 8 + i // 5 * 278))
    results.append({"page": i + 1, "completeText": True, "links": links, "rendered": True})
sheet.save(qa / "pdf-contact-sheet.png")
(qa / "pdf-verification.json").write_text(json.dumps(results, indent=2) + "\n")
print(json.dumps({"pages": len(results), "completeApprovedText": True, "clickableLinks": True, "independentRender": "PDFium"}))
