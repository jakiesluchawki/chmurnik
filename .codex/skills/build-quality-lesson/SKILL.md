---
name: build-quality-lesson
description: Create or revise rigorous educational lessons with honest duration, source-backed claims, progressive explanation, worked examples, practice, assessment, and mobile-readable structure. Use whenever adding a lesson, expanding a course module, changing an advertised lesson duration, responding to feedback that a lesson is shallow or misleading, or reviewing whether educational content deserves its stated completion time.
---

# Build Quality Lesson

Create a lesson that earns its duration. Treat a title plus a few summaries as
an outline, not a finished lesson.

## Workflow

1. Read the product audience, existing lesson schema, visual patterns, and
   authoritative sources.
2. Define four to six observable outcomes. Avoid outcomes such as "understand"
   without saying what the learner can explain, calculate, compare, or do.
3. Allocate the advertised duration across:
   - explanatory reading,
   - worked examples or cases,
   - learner practice,
   - assessment and recap.
4. Build at least four chapters. Give each chapter:
   - one narrow question,
   - at least two explanatory paragraphs,
   - a source,
   - one active-recall prompt with a concealed explanatory answer,
   - and, where useful, a worked example, decision table, calculation, or
     misconception.
5. Add one structured practice with an observable completion condition.
6. Add a four-option check using plausible distractors and explanatory
   feedback.
7. Add a concise recap that reconstructs the lesson's reasoning.
8. Run the project tests and the bundled audit script when the project uses
   the Cloud Recognition lesson schema.
9. Inspect the rendered mobile reading rhythm when a browser is available.
10. For long mobile lessons, present one chapter at a time with visible
    progress, previous/next navigation, and a remembered resume position.

## Quality Gate

Read [references/lesson-contract.md](references/lesson-contract.md) before
writing or reviewing a lesson. Do not publish while any required gate fails.

Never claim a 20-minute lesson because a topic is important. Duration must
describe the actual learner activity present in the product.

## Source Discipline

- Prefer primary standards, official handbooks, and official product
  documentation.
- Attach sources to the chapter that uses them, not only to the course footer.
- Distinguish classification standards, explanatory textbooks, operational
  guidance, and interface documentation.
- State uncertainty and product limits. Do not turn educational material into
  an operational authorization.
- Paraphrase; do not copy long source passages.

## Feedback Integration

After user feedback, decide whether it exposes a reusable lesson-quality rule.

- Update this skill proactively when the feedback generalizes to future
  lessons, such as misleading duration, missing examples, weak assessment,
  absent sources, poor mobile reading rhythm, or excessive cognitive load.
- Update only the lesson or project memory when the feedback is specific to
  one fact, one visual, or one temporary implementation defect.
- Do not wait for a separate "update the skill" instruction.
- Keep the skill concise: replace weaker rules instead of appending a diary of
  feedback.

The user's June 16, 2026 feedback established a permanent gate: a lesson that
can be read in seconds must not advertise a duration of many minutes.

## Cloud Recognition Validation

From the repository root run:

```bash
node .codex/skills/build-quality-lesson/scripts/audit-lessons.mjs
```

Fix every reported failure before publishing.
