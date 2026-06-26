# Week 4 LLM Usage Report - Team 40

## Tools used

- Claude (Anthropic) via an agentic coding assistant in the editor, used for
  pair-programming during Sprint 2.

## How it was used

- Drafting the two new games' pure logic (`src/gameLogic.ts`) and the React
  game shells (`BossFightGame.tsx`, `WordLadderGame.tsx`) from the agreed game
  rules, then wiring them into the existing hub in `App.tsx`.
- Setting up the Vitest test infrastructure and writing the unit, integration,
  and performance tests, and the shared `useSpeechRecognition` hook and the test
  mock for the Web Speech API.
- Drafting the quality documentation (`docs/quality-requirements.md`,
  `docs/quality-requirement-tests.md`, `docs/testing.md`), the Definition of
  Done update, the CI workflow, and these Week 4 report drafts.

## Human oversight

- The team chose the sprint scope (two games, quality automation) and the second
  game (Word Ladder) and the additional QA check direction.
- Every generated change was reviewed and run locally: the full test suite
  (43 tests), the type check, and the production build all pass before the work
  is opened for team review.
- All customer-facing decisions, the recorded UAT and Sprint Review, reviewer
  approvals, and the release remain human-owned and are not automated.

## Note

AI assistance accelerated implementation and documentation. The analysis,
scope decisions, quality requirement choices, and verification reflect the
team's own work and judgement.
