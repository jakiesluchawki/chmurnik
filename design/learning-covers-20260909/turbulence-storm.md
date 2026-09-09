# Turbulence and Storm Cover Provenance

Date: 2026-09-09
Project: CHMURNIK weather-learning catalog
Active Lore task: 0043 (confirmed by reading current-session files)
Production route: built-in `image_gen.imagegen`, one separate new-image call per cover.
Attempts: turbulence 1/2; storm 1/2. Both first attempts accepted after visual inspection.
Reference images: none.
Receipts: both tool results emitted with `generatedImage`.
Scope: only the two assigned WebP assets and this provenance file were written in the shared repository. No creative board, agents, integration changes, mechanical UI image changes, Lore edits, publishing, or git commits.

## Export Pipeline

Existing project dependency `sharp`; Lanczos3 downsampling to 1000 px width with `withoutEnlargement: true`, followed by WebP encoding at quality 86. Original proportions preserved, with integer height rounded to 667 px. No upscaling, additional sharpening, compositing, retouching, or Python image editing. The generated PNG originals remain untouched at the built-in paths below.

Both source files are 1536 x 1024 px. Both final assets are 1000 x 667 px WebP.
A centered 16:9 crop was additionally reviewed at 320 x 180 px using in-memory previews only; no QA image files were saved.

## Turbulence

- Final asset: `/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/turbulence-v1.webp`
- Built-in source: `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-c1d1-70c1-b6b9-d77c87bd04bb/exec-1fc74744-a92e-4ea5-accb-f7efa387a2c7.png`
- Source: PNG, 1536 x 1024 px, 2,178,218 bytes.
- Output: WebP, 1000 x 667 px, quality 86, 60,852 bytes (59.43 KiB).
- Output SHA-256: `8498bf3811795fbb477c7ea3f3cc0f8a0b8cab816e059cd6902a53417698e253`

### Exact Prompt

```text
Use case: stylized-concept
Asset type: polished raster cover illustration for the CHMURNIK weather-learning catalog, decorative conceptual artwork, not a scientific diagram or photographic evidence.
Primary request: An elegant sculptural close side view of long silky felt airflow ribbons in subdued lavender and warm ivory passing over a low olive-moss ridge. They arrive smoothly and horizontally from the left, then curl into exactly two loose irregular eddy loops downwind on the right, one larger and one smaller, with asymmetric organic shapes and visible continuity from the incoming ribbons. A few tiny cloud wisps are embedded in the airflow.
Style/medium: Premium editorial miniature felt and wool diorama, mature tactile sculptural design. Real fine wool fibres, softly combed silky ribbon surfaces and subtle handmade material variation, refined museum-quality textile sculpture rather than a toy or cartoon.
Scene/backdrop: Spacious warm ivory and faint blush background, softly layered. A low olive ridge occupies the lower portion; landscape remains subordinate to the flowing ribbons.
Composition/framing: Landscape 1536x1024. Dynamic lateral composition seen from the side, generous ivory/blush negative space above and around the sculpture. All defining ribbon curls and ridge crest stay central, fully contained inside a centered 16:9 crop; keep the important scene within the middle 74 percent of image height. Ribbons should clearly read as flowing air, not typography.
Lighting/mood: Beautiful soft side lighting, delicate contact shadows and luminous fibres, calm but visibly kinetic.
Color palette: Warm ivory and blush dominant, pale lavender ribbons with ivory companions, low olive moss terrain and restrained violet accents.
Constraints: One distinct finished illustration, no collage. No frames, logos, text, numbers, arrows, icons, people or watermark. No alphabet-like ribbon shapes, no sea waves, no ocean, no airplane, no generic cloud icon. No glossy plastic, no cute faces, no cartoon styling.
```

### Visual QA

