# METAR and Sounding Cover Provenance

Date: 2026-09-09
Active task: lore0043 (verified active; task state not modified).

## Scope and Method

Two decorative conceptual raster covers for the CHMURNIK learning catalog. These are generated felt/wool illustrations, not scientific diagrams or photographic evidence. Built-in imagegen only: one independent generation and one targeted built-in edit per cover, two attempts per output. No CLI/API fallback, additional agents, creative board, integration edits, or git commits. Built-in generatedImage receipts were emitted for all four calls.

Only the two assigned WebP assets and this assigned provenance file were written in the repository. Original PNGs remain in the built-in generation directory. Mechanical UI images were not modified. UI integration and publishing remain coordinator-owned.

## Final Outputs

| Asset | Dimensions | Bytes | KiB | Encoding |
| --- | --- | ---: | ---: | --- |
| `weather-preview/public/covers/metar-v1.webp` | 1000 x 667 | 90,888 | 88.76 | WebP, quality 86, sRGB, opaque |
| `weather-preview/public/covers/sounding-v1.webp` | 1000 x 563 | 26,260 | 25.64 | WebP, quality 86, sRGB, opaque |

Absolute asset paths:

- `/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/metar-v1.webp`
- `/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/sounding-v1.webp`

Existing sharp dependency used for deterministic export only. No upscaling, synthetic sharpening, repainting, or Python image editing.

- METAR: source 1536 x 1024 PNG, 2,345,139 bytes. Export: resize width 1000 with withoutEnlargement=true, then WebP quality 86. Original aspect ratio retained; the catalog can use a centered 16:9 crop.
- Sounding: source 1536 x 1024 PNG, 1,928,795 bytes. Export: source-pixel crop {left: 0, top: 32, width: 1536, height: 864}, resize width 1000 with withoutEnlargement=true, then WebP quality 86. The 16:9 source crop rounds to 1000 x 563 on export. The upward offset preserves balloon headroom and a deliberately tiny olive land accent.

SHA-256:

- METAR: `21b01c3783e7cf0f709b319cf468cc2805d84999b41746507beeeef576343b4c`
- Sounding: `188cc22a2bb99d4ecc596aa60f26bcdc38ef58161a00b96fb8a5bb5aecff079c`

## Source Files

| Cover | Attempt | Status | Built-in source path |
| --- | --- | --- | --- |
| METAR | 1 | Not selected: busy landscape; upper cloud too close to edge | `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-be92-77b3-92f1-862096a32c9a/exec-2b524e71-2b08-410f-942f-7ee8dfe8e385.png` |
| METAR | 2 | Selected, edited from attempt 1 | `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-be92-77b3-92f1-862096a32c9a/exec-01187b75-db8c-4bbb-9a90-085c2a925dbd.png` |
| Sounding | 1 | Not selected: layers read as cloud banks | `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-be92-77b3-92f1-862096a32c9a/exec-5cf8e28e-b52b-4cf4-8e5c-7c1c490f52de.png` |
| Sounding | 2 | Selected, edited from attempt 1 | `/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-be92-77b3-92f1-862096a32c9a/exec-65d51302-36ee-4e0f-a10f-658c1293ea63.png` |

All source images are 1536 x 1024 PNG. Initial METAR source: 2,430,478 bytes. Initial sounding source: 1,938,172 bytes. No source PNG was deleted.

## Visual QA

- Inspected all four built-in generated image receipts at source resolution, both final optimized WebP files, and in-memory 640 x 360 centered-crop previews. QA previews were not written to the repository.
- METAR: distinct ground-focused warm blush/olive composition; a narrow olive runway with four plain ivory dashes, one louvered ivory shelter, one lavender/ivory windsock and two separate ivory wool cloud banks at different heights. No compass motif. Natural fibres, soft side lighting and relief remain visible after compression.
- METAR crop: both cloud banks, the whole shelter and windsock, and all runway dashes remain legible in a centered 16:9 crop. Only lower foreground/runway edge is trimmed by that crop.
- Sounding: distinct sky-focused ivory/blue-lavender composition; one round ivory balloon, one continuous delicate thread and one small suspended instrument, three translucent mauve wool-gauze layers, and a tiny olive corner. No hot-air-balloon basket or panels.
- Sounding crop: the initial 3:2 export put the balloon nearly against the top of a centered 16:9 crop. Corrected with the documented deterministic upward-offset crop; re-inspected the final WebP and 640 x 360 preview. Balloon silhouette now has visible headroom; thread, instrument and all three layers remain readable. The olive land is intentionally only a small bottom-left sliver.
- Both final files: no visible text, numbers, arrows, chart/grid, icons, people, aircraft, logos, watermark, frame or border; no obvious WebP blocking or destructive detail loss at export size.
- These are qualitative visual checks, not a meteorological validation, device/browser integration test, or claim of photographic authenticity. No blockers remain for asset handoff.

