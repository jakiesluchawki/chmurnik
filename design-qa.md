# Design QA

## Comparison Target

- Source visual truth: `design/reference/atlas-swiatla-mobile.png`
- Implementation route:
  `http://127.0.0.1:5174/cloud-recognition/#/learn/lotnictwo`
- Mobile viewport: 390 x 844 CSS px at 2x device scale
- Desktop viewport: 1440 x 900 CSS px
- State: full METAR/TAF lesson, chapter navigation, active recall,
  final check, and global recognition test

## Evidence

- Full-view comparison:
  `design/qa/current/learning-mobile-comparison.png`
- Mobile lesson opening:
  `design/qa/current/lesson-mobile-top.png`
- Focused mobile chapter:
  `design/qa/current/lesson-mobile-chapter.png`
- Focused active-recall answer:
  `design/qa/current/lesson-mobile-recall.png`
- Longest expert chapter title:
  `design/qa/current/lesson-mobile-ekspert.png`
- Mobile final check:
  `design/qa/current/lesson-mobile-final-check.png`
- Mobile global test:
  `design/qa/current/lesson-mobile-global-test.png`
- Desktop opening:
  `design/qa/current/lesson-desktop-top.png`
- Desktop active recall:
  `design/qa/current/lesson-desktop-recall.png`

The source visual and lesson are different product states, so the full-view
comparison evaluates design language rather than identical composition.
All nine lesson routes were also swept at 390 px. Each reported a 390 px
document width, one visible chapter, 16 px body copy, six mobile navigation
actions, and no prematurely visible recap, final check, or practice.

## Findings And Patches

1. **P1 fixed — The mobile lesson was an eight-thousand-pixel document**
   - Before: all seven chapters appeared in one continuous page.
   - Patch: mobile now presents one chapter at a time, with previous/next
     navigation, progress, and a locally remembered resume position.
   - Evidence: one visible chapter and an active-stage height of about
     3205 CSS px instead of 8024 CSS px.

2. **P1 fixed — The chapter index consumed almost a full mobile viewport**
   - Before: seven full-width rows delayed the lesson content.
   - Patch: the index is a horizontal, snapping rail with the active chapter
     visible after selection and after a resumed session.

3. **P2 fixed — Mobile lesson prose fell below the 16 px product rule**
   - Before: chapter paragraphs rendered at about 14 px.
   - Patch: lesson body copy is 16 px at mobile and desktop widths.

4. **P2 fixed — The floating recognition action obscured lesson content**
   - Before: a fixed coral button covered paragraphs and final-check content.
   - Patch: mobile exposes `Test` as the sixth persistent bottom-navigation
     action. Desktop retains the labeled floating action.

5. **P2 fixed — Reading was still too passive**
   - Patch: every one of the 52 chapters now ends with a concealed
     active-recall answer. The lesson audit includes those prompts and answers
     in its duration calculation.

## Required Fidelity Surfaces

- **Typography:** Newsreader and Manrope remain consistent with Atlas Światła.
  Display hierarchy is editorial; chapter and body copy wrap without clipping.
  Lesson prose is 16 px.
- **Spacing and layout:** warm-paper sections use dividers and whitespace
  instead of generic card stacks. Mobile rails, sticky progress, chapter
  navigation, recap, and checks have stable spacing at 390 px.
- **Colors and tokens:** ink, paper, coral, mist, moss, and white use the
  existing project tokens. Active, correct, wrong, and source states remain
  distinguishable.
- **Image quality:** the lesson itself does not need an identification image.
  The global test uses the existing licensed atlas photographs without
  placeholders or code-drawn substitutes.
- **Copy and content:** all copy is Polish, source-backed, and explicit about
  operational limits. Time labels now name reading plus recall, examples,
  practice, and assessment.
- **Interactions and accessibility:** chapter controls have 44 px targets,
  active state and progress are visible, resume state survives reload, recall
  answers expose `aria-expanded`, the global test opens from mobile
  navigation, and dialogs retain focus trapping and Escape handling.

## Residual Risk

- The six-item bottom navigation is intentionally compact at 390 px. It passes
  the target viewport; widths below the product target were not used as a
  release criterion.
- The comparison evaluates shared visual language because the source mock is a
  home screen, not a lesson screen.

## Final Result

final result: passed
