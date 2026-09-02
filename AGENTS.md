# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Session Gate

Before any work, verify:

| Check | File | If Missing |
|---|---|---|
| Who | `lore/0-session/current-user.md` | Restore the `mieszko` session identity |
| What | `lore/0-session/current-task.md` | Select the active Lore task |

Writing production code without an active Lore task is forbidden.

## Context

@lore/0-session/current-user.md
@lore/0-session/current-task.md
@lore/0-session/next-tasks.md
@lore/AGENTS.md

## Product Guardrails

- The product interface and educational content are in Polish.
- Version 1 teaches people to recognize clouds. Its experimental iOS photo
  assistant runs entirely on-device and presents uncertain, evidence-led
  hypotheses instead of authoritative diagnoses.
- No narration, synthesized speech, recorded voice, microphone features, or
  audio controls.
- Cloud Recognition is a separate project. Never edit or publish any
  Kosmiczne Laboratorium repository from this workspace.
- Scientific claims shown to learners must cite a reviewable source.
- Creating or substantially revising a lesson must use the project skill
  `.codex/skills/build-quality-lesson/`.
- A lesson duration is a product contract. It must be supported by the
  audited reading, examples, learner actions, practice, and knowledge check;
  a short summary must never be presented as a multi-minute lesson.
- When user feedback reveals a reusable lesson-quality rule, update
  `.codex/skills/build-quality-lesson/` proactively. Do not wait for a
  separate request to update the skill. Keep one-off content corrections in
  the project rather than overfitting the skill.
- Generated imagery may support atmosphere and diagrams, but it must not be
  presented as photographic evidence for cloud identification.
- Preserve the approved pink, olive, violet, Romie/Roobert, and felt-studio
  identity. Keep the interface calm, compact, and mature; real cloud imagery
  must lead the atlas while felt objects explain invisible atmospheric ideas.
- Mobile is a primary surface, not a reduced desktop afterthought.
- For social-media deliverables, preserve the owner-approved mobile download
  gallery at `/premiera/`: dated packs, individual files, ZIP downloads and
  copyable App Store sticker links. On 2026-09-02 the owner explicitly asked
  to reuse this format; keep already-published packs available.
- Social copy revisions must always present the complete set, including
  unchanged items. The owner approves copy before visual production. Preserve
  the approved warm, restrained romantic tone and practical technical detail.
  Feature demos should show genuine mobile taps, swipes, lesson questions and
  explanations, not just isolated panels with changing numbers.
- Instagram Stories should feel like a brisk startup product promo: short
  action-led edits, decisive cuts and useful close-ups, without reading-time
  holds. Keep each story's entire approved copy visible, not only successive
  excerpts or metadata. Verify the text in decoded video frames. Keep videos
  silent so the owner can choose music in Instagram.
- As explicitly requested on 2026-08-26, iOS may have its own navigation,
  workflows, and native features; feature parity with the website is not a
  requirement. Share the scientific content, authentic cloud photography,
  and brand identity while designing iPhone interactions for field use.
- The user approved the iOS field-companion direction on 2026-08-26 and
  expanded the audience to sailors and pilots. Practical METAR, wind, and
  map-reading workshops must be playable, clear, useful, and source-backed.
  Label synthetic reports, unsupported decoding, and operational limits;
  never present a training score as a flight or sailing authorization.
  The selected study is `design/ios-next-2026-08-26.md`.
- The current selected visual truth is
  `design/approved/chmurnik-mobile-density-v1.png`; use the earlier
  `design/reference/atlas-swiatla-mobile.png` only as historical context.

## Verification

Before publishing:

1. Run the complete automated test and production build.
2. Verify the main learning path and all public routes in a browser.
3. Verify mobile and desktop layouts.
4. Confirm there is no voice feature and photo recognition stays on-device,
   consent-aware, visibly uncertain, and limited to iOS.
5. Confirm source attribution remains visible and usable.
6. Complete `design-qa.md` against the selected visual truth.
7. Run `npm run check:lessons` and confirm every lesson meets the versioned
   quality contract.
