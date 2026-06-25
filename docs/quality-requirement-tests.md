# Quality Requirement Tests (Team 40)

Each quality requirement in [quality-requirements.md](./quality-requirements.md)
has at least one automated quality requirement test (QRT). QRTs live in the
normal repository test locations, run locally with `npm test`, and run in CI on
every pull request and on the protected `main` branch. They are maintained
project assets, not one-off submission evidence.

| QRT | Verifies | Type | Location | Runs in CI |
|-----|----------|------|----------|------------|
| QRT-1 | QR-1 Functional correctness | Unit + integration tests | `src/utils.test.ts`, `src/gameLogic.test.ts`, `src/components/*.test.tsx` | Yes (test job) |
| QRT-2 | QR-2 Time behaviour | Automated performance test | `src/utils.perf.test.ts` | Yes (test job) |
| QRT-3 | QR-3 Operability / accessibility | Accessibility assertions in integration tests, plus a page-level audit | `src/components/WordLadderGame.test.tsx`, `src/components/BossFightGame.test.tsx`, and the Lighthouse accessibility job | Yes (test job + accessibility job) |

---

## QRT-1 - Functional correctness

Asserts the recognition matcher accepts intended words (exact, embedded in
chatter, small mispronunciations, per-token inside a multi-word transcript) and
rejects unrelated words, and that the game reducers move boss HP, player lives,
and ladder steps and win or lose exactly as specified. The game integration
tests drive a fake `SpeechRecognition` and confirm that speaking the shown
words wins the round end to end.

- Accept and reject cases: `src/utils.test.ts`.
- Game rules: `src/gameLogic.test.ts`.
- End-to-end via voice: `src/components/WordLadderGame.test.tsx`,
  `src/components/BossFightGame.test.tsx`.

## QRT-2 - Time behaviour

Measures the average time of `matchesWord` over 5000 representative calls and
asserts it is under the 5 ms budget from QR-2. Location:
`src/utils.perf.test.ts`. This is an automated measurement, distinct from the
correctness tests.

## QRT-3 - Operability and accessibility

Two complementary layers:

1. Component-level: the game integration tests query controls by accessible
   role and name (`getByRole('button', { name: ... })`), confirm the target
   word is exposed through an `aria-live` region, and confirm the ladder
   progress uses `role="progressbar"`. If a control loses its accessible name
   or role, these tests fail.
2. Page-level: the Lighthouse accessibility audit runs against the production
   build in CI as the Assignment 4 additional QA check, scoring the whole page
   against automated accessibility rules. This is a different tool and scope
   from the vitest QRT and from any link-checking job.

## Evidence type note

Per the shared process requirements, CI checks, unit tests, coverage, type
checking, and static analysis only count as QRT evidence when they verify a
specific, measurable quality requirement. QRT-1, QRT-2, and QRT-3 each map to
exactly one quality requirement above; the generic build, type-check, and link
check jobs are quality gates but are not counted as QRTs.
