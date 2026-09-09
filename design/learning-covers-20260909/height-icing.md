# CHMURNIK Learning Covers: Height and Icing

Date: 2026-09-09
Active task: lore0043
Scope: two delegated decorative raster cover illustrations only.

## Generation and Export

- Generator: built-in image_gen.imagegen; no CLI/API fallback.
- Two separate native calls, one per image. Both first attempts accepted; no retries.
- No reference images used. Exact submitted prompts are preserved below.
- Native PNG originals remain at their built-in source paths, unchanged.
- Export: existing sharp 0.32.6, width 1000, withoutEnlargement true,
  Lanczos3 resampling, WebP quality 86. Original aspect ratio retained.
- No upscaling, compositing, retouching, text overlays, or final-file cropping.
- Both assets are decorative conceptual illustrations, not scientific diagrams,
  authentic observation photographs, or operational safety guidance.
- Creative board, integration, and catalog wiring remain coordinator-owned.
  No board opened, agents launched, git commits, UI/code edits, or mechanical
  illustration changes were made by this worker.

## Height

Output: `/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/height-v1.webp`

Built-in source: `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-c02b-7790-b626-93c512f8be43/exec-28b3d8be-b5da-4373-8525-c08d2dafd086.png`

| Property | Value |
| --- | --- |
| Source format / dimensions | PNG / 1536 x 1024 px |
| Source size | 2389479 bytes |
| Output format / dimensions | WebP / 1000 x 667 px |
| Output size | 97012 bytes / 94.74 KiB |
| Size reduction | 95.94% |
| Source SHA-256 | `06a3faea95cf11dfb330360eeee607f5a946f70f5147afba910c683e5c894133` |
| Output SHA-256 | `910ccde64717be3a12f2135b75601800ddd7a533ac20c7953effdb29c2454ed2` |

### Exact Prompt

```text
Use case: stylized-concept
Asset type: polished raster COVER illustration for the existing CHMURNIK weather-learning catalog; decorative conceptual artwork, not a scientific diagram or photographic evidence.
Primary request: a side-on physical miniature felt-and-wool diorama comparing an olive mountain ridge on the right with a lower sea on the left. The primary hero is terrain and a single level thread.
Scene and composition: landscape image, ideally 1536x1024. Warm cream open sky with a clearly visible sea horizon. Rich deep purple-blue felt sea surface fills the lower left. A terraced, sculptural olive-moss ridge rises on the right, showing warm ivory, muted blush and earth-tone cutaway strata underneath. Two slim ivory posts support ONE slender taut horizontal ivory thread across the sea AND ridge, at exactly the same constant height from left to right. The ridge remains well below the thread, with a generous uninterrupted gap of visible air above even its tallest point. This physical thread is the clear common height reference, without labels or measurement marks. Keep both posts, the entire taut thread, ridge summit, sea horizon and visible earth strata within the central safe area, fully readable in a centered 16:9 crop. Balanced spacious layered composition, a near-side-on view with just enough depth to reveal tactile surface relief. No separate panels.
Style and materials: premium editorial sculptural adult design, exquisite real wool fibres and layered felt construction, restrained architectural miniature, NOT a toy or cute cartoon. Sea gently rippled in purple and blue wool; moss-olive terrain shaped in quiet terraces; delicate thread visibly legible against the warm cream background through soft natural shadow and tonal separation.
Lighting and palette: beautiful soft side lighting, subtle contact shadows, refined warm ivory and olive dominant colors with deep violet/blue sea, very restrained blush pink and subdued lavender accents.
Constraints: clean cover artwork only. No frames, logos, text, letters, numbers, arrows, icons, measurement ticks, people, watermark, clouds or cloud puffs. No floating terrain above the thread. No aircraft. No artificial UI overlays.
```

### Visual QA

PASS. Inspected native output in its generatedImage receipt and decoded final
WebP with view_image. Rich violet-blue felt sea is on the left; terraced
olive-moss coastal ridge and exposed ivory/blush/lavender earth layers are on
the right. One thin continuous horizontal thread spans both posts at a constant
level. Air remains visibly clear between the ridge vegetation and the thread.
Warm cream sky, visible horizon, tactile wool fibres, restrained side lighting,
and adult editorial treatment are present. No visible text, logo, watermark,
frame, arrows, people, cloud puffs, or UI markings.