## Exact Prompts

### METAR Attempt 1

Built-in generation; no reference image arguments.

```text
Use case: stylized-concept
Asset type: polished raster cover illustration for CHMURNIK weather-learning catalog, decorative conceptual art, not a scientific diagram or photographic evidence.
Primary request: Generate one landscape image, ideally 1536x1024, of a tiny elegant meteorological observation airfield in an elevated three-quarter view. A graphical narrow dark-olive runway with only a few plain ivory center markings crosses the middle of rolling moss-olive terrain. Beside it stand a small warm-ivory louvered Stevenson-screen instrument shelter and one slender lavender-and-ivory windsock pole with a simple tapered windsock. Two sculptural layered ivory cloud banks hover overhead at clearly different heights.
Style/medium: premium editorial miniature felt and wool diorama, mature tactile sculptural design. Real, richly resolved natural fibres and carefully crafted felt edges, refined material realism, not toy-like and not cartoon.
Composition/framing: spacious layered landscape, calm airy negative space, runway and instruments form one legible central scene. Elevated three-quarter perspective, not an overhead map. Keep both cloud banks, shelter, entire windsock and important runway area comfortably inside the central 16:9 crop of the landscape canvas; avoid clipping at the top or bottom. No enclosing platform, frame or border.
Lighting/mood: beautiful soft side lighting, warm peach and blush ambient glow, gentle long dimensional shadows, premium art-directed studio atmosphere.
Color palette: blush pink and peach sky, moss and dark olive terrain and runway, warm ivory structures and cloud banks, restrained subdued lavender accents.
Constraints: NO airplanes, people, text, letters, numbers, charts, arrows, icons, compass, compass rose, logos, watermarks, buildings other than the single instrument shelter, decorative frame, or cartoon faces. The few plain ivory runway center markings are the only graphic marks. This must read as an elegant observation airfield, not a compass or wind-direction cover.
```

### METAR Attempt 2

Built-in edit; referenced_image_paths: ["/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-be92-77b3-92f1-862096a32c9a/exec-2b524e71-2b08-410f-942f-7ee8dfe8e385.png"].

```text
Use case: precise-object-edit
Asset type: final CHMURNIK decorative felt-diorama catalog cover, landscape 1536x1024.
Edit target: the supplied airfield illustration.
Keep the same observation-airfield subject, the dark olive narrow diagonal runway with a few plain ivory center dashes, small ivory louvered Stevenson-screen shelter, slender lavender-and-ivory windsock, two ivory wool cloud banks, warm blush/peach, moss olive and warm ivory palette, and beautiful soft side lighting with visible natural fibre detail.
Change the framing and environment to a MUCH simpler spacious editorial miniature studio diorama. Replace the deep realistic lake/mountain/forest/sunset scenery with smooth sculpted rolling olive felt terrain and a softly lit plain blush felt-paper studio sky. Remove the lake, mountains, tiny trees, rocks and sun disk. No enclosing base or platform. Both cloud banks must be separate compact wool sculptures hanging at different heights, one higher left of centre and one a little lower right of centre. Scale and place every focal object so it is fully contained inside the central 16:9 crop: ALL of the clouds between y=160 and y=380 of the 1024px canvas, instruments around y=490 to y=740, entire runway inside the main middle region. Generous empty blush sky above, modest olive foreground below. Refined elevated three-quarter view, airy architectural model composition, luxurious sculptural adult design and natural wool detail. This is handcrafted conceptual art, NOT a toy, cartoon, actual landscape photograph, compass or weather chart.
No new subjects or decorations. No airplane, text, numbers, letters, arrows, icons, compass, people, logos, watermark, frame or border.
```

