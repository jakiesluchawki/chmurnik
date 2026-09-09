# Niebo ma swoje powody

The owner approved the complete value-led, first-person-singular copy on
9 September 2026 and explicitly authorized final image generation.
All ten stories and all three platform posts remain verbatim in copy.mjs.

## Delivery

- Permanent library: https://jakiesluchawki.github.io/chmurnik/assetySM/
- Pack: https://jakiesluchawki.github.io/chmurnik/premiera/pracownie/
- 10 Stories PNG, 1080 x 1920, with 180px top and 240px bottom safe areas.
- 10 carousel PNG, 1080 x 1350, retaining the same complete copy.
- One Facebook PNG, 1080 x 1350, with the full separate Facebook caption.
- One ten-page LinkedIn PDF, embedded fonts, selectable text and working links.
- Five platform/full ZIPs, three captions, sticker links and publication notes.

Ten distinct 1536 x 1024 native ImageGen illustrations are preserved in art/.
They are editorial artwork, not cloud-identification evidence, interface
screenshots or exact scientific diagrams. Each JSON contains its prompt and
provenance. Existing brand wordmark and licensed Romie/Roobert fonts are reused.

## Production

Four agents participated in this graphics phase: the coordinator composed
the exact copy, deterministic exports, gallery and QA; Kepler generated art
01-03; Sartre generated 04-06; Sagan generated 07-10. All image workers finished
and were closed. This count is separate from the earlier app-development team.

The native image generation tool created artwork only. fontkit and resvg
render exact OTF glyph paths into PNG; PDFKit retains actual text in the PDF.
Export-only dependencies live in .local/social-export-tools, never in app
dependencies. Reproduction requires pdfkit 0.17.2, fontkit 2.0.4 and
@resvg/resvg-js 2.6.2 there. Rendering also uses the existing sharp dependency.

Run render.mjs only after approved copy and all ten source illustrations exist.
Run build.mjs to verify export hashes and regenerate the gallery and ZIPs;
then run ../library/build.mjs. CI rebuilds download packaging from the checked-in
final assets; it does not invoke ImageGen or depend on local rendering tools.

## Verification

- Six targeted social tests and all 929 Node tests pass.
- Independent PDFium rendering of all ten PDF pages, with pypdf confirming
  the complete approved title/body and clickable workshop link on every page.
- Dimensions, unique original-art hashes, complete copy, PNG/PDF/ZIP hashes,
  ZIP entry lists, safe layout and headline/image/body separation checked.
- All 21 PNG compositions and all PDF pages visually inspected in contact
  sheets, with full-size review of dense type and METAR pages.
- Local browser: 390x700 and 320x640 without horizontal overflow; full-text
  copying confirmed. Desktop preview keeps separate Story/carousel downloads.
- No social account publication, native rebuild, Apple upload, classifier
  change, production-domain upload or security change belongs to this pack.

Apple availability is the confirmed submission state on the copy approval
date, not a promise that review has completed. Recheck before reusing later.
