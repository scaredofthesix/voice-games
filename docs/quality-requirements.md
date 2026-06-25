# Quality Requirements (Team 40)

Measurable quality requirements for Voice Games, written as quality scenarios.
They use the ISO/IEC 25010 product quality model. Each requirement has a stable
ID, a single ISO/IEC 25010 sub-characteristic, a measurable scenario, a
rationale, and a link to the automated quality requirement test (QRT) that
verifies it in [quality-requirement-tests.md](./quality-requirement-tests.md).

These requirements are maintained project assets introduced in Assignment 4
(Sprint 2). Later sprints must keep them satisfied or supersede them explicitly.

| ID | Sub-characteristic (ISO/IEC 25010) | Verified by |
|----|------------------------------------|-------------|
| QR-1 | Functional correctness | QRT-1 |
| QR-2 | Performance efficiency - time behaviour | QRT-2 |
| QR-3 | Usability - operability (accessibility) | QRT-3 |

---

## QR-1 Functional correctness of speech matching

- **Sub-characteristic:** Functional suitability - functional correctness.
- **Scenario:** When a child speaks a target word, possibly with surrounding
  filler words or a small pronunciation slip, the recognition matcher accepts
  the intended word and rejects clearly unrelated words. Measured over the
  documented matcher test cases, 100 percent of the expected-accept cases are
  accepted and 100 percent of the expected-reject cases are rejected.
- **Rationale:** Matching is the core of every game. A child loses trust in the
  game if a correct word is not accepted, or if any noise is accepted as
  correct. Correctness here directly drives learning value.
- **Traceability:** Matcher in `src/utils.ts` (`matchesWord`); game rules in
  `src/gameLogic.ts`. Relates to user stories US-04 and US-08.
- **Verified by:** QRT-1 (`src/utils.test.ts`, `src/gameLogic.test.ts`, and the
  game integration tests).

## QR-2 Response time of speech matching

- **Sub-characteristic:** Performance efficiency - time behaviour.
- **Scenario:** For any single spoken transcript, the recognition match
  completes in under 5 ms on a standard development or CI machine (measured as
  the average over 5000 representative calls), so the on-screen reaction feels
  immediate.
- **Rationale:** The matcher runs on every interim and final transcript while
  the microphone is live. If it were slow it would stutter the game and break
  the sense of voice control for a young player.
- **Traceability:** `matchesWord` and `levenshteinDistance` in `src/utils.ts`.
- **Verified by:** QRT-2 (`src/utils.perf.test.ts`).

## QR-3 Operable, accessible game controls

- **Sub-characteristic:** Usability - operability (accessibility).
- **Scenario:** Every interactive control in the new games exposes an
  accessible name and role, the current target word is announced through an
  ARIA live region, and progress and lives are exposed with text alternatives,
  so the games are operable with assistive technology and keyboard, not only by
  sighted mouse users.
- **Rationale:** The product targets children, including those who use
  assistive technology. Operable, labelled controls are required for inclusive
  use and are a baseline the team commits to keep.
- **Traceability:** `src/components/BossFightGame.tsx`,
  `src/components/WordLadderGame.tsx` (aria-label, role, aria-live, progressbar
  semantics).
- **Verified by:** QRT-3 (accessibility assertions in the game integration
  tests) and the Lighthouse accessibility audit additional QA check in CI.
