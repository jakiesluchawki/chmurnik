# Worklog

## 2026-06-16

- Reproduced the trust failure from the user screenshot: the 26-minute
  METAR/TAF lesson exposed only three short summaries and one generic task.
- Replaced the summary data with complete lessons for all nine modules.
- Added explicit outcomes, honest time plans, sourced chapters, worked
  examples, recaps, unique practices, and four-choice checks.
- Added genus-level recognition mastery, targeted review, confused-pair
  explanations, and direct comparison links.
- Added reusable keyboard-safe dialog focus management.
- Created `.codex/skills/build-quality-lesson/` and validated it with the
  official skill validator using an isolated temporary PyYAML installation.
- Added a deterministic lesson audit and made it a GitHub Pages deployment
  gate.
- Tightened the duration heuristic after the first audit showed that expanded
  prose could still claim too much reading time.
- Recorded the user's generalizable feedback in both the lesson skill and
  `AGENTS.md`: reusable lesson-quality feedback updates the skill without
  waiting for a separate command.
- Verified 36 automated tests, nine lesson contracts, the production build,
  and 22 external links.
- Confirmed that shortened WMO URLs may return a generic page with HTTP 200;
  retained the verified direct atlas destinations and their expected-content
  link checks.
- Published commit `4170fa7` to GitHub Pages. Workflow `27601306176`
  completed successfully, and the public bundle exposes the new lesson
  timing, recognition mastery, differential feedback, and cache version 4.
- Recovered rendered QA by connecting directly to the installed Brave DevTools
  protocol. Captured current 390 px and 1440 px lesson states without using
  Playwright or switching browsers.
- The first mobile render measured 8024 CSS px and exposed an attention problem.
  Added chapter focus, active recall, visible progress, resume state, and
  previous/next navigation. The focused first-stage page measures about
  3205 CSS px while retaining the rest of the curriculum in later chapters.
- Replaced the overlapping mobile floating test action with a sixth persistent
  bottom-navigation action. Desktop retains the labeled floating button.
- Updated the lesson skill and audit so all 52 chapter prompts and answers are
  part of the quality and duration contract.
- Current mobile and desktop visual QA passes with evidence under
  `design/qa/current/`.
