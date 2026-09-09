# Front and Wind Cover Provenance

Date: 2026-09-09
Active task: lore0043
Generation route: built-in image_gen.imagegen only, one separate call per image.
Attempts: front 1/2; wind 1/2. Both first attempts accepted; no retries.
Input references: none. Both are independently generated scenes.
Purpose: decorative conceptual weather-learning catalog covers, not scientific diagrams or photographic evidence.

## Scope

Only these two assigned WebP files and this provenance document were written in the shared repository. The built-in PNG originals remain in their tool-provided source locations. No creative board was opened, no subagents were started, and no git commit was made. Existing mechanical UI imagery, consuming code, other covers, lore files, deployment configuration and production assets were not edited. Catalog integration and application/browser QA belong to the coordinator.

## Export Method

The existing project dependency sharp was used to read each built-in PNG, resize proportionally with width 1000 and withoutEnlargement true, and encode WebP at quality 86. No upscaling, retouching, compositing, color changes, or source cropping were applied to the saved covers. The source aspect ratio is retained with integer rounding to 1000 x 667. Outputs decode as three-channel sRGB WebP without alpha.

Both complete optimized files were visually inspected. Centered 16:9 cover crops were also rendered in memory at 480 x 270 and visually inspected; these temporary views were not saved as additional files. Native generatedImage receipts were emitted for both originals.

## front-v1.webp

- Asset: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/front-v1.webp
- Built-in source: /Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-bde0-7a41-98de-5bc1a20585a6/exec-e9ecf012-dd5d-40e2-a365-702c6a9579e1.png
- Source: PNG, 1536 x 1024, 2211037 bytes.
- Output: WebP, 1000 x 667, 67696 bytes (66.11 KiB), quality 86.
- SHA-256: ad384705533830a7991f52aed5491ff3158d761044ded3cd767fed0d10207171
- Visual QA: PASS on generated original, full optimized file, and centered 16:9 crop. Broad lavender air wedge is separate from the low olive terraced plain; blush air rises into a compact ivory cloud bank at the leading edge. Clear side-profile frontal-lifting metaphor, fine wool fibres, peach sky, and soft side lighting. It does not read as a geological fold or mountain.
- Crop QA: Complete ivory cloud bank and leading-edge interaction remain visible in the centered 16:9 preview. Cloud-top clearance is modest, so avoid a lower-biased vertical crop.
- Exclusions: No visible text, numbers, labels, logos, frames, people, arrows, icons, or watermark.
- Distinction: Landscape-scale layered air volumes and a substantial cloud bank, unlike the sky-led instrument composition of wind-v1.

### Exact Generation Prompt

```text
Use case: stylized-concept
Asset type: polished decorative raster cover illustration for the CHMURNIK adult weather-learning catalog.
Create one landscape image, ideally 1536 x 1024 pixels. A premium editorial miniature felt-and-wool diorama of an advancing COLD FRONT, shown in a broad side profile. A low, dense, smooth lavender mass of air extends horizontally from the left and tapers into a shallow advancing wedge near the center-right, skimming above a flat moss-olive plain. Its leading edge slips underneath a visibly separate warm blush-pink airy felt layer, lifting that blush layer diagonally upward into a tall but compact warm-ivory cloud bank along the wedge's leading edge. Make the distinction between ground and air unmistakable: flat, low olive terraces form only the foreground; the lavender and blush air masses are soft suspended wool volumes above them, not rock or land. Cloud formation reads as a sculptural vertical gathering of soft fibres where the warm layer rises. Keep the cold wedge long, low, and aerodynamic, not peaked. The warm layer stretches back horizontally to the right from the lifting region. Broad pale peach sky with generous breathing room. Spacious layers and a clear directional diagonal rhythm from low left to elevated center-right.
Style/medium: sophisticated tactile sculptural adult editorial design, beautifully art-directed physical felt studio miniature, convincing fine wool fibres, hand-shaped matte forms, restrained sculptural complexity, exceptional material detail, never a toy or cartoon.
Composition/framing: landscape, side view, fully composed cover with no framing border. Focal wedge, lifted blush layer, and entire ivory cloud bank stay comfortably within the central 75 percent of image height, all legible under a centered 16:9 crop. Broad horizontal scene, compact cloud bank rather than a lone generic cumulus. The low terraced foreground anchors rather than dominates.
Lighting/mood: beautiful soft side lighting from the upper left, delicate contact shadows, subtle depth, premium calm atmospheric finish.
Palette: subdued lavender and deep violet accents, moss olive ground, blush pink warm air, warm ivory cloud, pale peach sky. Muted CHMURNIK palette, no saturated primary colors.
Constraints: decorative conceptual weather metaphor, not a scientific diagram and not photographic evidence. No text, numbers, logos, watermark, frames, arrows, diagram labels, icons or people. No mountains, geological strata, folded stone, ocean wave or breaking wave; this must read as atmospheric frontal lifting above flat land.
```

