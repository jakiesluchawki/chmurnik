# Two CHMURNIK Social Themes, 15 September 2026

The owner delegated selection and complete production while away. Exactly
two themes, ten static Stories per theme, plus the established platform pack:

1. Co chmura mówi o powietrzu? Cloud observation, evidence and condensation.
2. Wieczór nad wodą ma swoją fizykę. Breeze, saturation, fog and wind reading.

This pack does not change the app, the classifier, Apple submissions or
chmurnik.cloud. No social post has been sent on the owner's behalf. It directs
readers to the existing educational web application, without a new-model claim
or an unverified Apple release announcement. All copy uses the singular author.

## Deliverables

- Twenty complete Stories PNG, 1080x1920, with clear link-sticker space.
- Twenty standalone carousel slides, 1080x1440, with the same full texts.
- Six cover PNG, each 1080x1440, creating two three-post panorama rows.
- Six ready Instagram folders: cover, complete interior slides and full caption.
- Two Facebook PNG with complete captions.
- Two ten-page selectable-text LinkedIn PDFs with working workshop links.
- Eleven download ZIPs and every full story/post/caption together in TXT/HTML.
- Two full composed panoramas, individual row previews and a six-post grid.

The Instagram rows require three actual posts per theme, not three themes or
three slides inside a single post. Publish right, middle, left, using folders
01-post, 02-post, 03-post. Each post is self-contained. See PUBLIKACJA.txt for
exact ordering, pinned-post/cropping cautions and the classic one-carousel option.

## Art And Exact Content

Twelve distinct new source artworks were generated with built-in ImageGen.
Generation prompts and actual receipts are in art/*.json and worker-receipts.json.
They are editorial illustrations, not authentic observation photographs or
fabricated screenshots. Genuine cloud photography remains in the product atlas.

Native panoramas are 1881x836; other artworks are 1536x1024. The 3240x1440
composed panorama exports are enlarged, not native 4K. Exact Romie/Roobert
typography is composed separately with fontkit/resvg, and PDFKit retains
selectable text. Every complete headline and paragraph is checked against copy.
Panorama covers are cut from ONE shared composed canvas. Reconstruction is
pixel-identical, not merely a set of similar generated images. Subtle caption
panels correct the initially poor footer contrast without interrupting edges.

Export tools use the existing .local/social-export-tools isolation, not runtime
app dependencies. ZIPs and byte-identical interior duplicates are rebuilt before
CI tests from committed final assets. ZIP inputs have stable dates, modes and UTC
stored entries; large reproducible archives are not committed as Git binaries.
All eleven ZIPs are hosted in GitHub Release sm-niebo-woda-20260915. The gallery
links directly to them. Pages excludes ZIPs, duplicated carousel interiors and
working full-size panorama canvases to keep the complete site under its 1 GB
limit without removing old packs or changing their established addresses.

## Research And Access

Scientific source links are listed together in ZRODLA.txt and the gallery.
They include WMO observation/definitions/perspective and NWS cloud, breeze,
dew-point and radiation-fog explanations. Promotional simplifications explicitly
distinguish causal educational models from forecasts and measured visibility.

Actual mieszko.wav inspection was denied by automatic review: granting browser
access to the entire Instagram origin could expose private signed-in data beyond
the requested one-profile inspection. No alternate browser, account scraping or
indirect workaround was used. Official Meta resolution help redirected to login
or rate-limited its public endpoint. A 3:4 grid is a clearly labelled design
assumption, not account-specific verified evidence. The real profile's current
crop, pinned posts and existing composition remain unverified.

## Agents

Five agents participated, including the coordinator:

- Coordinator: complete copy, science/source review, exact composition, gallery,
  platform exports, ZIP/PDF checks, repository integration and Pages deployment.
- Gibbs: cloud panorama, lifted-air metaphor and cloud light.
- Mill: atlas metaphor, horizon and cloud comparison.
- Carver: coastal panorama, breeze and low mist.
- Lagrange: dew detail, sailboat and learning invitation.

All four native-image workers completed three disjoint artworks on their first
attempt and were closed. The coordinator verified actual file existence and
dimensions. No independent meteorologist or efficacy study is implied.

## Reproduction

```sh
node social/2026-09-15-dwie-opowiesci/render.mjs
node social/2026-09-15-dwie-opowiesci/build.mjs
node social/library/build.mjs
node --test tests/social-two-themes.test.mjs tests/social-groups.test.mjs
python social/2026-09-15-dwie-opowiesci/verify-pdf.py
```

After public deployment, run `node social/2026-09-15-dwie-opowiesci/verify-public.mjs`
to check complete public copy, every export link, archives and the mother page.

PDF verification requires pypdf, pypdfium2 and Pillow in an isolated QA environment.
All generation outputs are already preserved; rebuilding downloads does not
regenerate artwork or require the private export toolchain in CI.

## Verification And Publication

Local verification passed: 937/937 Node tests with zero skips or cancellations,
nine lesson modules, and a code-only Pages build. Independent PDFium rendered
all twenty PDF pages; pypdf verified every complete text, clickable link and
the author. Story contact sheets, full-size samples, both panorama rows and
both PDF contact sheets were visually reviewed. All eleven ZIPs passed exact
entry, full-copy and SHA-256 checks; both panorama rows rejoin pixel-identically.

Publication completed successfully. See PUBLICATION-RECEIPT.md for actual source
and Pages commits, release digests, Linux CI counts/skips, 121 public HTTP checks,
mobile/desktop inspection and the remaining account-access/clipboard limits.
Stable library: https://jakiesluchawki.github.io/chmurnik/assetySM/
Pack route: https://jakiesluchawki.github.io/chmurnik/premiera/niebo-i-woda/
