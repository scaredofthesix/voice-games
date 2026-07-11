# Sprint 4 Review summary (Week 6)

**Date:** 2026-07-11.

**Attendees:** the customer (product stakeholder), and a Team 40 representative running the
session and screen-share. Full team attendance is recorded privately in the Week 6 Moodle
PDF, per the assignment's public/private evidence split.

**Format:** one recorded video call covering the Sprint 4 Sprint Review, customer-executed
UAT (UAT-09 through UAT-14), the customer-facing documentation review, and the Week 6
transition-readiness discussion, in that order. See
[`reports/week6/sprint-review-transcript.md`](./sprint-review-transcript.md) for the full
sanitized transcript (recording and clean-transcript publication were both explicitly
permitted by the customer at the start of the session).

## Agenda (as run)

- Sprint 4 Goal recap and milestone/backlog walkthrough.
- Process question on issue metadata: Story Points on the Project board vs. issue body,
  responsible vs. accountable person per issue.
- Week 6 trial release (`v0.4.0`) walkthrough: progress view + CSV export, and the four new
  games (Voice Treasure Hunter, Sentence Bird, Echo Microphone, Magic Wizard).
- Customer-executed UAT-09 through UAT-14.
- Transition-readiness discussion (internationalization, CI/CD, testing with children).
- Bulk custom-word input request.
- Customer-facing documentation review (`README.md`, `CONTRIBUTING.md`, `AGENTS.md`,
  `CHANGELOG.md`, `docs/customer-handover.md`, package metadata).
- Acceptance discussion and Week 7 expectations.

## What was demonstrated

- Sprint 4 milestone (14 issues, all closed) and the Sprint 4 Project board view.
- The Progress view, including per-game statistics and the CSV export.
- The four new games completing the ten-game roster.

## Process discussion (not a product finding, recorded for future Sprints)

The customer asked how Story Points, implementer, and reviewer are tracked and confirmed the
team's current approach (Project-board metadata plus GitHub assignees and PR reviewers) is
adequate, but recommended that future projects also record, in the issue body, who is
accountable for an issue's overall success separately from who implements it, since one
issue can span several pull requests reviewed by different people. This is a process
recommendation for future work, not a Sprint 4/5 defect.

## Customer trial / UAT results

Full detail, expected results, and pass/fail per scenario are in
[`reports/week6/README.md`](./README.md#uat--customer-trial-results). Summary: UAT-09 and
UAT-14 passed cleanly; UAT-11 passed with one display issue noted; UAT-10, UAT-12, and UAT-13
surfaced real defects or open questions that became Sprint 5 issues.

## Requested changes and resulting issues

The customer requested game-behavior fixes (Sentence Bird, Echo Microphone, Magic Wizard),
cross-game fixes (audio not stopping on hub/game switch, preview-screen internationalization,
keep the CSV in English), a dynamic in-round adaptive word selection with algorithm tests, a
bulk custom-word import, and a README/documentation restructuring plus a TypeScript-version
pin. Every point was converted into a tracked GitHub issue in the
[Sprint 5 milestone](https://github.com/scaredofthesix/voice-games/milestone/5); the full
feedback-to-issue mapping is the traceability table in
[`reports/week6/README.md`](./README.md#customer-feedback-response-table).

## Decisions and approvals

- The customer explicitly accepted the plan to fix the identified items and present the
  result in Week 7, in this meeting (no separate written acceptance is required for this
  interim plan).
- Repository ownership, GitHub Pages hosting, and CI/CD stay with the team; the customer does
  not need write access.
- Keep the repository public and the project open source; do not remove or hide it after
  delivery.
- Progress-export CSV stays in English (columns and data), not translated.

## Risks and open items carried into Sprint 5

- Whether adaptive word selection is truly dynamic within a single round could not be
  confirmed live; the team acknowledged the behavior was unverified at meeting time (see
  UAT-13 in the transcript).
- The team's verbal answer on the TypeScript version ("7.0.2") does not match
  `package.json` (`~5.8.2` at meeting time); needs reconciling before pinning.
- Magic Wizard's mechanic overlap with Voice Treasure Hunter is an open product decision, not
  yet resolved by the team.

## Backlog changes

Created issues [#140](https://github.com/scaredofthesix/voice-games/issues/140) through
[#146](https://github.com/scaredofthesix/voice-games/issues/146) in the Sprint 5 milestone,
covering every requested change above. No Sprint 4 scope changed as a result of this meeting.
</content>
