"""Independently verify all PDF texts, links and rendered page layouts."""
import json
from pathlib import Path
import unicodedata
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image

here = Path(__file__).resolve().parent
site = here / "site"
qa = here.parent.parent / "build/social-niebo-woda-qa"
qa.mkdir(parents=True, exist_ok=True)
manifest = json.loads((site / "exports-manifest.json").read_text())
normalize = lambda s: " ".join(unicodedata.normalize("NFKC", s).split())
results = []
for document in manifest["documents"]:
    theme = document["theme"]
    slides = [a for a in manifest["artworks"] if a["theme"] == theme and a["format"] == "karuzela"]
    reader = PdfReader(site / document["file"])
    pdf = pdfium.PdfDocument(site / document["file"])
    assert len(reader.pages) == len(pdf) == len(slides) == 10
    assert reader.metadata["/Author"].get_object() == "Mieszko Mahboob"
    sheet = Image.new("RGB", (1120, 596), "#d9d0c5")
    for i, (page, slide) in enumerate(zip(reader.pages, slides)):
        assert float(page.mediabox.width) == 1080
        assert float(page.mediabox.height) == 1440
        text = normalize(page.extract_text())
        assert normalize(slide["title"]) in text, (theme, i + 1, "missing headline")
        assert normalize(slide["text"]) in text, (theme, i + 1, "missing body")
        links = [a.get_object().get("/A", {}).get("/URI") for a in page.get("/Annots", [])]
        assert document["link"] in links
        bitmap = pdf[i].render(scale=1)
        image = bitmap.to_pil().convert("RGB")
        image.save(qa / f"{theme}-pdf-{i + 1:02d}.png")
        sheet.paste(image.resize((216, 288)), (8 + i % 5 * 224, 8 + i // 5 * 298))
        results.append({"theme": theme, "page": i + 1, "completeText": True, "links": links, "rendered": True})
    sheet.save(qa / f"{theme}-pdf-contact-sheet.png")
    pdf.close()
(qa / "pdf-verification.json").write_text(json.dumps(results, indent=2) + "\n")
print(json.dumps({"documents": 2, "pages": len(results), "completeText": True, "clickableLinks": True, "independentRender": "PDFium"}))