PASS: original generated image inspected from its native image receipt; saved WebP inspected with `view_image`; centered 16:9 card-size preview inspected separately.
Lavender and ivory fibres flow laterally from the left across the low olive ridge and curl into two unequal eddies to the right. Small cloud wisps sit within the flow. Warm blush/ivory negative space and tactile side lighting remain visible after export.
Both eddies and ridge crest survive the centered 16:9 crop. The left-hand incoming ribbons deliberately continue beyond the left canvas edge; this reads as continuous incoming airflow, not an accidentally clipped focal object. No visible text, letters, numbers, arrows, icon, frame, logo, person, airplane, sea, or watermark.

## Storm

- Final asset: `/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/storm-v1.webp`
- Built-in source: `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-c1d1-70c1-b6b9-d77c87bd04bb/exec-5434f2ff-3116-4af7-a3b6-b969ab7713dc.png`
- Source: PNG, 1536 x 1024 px, 2,434,665 bytes.
- Output: WebP, 1000 x 667 px, quality 86, 86,746 bytes (84.71 KiB).
- Output SHA-256: `00037ca4979a764e9a667c6697a4910059b39a245a509520e15c9c9f8a323558`

### Exact Prompt

```text
Use case: stylized-concept
Asset type: polished raster cover illustration for the CHMURNIK weather-learning catalog, decorative conceptual artwork, not a scientific diagram or photographic evidence.
Primary request: A dramatic but beautiful distant tall mature cumulonimbus sculpted entirely from fine felt and wool. A strong vertical cauliflower tower rises from a dark violet cloud base into a broad flattened fibrous anvil top extending decisively to the right. The tower has substantial height, layered billowing lobes and a coherent storm silhouette. Delicate thin rain threads fall from the dark base all the way to a low olive plain.
Style/medium: Premium editorial miniature felt and wool diorama, adult tactile sculptural design, exquisite real wool fibre texture and refined layered textile construction. Neither toy nor cartoon.
Scene/backdrop: Muted mauve twilight sky and pale coral horizon above a quiet low olive plain. A modest tiny break of light appears at one horizon edge, restrained rather than theatrical sunbeams.
Composition/framing: Landscape 1536x1024. One monumental storm structure filling the usable composition height, distinctly vertical in contrast to the broad low ground. The upper tower and complete right-extending flat anvil, cloud base, rain and ground contact must all fit comfortably within the middle 74 percent of the image height so a centered 16:9 crop preserves the full defining storm. Keep the entire storm horizontally contained with spacious negative sky on both sides. Distant landscape side view, no close-up puff crop.
Lighting/mood: Beautiful soft side lighting reveals warm ivory and lavender upper fibres and deep violet lower folds. Restrained twilight drama, quiet and majestic, with palpable material depth.
Color palette: Muted mauve and subdued lavender dominant, warm ivory upper cloud, deep violet base, pale coral horizon, low olive moss plain, subtle blush accents.
Constraints: One distinct finished illustration, no collage. No frames, logos, text, numbers, arrows, icons, people or watermark. No cute isolated cloud puff, no faces, no thunderbolt icon, no lightning, no violent destruction. No glossy plastic, no cartoon styling.
```

### Visual QA

PASS: original generated image inspected from its native image receipt; saved WebP inspected with `view_image`; centered 16:9 card-size preview inspected separately.
The composition is distinctly different from turbulence: a monumental vertical cauliflower tower, broad flattened fibrous anvil extending right, deep violet base and thin rain threads reaching the quiet olive plain. Mauve twilight, a coral horizon and a small light break at the left edge create restrained drama.
The full defining tower, anvil, base and rain-to-ground relationship remain legible in the centered 16:9 crop. Upper fibre wisps sit close to the crop's top edge, so the centered crop should be retained rather than tightening vertically. Fine wool detail remains visible in the 1000 px export; rain is still readable at card size. No visible text, numbers, arrows, icon, frame, logo, person, lightning, violent destruction, or watermark.

## Use and Verification Limits

These are decorative AI-generated conceptual felt illustrations, not scientific diagrams or authentic photographic evidence for cloud identification. Visual QA is an artwork/export review, not meteorological validation. No browser integration, real catalog layout, physical device, application behavior, or deployment was tested or changed by this delegated asset task; the coordinator owns integration.

