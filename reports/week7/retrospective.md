# Sprint 5 Retrospective (Week 7)

Held after the Sprint 5 Sprint Review / Week 7 customer session (2026-07-16).

## What went well

- Every Week 6 feedback item became a tracked, issue-linked PR and all of them merged to
  `main` during Sprint 5: Echo Microphone memory mechanic (#141 / #153), Sentence Bird
  push-to-talk (#140 / #157), adaptive selection after one failure (#143 / #155), bulk
  custom-word import (#144 / #154), cross-game audio/i18n polish (#145 / #156), Magic Wizard
  and Treasure Hunter fixes (#142 / #158), and the cross-game integration (#160).
- The rejected Magic Wizard mechanic was fully **replaced by Voice Maze Quest**, exactly the
  "simple voice puzzle / labyrinth" the customer asked for, with the unexplained cursed rune
  removed and automated tests covering the new floor-clear path.
- The team finally closed the two long-standing truthfulness gaps: **TypeScript is pinned to
  5.8.3** across `package.json`, lockfile and docs, and **automatic GitHub Pages deployment is
  now real** (`.github/workflows/deploy-pages.yml` builds, tests and publishes on every push to
  `main`), so the README's "deploys automatically" claim is now accurate.
- The custom-word paste was hardened per the live finding: a tab, and as a fallback exactly
  four spaces, separate the columns, so multi-word phrases survive (#144 follow-up).
  The final build also keeps invalid and duplicate rows editable with a clear reason.

## What could improve

- We again reached the customer session with a game (Magic Wizard) whose mechanic we could not
  clearly explain, and the customer had to redesign it for us on the call. A five-minute
  "can a stranger understand this from the first screen?" check per new game would have caught
  it before the meeting, not during it.
- Adaptive word selection needed a second rework in Sprint 5 because the Sprint 4 version only
  reacted after two or more failures - too slow for a three-heart game. The acceptance
  threshold ("react after one failure") should have been pinned down as a testable number in
  Sprint 4, not discovered live in Sprint 5.
- Process slip: the final MVP v3 polish PR (#165) was **self-merged with an admin override**
  instead of being reviewed and merged by a different teammate. This repeats the exact
  no-self-merge-without-review issue flagged in the Sprint 4 retro (PR #128) and must be
  retro-reviewed. The rule stands: a different person reviews and merges, always.

## Action items / post-course notes

- Get PR #165 reviewed retroactively by someone other than its author so the Sprint 5 review
  trail is complete, and do not admin-merge again.
- **Completed 2026-07-17:** run the customer retests of UAT-12 (Voice Maze Quest), UAT-13
  (one-failure adaptive) and UAT-15 (bulk paste), then record the results.
- **In progress:** cut the MVP v3 SemVer release. Independent review, protected merge,
  deployment, the confirmation call, and the public demo video are complete; the release must
  link the demo and the Week 7 report.
- Keep the "understandable from the first screen" and "acceptance criteria as testable numbers"
  checks as standing practice for any future work past this course.