Also inspected a memory-only centered cover-crop preview: extract
left 0, top 52, width 1000, height 562, then downsample to 640 px width.
The complete thread, both posts, horizon, elevated terrain, and exposed
strata remain readable. Lower foreground is cropped as intended.
No QA image files were written.

## Icing

Output: `/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/icing-v1.webp`

Built-in source: `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-c02b-7790-b626-93c512f8be43/exec-3ce534f2-6b53-4e49-97f7-020ba1e592db.png`

| Property | Value |
| --- | --- |
| Source format / dimensions | PNG / 1536 x 1024 px |
| Source size | 1917999 bytes |
| Output format / dimensions | WebP / 1000 x 667 px |
| Output size | 50810 bytes / 49.62 KiB |
| Size reduction | 97.35% |
| Source SHA-256 | `17ee10c46de0544e1c9ac168577520a5fe7b1a39d7e4b814c1a99f6b2810eb39` |
| Output SHA-256 | `176643c3a1df504d8516a04aa76cd179aea74a2fd9712dd13ed13d29325c7ba1` |

### Exact Prompt

```text
Use case: stylized-concept
Asset type: polished raster COVER illustration for the existing CHMURNIK weather-learning catalog; decorative conceptual depiction of aircraft icing, not a scientific diagram, photographic evidence or full risk assessment.
Primary request: an extreme close-up of a graceful ivory aircraft wing leading edge crossing the landscape frame diagonally. The rounded leading edge has clearly visible delicate translucent frosted crystalline rime accretion ONLY along that rounded forward edge. The broad smooth wing surface stays clean and uniced so the edge-localized frost is unmistakable.
Scene and composition: landscape image, ideally 1536x1024. Elegant studio scientific-material portrait against a spacious deep muted periwinkle background. A single cropped wing segment crosses from the lower left toward the upper right, with its softly rounded leading edge and central frost detail fully legible inside a centered 16:9 crop. No aircraft body and no complete airplane. Sparse tiny suspended liquid beads near the edge, clearly a few individual round translucent droplets rather than a shower. A few very soft ivory vapor wisps in the background, secondary and unobtrusive. Strong graceful diagonal, generous atmospheric negative space and a carefully lit central focal area.
Style and materials: premium tactile sculptural adult editorial design, NOT toy cartoon. The aircraft wing is an elegant ivory satin-metal and fine wool/felt hybrid, with restrained real fibre texture on the clean ivory surface. The rime itself looks genuinely crystalline: delicate translucent frost needles, feathery microcrystals and finely faceted ice adhering to the rounded leading edge, visibly distinct from wool or fluffy cotton. Closely observed material detail with a shallow but sufficient depth of field to keep the central frost cluster crisp.
Lighting and palette: beautiful soft side lighting reveals the frosted crystal relief, subtle cool highlights and soft violet shadows. Ivory wing against deep subdued periwinkle/lavender-violet; extremely restrained blush reflected highlights. Calm, refined material study.
Constraints: frost limited to the rounded leading edge, not scattered all over the wing. No snowstorm, disaster, plane fuselage, cockpit, wheels, people, gauges, icons, arrows, text, letters, numbers, logos, frame or watermark. No cartoon face, toy aircraft, diagram overlays or oversized snowflakes.
```

### Visual QA

PASS. Inspected native output in its generatedImage receipt and decoded final
WebP with view_image. A single cropped ivory wing crosses diagonally from lower
left toward upper right. The visibly crystalline, translucent frost is
concentrated on the rounded leading edge while the broad satin/felt wing
surface remains clean. A few distinct liquid beads and soft ivory vapor wisps
sit against a muted periwinkle background. The central ice detail remains
sharp after export. No airplane body, disaster scene, snowstorm, gauges, icons,
arrows, people, text, logo, frame, or visible watermark.

Also inspected the same memory-only centered 1000 x 562 crop, downsampled to
640 px width. The central frosted edge, beads, clean wing surface, and graceful
diagonal remain legible. No QA image files were written.
Crystalline scale and accretion are stylized for a decorative cover; this is
not a validated physical model or icing-risk assessment.

## Delivery Status

Both requested files are complete, non-empty, and decodable. Source files are
preserved. No blockers. No build, browser integration, or deployment claimed;
those are outside this delegated asset-only scope.

