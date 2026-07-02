# Testing Strategy (Team 40)

How Voice Games is tested, which modules are critical, and what the automated
quality assurance checks are. Tests added in Assignment 4 (Sprint 2) are
maintained product assets. Later work must keep them passing or replace them
with documented equivalent or stronger coverage.

## Stack

- Test runner: [Vitest](https://vitest.dev) with the `jsdom` environment.
- Component tests: React Testing Library plus `@testing-library/jest-dom`.
- Coverage: `@vitest/coverage-v8`.
- Config: `vitest.config.ts` (kept separate from `vite.config.ts`).

## Commands

```bash
npm test            # run all unit + integration tests once
npm run test:watch  # watch mode for development
npm run test:coverage  # run tests and produce a coverage report
npm run lint        # TypeScript type check (tsc --noEmit)
npm run build       # production build
```

## Test types

- **Unit tests** for critical product logic:
  - `src/voice/voiceEngine.test.ts` and `src/utils.test.ts` - the shared voice
    engine (`src/voice/engine.ts`, see ADR-005): the strict matcher
    (`matchesWord`, `levenshteinDistance`, `cleanWord`, RU/EN normalization,
    plus a no-false-accepts suite for issue #97), the TTS anti-feedback gate,
    and the deterministic racer movement update.
  - `src/gameLogic.test.ts` and `src/gameLogic.gauntlet.test.ts` - pure game
    rules, including the Boss Fight finite modes and the Endless roster.
  - `src/data.test.ts` - built-in word-list integrity.
- **Integration tests** for important component interactions:
  - `src/components/WordLadderGame.test.tsx` and
    `src/components/BossFightGame.test.tsx` render the game, drive a fake
    `SpeechRecognition` (`src/test/mockSpeechRecognition.ts`), and verify the
    full flow from spoken word to game state, including accessibility roles.
  - `src/App.test.tsx` covers hub-level rendering and navigation.
- **Performance test** (time behaviour QRT): `src/utils.perf.test.ts`.

## Manual smoke test (voice-triggered gameplay outcome)

The release smoke test does not stop at "the app opens and the microphone turns
on". It records at least one full voice-triggered gameplay outcome per new game,
from a spoken word through to a terminal win state. Run it in Chrome on the
public deployment before every release and attach the evidence (a screenshot or
short recording of the win screen) to the release or the Week 4 report.

Boss Fight - win path:

1. Open the deployment, press Play on Boss Fight, then Start Fight.
2. Allow the microphone when prompted.
3. Read each target word aloud before its timer expires until the boss health
   bar reaches zero.
4. Expected outcome: the boss is defeated and the win screen appears with the
   number of words defeated. This terminal outcome is the smoke result.

Voice Rocket Climb - win path:

1. Open the deployment, press Play on Voice Rocket Climb, then Start Launch.
2. Allow the microphone.
3. Read each target word aloud so the rocket advances one step per correct word.
4. Expected outcome: the rocket reaches orbit and the "Orbit reached" win screen
   appears. This terminal outcome is the smoke result.

The same end-to-end win paths are asserted automatically (without real hardware)
by the integration tests `src/components/BossFightGame.test.tsx` and
`src/components/WordLadderGame.test.tsx`: they drive a fake `SpeechRecognition`,
emit the on-screen target words, and assert the win state. The manual smoke
confirms the identical outcome on a real microphone and the live deployment.

Latest recorded smoke result: _TODO date, tester, and link to the win-screen
evidence for Boss Fight and Voice Rocket Climb_.

## Critical modules and coverage

The team's critical modules are the recognition matcher and the new game logic,
because they decide whether a spoken word counts and how a round is won or lost.
Each critical module must keep at least 30 percent automated line coverage,
enforced by per-file thresholds in `vitest.config.ts`.

| Critical module | Line coverage | Threshold |
|-----------------|---------------|-----------|
| `src/gameLogic.ts` | 100% | 30% |
| `src/voice/engine.ts` | ~62% | 30% |
| `src/utils.ts` (re-export shim over the voice engine) | 100% | 30% |
| `src/components/WordLadderGame.tsx` | ~92% | - |
| `src/components/BossFightGame.tsx` | ~91% | - |
| `src/data.ts` | 100% | - |

The matcher and voice logic moved from `src/utils.ts` into `src/voice/engine.ts`
in Sprint 3 (issue #82, ADR-005); the threshold now guards the real module and
the shim alike.

Global repository coverage is intentionally lower (around 30 percent) because
the legacy canvas-and-voice UI (`App.tsx`, `GameCanvas.tsx`,
`BubblePopperGame.tsx`) renders to an animated `<canvas>` with the live Web
Speech and Web Audio APIs, which are not meaningfully unit testable in `jsdom`.
The team focuses automated coverage on the pure logic that carries the product
risk, and verifies the canvas games manually in Chrome (see the Definition of
Done).

## Additional QA check

The Assignment 4 additional QA check is a **Lighthouse accessibility audit** of
the production build, run as its own CI job. It is distinct from linting, type
checking, build, unit tests, integration tests, coverage, the automated QRTs,
and the existing Lychee link-checking job.

- **QA objective / risk:** catch accessibility regressions (missing labels, poor
  contrast, missing landmarks) on the deployed page.
- **Why it matters:** the product is used by children, including those relying
  on assistive technology, so an inaccessible page reduces real usability.
- **Where it runs:** the `accessibility` job in `.github/workflows/ci.yml`,
  against the built `dist` served locally during the run.
- **Threshold:** the job asserts a Lighthouse accessibility score of at least
  0.85, the current measured baseline (the legacy hub palette has some contrast
  findings). This is a ratchet: the gate fails on any regression below the
  baseline, and the team will raise it as contrast issues are fixed.
- **Limitations:** automated audits cover only a subset of accessibility; they
  do not replace manual screen-reader testing, which remains a follow-up.

## Quality gates in CI

`.github/workflows/ci.yml` runs type check, build, the full test suite with
coverage, and the Lighthouse accessibility audit on every pull request and on
`main`. The separate `.github/workflows/links.yml` runs the Lychee link check.
A pull request must be green before merge per the
[Definition of Done](./definition-of-done.md).