## wind-v1.webp

- Asset: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/public/covers/wind-v1.webp
- Built-in source: /Volumes/Kingston-Codex/host-data/Mac-Studio/.codex/generated_images/01a08382-bde0-7a41-98de-5bc1a20585a6/exec-487c695d-f732-465e-84db-bd7f8a8b66d6.png
- Source: PNG, 1536 x 1024, 2000731 bytes.
- Output: WebP, 1000 x 667, 66834 bytes (65.27 KiB), quality 86.
- SHA-256: dcca67abf5bdbc1796ac8bc66284e6392fd753f0a507c04523aecd0eb73355e5
- Visual QA: PASS on generated original, full optimized file, and centered 16:9 crop. Slender ivory vane with rounded fin and unlettered silhouette, two separated lavender/violet fabric ribbons streaming horizontally, two delicate ivory cloud wisps, and a mossy coastal ledge in the lower right. Sage-green dominant sky grades into blush near the coastal horizon; believable fine fibres and soft side lighting.
- Crop QA: Full vane head and both ribbon lengths remain visible and legible in the centered 16:9 preview. Generous sky and the coastal anchor survive the crop.
- Exclusions: No visible text, numbers, compass letters, labels, logos, frames, people, arrows, graphic icons, or watermark. No large central cumulus.
- Distinction: Asymmetric low-angle instrument-and-ribbons composition with a sage sky, clearly different from front-v1.

### Exact Generation Prompt

```text
Use case: stylized-concept
Asset type: polished decorative raster cover illustration for the CHMURNIK adult weather-learning catalog.
Create one landscape image, ideally 1536 x 1024 pixels. A low-angle macro editorial composition of a beautiful small warm-ivory weather vane / unlettered compass on a slender pole, placed slightly right of center and rooted into a mossy coastal ledge in the lower right. The sculptural weather vane silhouette and soft lavender fabric wind ribbons streaming horizontally to the left are the main subjects, with generous open sky. Use a refined minimal vane: a small rounded ivory pivot, slender ivory crossbars with simple rounded ends, and an elegant oval or rounded rectangular balancing fin, not an arrow. No letters, cardinal initials, dial markings or symbols. Two long narrow lavender wool-fabric ribbons fastened just beneath the vane stream leftward, mostly horizontal, separated enough to read clearly, with subtle natural undulation and a small deep-violet accent in their folds. The vane and the complete ribbons stay central and clearly silhouetted against the sky. Exactly two delicate, small, elongated ivory wool cloud wisps hang quietly in the wide background sky, secondary to the vane, never a large cumulus. A low moss-olive coastal ledge at lower right is the only substantial ground mass; a very subtle distant coastal horizon leaves the left and upper scene spacious.
Style/medium: premium tactile sculptural adult editorial design, beautiful physical felt-and-wool studio miniature, real fine wool fibres and refined matte ivory craftsmanship, exquisite fabric texture, elegant proportions, not a toy, not cartoon, not clipart.
Composition/framing: landscape, low-angle macro perspective, clearly defined small vane instrument and ribbons against broad negative-space sky, asymmetric but balanced. Entire vane head and full lengths of ribbons comfortably inside the central 75 percent of image height and central 80 percent of image width, fully legible under a centered 16:9 cover crop. Pole may extend downward into the ledge. No oversized foreground object, no frame.
Lighting/mood: beautiful soft side lighting from upper left, delicate tactile shadows and softly lit fibres, calm wind-swept spaciousness.
Palette: sage-green dominant sky blending gently into blush pink near the lower horizon, warm ivory instrument and two wisps, lavender ribbons with deep violet accent, moss-olive ledge. Muted CHMURNIK palette, subtle sophisticated contrast.
Constraints: decorative conceptual weather cover, not a scientific diagram and not photographic evidence. No text, numbers, logos, watermark, borders, arrows, graphic icons, labels or people. No compass letters. No large central cloud, no standalone cumulus, no mountains, no toy aesthetic.
```

## Result

Two distinct accepted covers delivered. No generation or export blockers. No claim of scientific validation, mobile-device testing, catalog integration, publication, or owner approval.

