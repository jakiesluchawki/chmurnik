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
- Version 1 teaches people to recognize clouds; it does not automatically
  classify camera or uploaded images.
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
- Mobile is a primary surface, not a reduced desktop afterthought.
- The iOS release packages the complete existing product without adding new
  modules. It should feel deliberately designed for iPhone rather than like a
  browser embedded in a shell.
- The selected visual truth is
  `design/reference/atlas-swiatla-mobile.png`.

## Verification

Before publishing:

1. Run the complete automated test and production build.
2. Verify the main learning path and all public routes in a browser.
3. Verify mobile and desktop layouts.
4. Confirm there are no voice or automatic-recognition features.
5. Confirm source attribution remains visible and usable.
6. Complete `design-qa.md` against the selected visual truth.
7. Run `npm run check:lessons` and confirm every lesson meets the versioned
   quality contract.
