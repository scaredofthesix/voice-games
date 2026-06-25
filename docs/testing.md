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
  - `src/utils.test.ts` - speech recognition matcher (`matchesWord`,
    `levenshteinDistance`, `consonantsOnly`, `cleanWord`).
  - `src/gameLogic.test.ts` - pure game rules for the two new games.
  - `src/data.test.ts` - built-in word-list integrity.
- **Integration tests** for important component interactions:
  - `src/components/WordLadderGame.test.tsx` and
    `src/components/BossFightGame.test.tsx` render the game, drive a fake
    `SpeechRecognition` (`src/test/mockSpeechRecognition.ts`), and verify the
    full flow from spoken word to game state, including accessibility roles.
- **Performance test** (time behaviour QRT): `src/utils.perf.test.ts`.

## Critical modules and coverage

The team's critical modules are the recognition matcher and the new game logic,
because they decide whether a spoken word counts and how a round is won or lost.
Each critical module must keep at least 30 percent automated line coverage,
enforced by per-file thresholds in `vitest.config.ts`.

| Critical module | Line coverage | Threshold |
|-----------------|---------------|-----------|
| `src/gameLogic.ts` | 100% | 30% |
| `src/utils.ts` | ~62% | 30% |
| `src/components/WordLadderGame.tsx` | ~92% | - |
| `src/components/BossFightGame.tsx` | ~91% | - |
| `src/data.ts` | 100% | - |

Global repository coverage is intentionally lower (around 23 percent) because
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
- **Limitations:** automated audits cover only a subset of accessibility; they
  do not replace manual screen-reader testing, which remains a follow-up.

## Quality gates in CI

`.github/workflows/ci.yml` runs type check, build, the full test suite with
coverage, and the Lighthouse accessibility audit on every pull request and on
`main`. The separate `.github/workflows/links.yml` runs the Lychee link check.
A pull request must be green before merge per the
[Definition of Done](./definition-of-done.md).
