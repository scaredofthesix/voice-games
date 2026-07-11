# Sprint 4 Retrospective (Week 6)

Held after the Sprint 4 Sprint Review / Week 6 customer meeting (2026-07-11).

## What went well

- Sprint 4 milestone closed at 14/14 issues with the `v0.4.0` trial release tagged, released,
  and CI-green before the customer meeting, so the meeting itself covered a real, deployed
  build rather than a description of planned work.
- Issue-linked branches and PRs with a distinct reviewer (Kotumbaa, flikspy, MMavInno,
  TeraloToxin across #126-#139) kept the review discipline the customer specifically checked
  for during the process discussion (issue 106:10-06:31 of the transcript).
- The customer confirmed CSV export, hub navigation, GitHub Pages continuous deployment, and
  the Russian-first interface all work as intended, with no follow-up needed on those points.

## What could improve

- Three of the four new games shipped without a live customer walkthrough before this
  meeting, and each surfaced a defect the moment the customer actually played them
  (Sentence Bird's continuous-listening false positives, Echo Microphone's visible-phrase
  regression and short-phrase card-count bug, Magic Wizard's hitbox issue). A quick internal
  playtest pass per new game, before the customer session, would likely have caught at least
  the Echo Microphone regression.
- The team could not confirm live whether adaptive word selection (the customer's main
  Sprint 3 ask) updates within a single round, despite it shipping as a headline Sprint 4
  feature. The feature needed a scripted verification step, not just a manual demo, before
  claiming it satisfied the customer's original acceptance criteria.
- The verbal answer on the TypeScript version used in the meeting did not match
  `package.json`; answering meeting questions about the repository state from memory instead
  of checking the file live risks giving the customer wrong information.
- Story-point/reviewer metadata was duplicated between a comment and the Project board on at
  least one issue, which the customer noticed within the first few minutes of the review.
- PR #128 (adaptive word selection, issue #105, the customer's main Sprint 3 request) had a
  review requested from Kotumbaa but was merged by its own author with no review ever
  submitted, breaking the team's own no-self-merge-without-review rule. This is the same
  feature the team could not confirm live during UAT-13, which suggests the missing review
  is not just a process miss but a real risk: a second reviewer might have caught the
  in-round dynamism gap before the customer did.

## Action items for Sprint 5

- Fix the confirmed Sentence Bird, Echo Microphone, and Magic Wizard issues before asking the
  customer to confirm final transition (issues
  [#140](https://github.com/scaredofthesix/voice-games/issues/140),
  [#141](https://github.com/scaredofthesix/voice-games/issues/141),
  [#142](https://github.com/scaredofthesix/voice-games/issues/142)).
- Verify and, if needed, fix in-round dynamism of adaptive word selection, and add automated
  tests for the selection algorithm's probability distribution
  ([#143](https://github.com/scaredofthesix/voice-games/issues/143)).
- Add bulk custom-word import
  ([#144](https://github.com/scaredofthesix/voice-games/issues/144)), stop game audio on
  hub/game switch, and internationalize the preview screen
  ([#145](https://github.com/scaredofthesix/voice-games/issues/145)).
- Restructure the README per the customer's requested ordering, rename `docs/index.md` to
  `docs/README.md`, and reconcile the actual TypeScript version before pinning it
  ([#146](https://github.com/scaredofthesix/voice-games/issues/146)).
- For any future project past this course: track both the implementer and the accountable
  reviewer per issue in the issue body itself, not only via PR reviewer assignment, so
  multi-PR issues have a clear owner for overall completion.
- Get the still-unreviewed adaptive-word-selection code (PR #128) reviewed by someone other
  than its author as part of the #143 work, instead of leaving it as the one unreviewed merge
  in the Sprint 4 milestone.
</content>
