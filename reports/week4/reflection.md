# Week 4 Reflection - Team 40

## Learning points

- Responding to customer feedback does not have to mean a large feature push.
  The customer asked for more games, so we shipped two (Boss Fight and Voice
  Rocket Climb) while spending most of the sprint on the quality foundation the
  product had been missing.
- Defining quality requirements against ISO/IEC 25010 forced us to make vague
  goals measurable: "recognition should be good" became a correctness scenario
  with pass/reject cases, a 5 ms time-behaviour budget, and concrete
  accessibility roles.
- Automating quality requirement tests was easiest once the game rules were
  pulled out of the canvas components into a pure `gameLogic.ts` module. Pure
  logic is cheap to test; canvas plus live Web Speech is not.
- Configuring CI made the Definition of Done real. A gate that runs on every
  pull request is harder to skip than a checklist item.

## Validated assumptions

- Confirmed: extracting pure logic makes high coverage achievable. `gameLogic.ts`
  reached 100 percent and the matcher rose to about 62 percent without fragile
  UI tests.
- Confirmed: the existing recognition matcher is already tolerant and correct on
  our documented cases, so the new games could reuse it directly.
- Confirmed: a fake `SpeechRecognition` lets us integration-test a voice game
  deterministically, which we were unsure was possible.
- Rejected: our initial idea that we needed full end-to-end browser tests for
  the games. Component integration tests with a mocked recognizer cover the
  important interactions at far lower cost.

## Friction and gaps

- Global coverage stays low because the older canvas games (`App.tsx`,
  `GameCanvas.tsx`, `BubblePopperGame.tsx`) are not unit testable in jsdom. We
  accept this and explain it in `docs/testing.md`, but it is real debt.
- The Lighthouse accessibility threshold is set conservatively; the team still
  needs to confirm the CI run is green and tune the score if the runner reports
  a lower achievable value.
- Manual screen-reader testing is not yet automated and remains a follow-up.
- Sprint milestone, reviewer assignments, the recorded UAT and Sprint Review,
  the demo video, and the release tag are still open at the time of writing.

## Planned response

- Tag `v0.2.0` after the work merges through reviewed, issue-linked PRs, and
  confirm the protected-branch CI run is green.
- Run the recorded UAT and Sprint Review using the scenarios in
  [docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md).
- Continue MVP v2 (bilingual UI US-17, pause US-16, parent progress US-10) on top
  of the enforced gates, keeping the Definition of Done and the QRTs in
  [docs/quality-requirement-tests.md](../../docs/quality-requirement-tests.md)
  satisfied.
- Add manual screen-reader testing and raise critical-module coverage as the
  canvas games are refactored.