### Sounding Attempt 1

Built-in generation; no reference image arguments.

```text
Use case: stylized-concept
Asset type: polished raster cover illustration for the CHMURNIK weather-learning catalog; decorative conceptual cover, not scientific diagram or photographic evidence.
Primary request: Generate one landscape illustration, ideally 1536x1024. A single beautiful round ivory weather balloon carries a tiny suspended radiosonde while ascending above several thin translucent mauve horizontal atmospheric sheets. The balloon has a realistic spherical meteorological balloon silhouette with a small tied neck, not a hot-air balloon. One delicate thin thread clearly connects its neck to one tiny simple ivory instrument. No basket.
Style/medium: premium editorial miniature felt and wool diorama with mature tactile sculptural design, real fine natural fibre textures, restrained art direction, not toy cartoon. Balloon surface is refined soft ivory with barely visible fine fibres; atmospheric sheets resemble very thin, wispy translucent wool gauze, horizontal and delicately undulating.
Composition/framing: vertical feeling of ascent inside a spacious landscape canvas. Balloon in the upper-right quadrant but entirely inside the central 16:9 crop, its top below the upper 15 percent margin. Balloon, thread, and radiosonde form one very clear readable vertical focal group; radiosonde hangs unobstructed against open sky. Sweeping layered sky from pale warm ivory at upper left into muted blue-lavender at right and below. Several thin mauve horizontal atmospheric sheets float below the balloon, with generous open air between them. Only a tiny area of sculptural olive land low left, inside the crop-safe region. Keep key elements within the central 80 percent of image height and away from edges. This is an open, elegant atmosphere with depth and height, not an infographic or a laboratory cross-section.
Lighting/mood: beautiful soft side lighting from the left; luminous ivory highlights, subtle violet shadows, tranquil expansive atmosphere.
Color palette: pale ivory, blue-lavender, subdued mauve, deep violet used very sparingly, tiny olive land accent.
Constraints: no hot-air-balloon panels, no basket, no people, no letters, no text, no numbers, no chart, no grid, no axes, no arrows, no icons, no logos, no watermark, no frames, no other balloon, no clouds hiding the radiosonde.
```

### Sounding Attempt 2

Built-in edit; referenced_image_paths: ["/Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-be92-77b3-92f1-862096a32c9a/exec-5cf8e28e-b52b-4cf4-8e5c-7c1c490f52de.png"].

```text
Use case: precise-object-edit
Asset type: final CHMURNIK decorative felt-and-wool catalog cover, landscape 1536x1024.
Edit target: the supplied weather-balloon illustration.
Keep the single realistic round ivory weather balloon with its tiny tied neck, single delicate thin thread and tiny suspended ivory radiosonde, upper-right focal group, premium natural fibre texture and soft left side lighting. No basket or hot-air-balloon panels.
Refine the environment into spacious sculptural editorial studio art rather than a realistic panorama. Replace the cloud-bank layers with THREE very thin, translucent, pale mauve horizontal sheets of wool gauze, gently sweeping across the lower half, with open air visibly separating each sheet. Their edges should be wispy and finely fibrous, not thick cotton cloud mounds. Keep them below the balloon and behind the suspended instrument without obscuring it. Replace the realistic far mountains and lake with an airy smooth pale ivory to muted blue-lavender background gradient and only ONE small softly rounded moss-olive felt land corner low left. No realistic forest, water, lake, mountains, sun or busy sky texture.
Refine crop safety: place the round balloon fully within x=950 to x=1200 and y=160 to y=430 of the 1536x1024 canvas; delicate vertical thread ends at a small readable radiosonde around y=650. Tiny olive land starts near x=0 and y=810 and remains a minor accent. Three airy atmospheric sheets occupy approximately y=540, y=690 and y=830, with soft undulating edges and broad spaces between them. Preserve lots of negative space to the left and above, all focal elements fully visible within a centered 16:9 crop. Vertical ascent inside an expansive landscape.
Mature, quiet, luxurious tactile felt diorama, NOT a toy, cartoon, diagram, infographic or actual weather photo. No text, letters, numbers, panels, grid, axes, chart, arrows, icons, logos, people, watermark, frame, extra balloons, or basket.
```

