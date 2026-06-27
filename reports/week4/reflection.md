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

- The recorded UAT surfaced a real defect our automated tests could not catch:
  the speech engine self-triggers from the game's own spoken hint (the
  microphone hears the device speakers and auto-passes a word). It comes from the
  matching tolerance we lowered after v0.1.0 to accept mumbled child speech.
  Tracked for the next release (#81), with a shared voice module to fix it in one
  place (#82).
- The customer found Boss Fight's endless 15-boss loop tiring for young learners;
  finite difficulty modes were requested (#83). A useful reminder that "more" is
  not the same as "age-appropriate".
- Global coverage stays low because the older canvas games (`App.tsx`,
  `GameCanvas.tsx`, `BubblePopperGame.tsx`) are not unit testable in jsdom. We
  accept this and explain it in `docs/testing.md`, but it is real debt.
- Manual screen-reader testing is not yet automated and remains a follow-up.

## Planned response

- Releases `v0.2.0` and `v0.2.1` shipped through reviewed, issue-linked PRs with
  a green protected-branch CI run; the recorded UAT and Sprint Review are done
  and the customer accepted the increment.
- Address the review backlog in the next release: the audio-loop self-trigger
  (#81), a shared voice-processing module (#82), Boss Fight finite modes (#83),
  Russian as the default language (#84), and Voice Racer physics (#85).
- Continue MVP v2 (parent progress US-10, more games) on top of the enforced
  gates, keeping the Definition of Done and the QRTs in
  [docs/quality-requirement-tests.md](../../docs/quality-requirement-tests.md)
  satisfied.
- Add manual screen-reader testing and raise critical-module coverage as the
  canvas games are refactored.
