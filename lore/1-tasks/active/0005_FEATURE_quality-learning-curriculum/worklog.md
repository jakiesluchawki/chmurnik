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
- Browser-based 390 px and desktop review remains open because the configured
  in-app Browser surface is unavailable and the local Brave headless attempt
  did not produce a usable screenshot.
