# Quality Requirements (Team 40)

Measurable quality requirements for Voice Games, written as quality scenarios.
They use the ISO/IEC 25010 product quality model. Each requirement has a stable
ID, a single ISO/IEC 25010 sub-characteristic, a measurable scenario, a
rationale, and a link to the automated quality requirement test (QRT) that
verifies it in [quality-requirement-tests.md](./quality-requirement-tests.md).

These requirements are maintained project assets introduced in Assignment 4
(Sprint 2). Later sprints must keep them satisfied or supersede them explicitly.

Since Assignment 5, each requirement also links the architecture decision
records (ADRs) in [architecture/adr/](./architecture/adr/) that address it.

| ID | Sub-characteristic (ISO/IEC 25010) | Verified by | Related ADRs |
|----|------------------------------------|-------------|--------------|
| QR-1 | Functional correctness | QRT-1 | ADR-001, ADR-003, ADR-004, ADR-005 |
| QR-2 | Performance efficiency - time behaviour | QRT-2 | ADR-001, ADR-002, ADR-005 |
| QR-3 | Usability - operability (accessibility) | QRT-3 | ADR-002 |

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
- **Traceability:** Matcher `matchesWord` in `src/voice/engine.ts`; game rules in
  `src/gameLogic.ts`. Relates to user stories US-04 and US-08.
- **Verified by:** QRT-1 (`src/utils.test.ts`, `src/gameLogic.test.ts`, and the
  game integration tests).
- **Related ADRs:**
  [ADR-001](./architecture/adr/ADR-001-client-only-web-speech.md) (the matcher
  compensates for browser recognition quality),
  [ADR-003](./architecture/adr/ADR-003-static-spa-github-pages.md) (HTTPS
  microphone permission as the precondition),
  [ADR-004](./architecture/adr/ADR-004-tts-anti-feedback-gate.md) (the app
  never scores its own speech),
  [ADR-005](./architecture/adr/ADR-005-shared-voice-module.md) (one strict
  matcher shared by all games).

## QR-2 Response time of speech matching

- **Sub-characteristic:** Performance efficiency - time behaviour.
- **Scenario:** For any single spoken transcript, the recognition match
  completes in under 5 ms on a standard development or CI machine (measured as
  the average over 5000 representative calls), so the on-screen reaction feels
  immediate.
- **Rationale:** The matcher runs on every interim and final transcript while
  the microphone is live. If it were slow it would stutter the game and break
  the sense of voice control for a young player.
- **Traceability:** `matchesWord` and `levenshteinDistance` in `src/voice/engine.ts`.
- **Verified by:** QRT-2 (`src/utils.perf.test.ts`).
- **Related ADRs:**
  [ADR-001](./architecture/adr/ADR-001-client-only-web-speech.md) (matching is
  a synchronous in-browser call with no team-controlled network hop),
  [ADR-002](./architecture/adr/ADR-002-canvas-rendering.md) (the render loop
  stays smooth while transcripts stream in),
  [ADR-005](./architecture/adr/ADR-005-shared-voice-module.md) (one
  perf-tested matcher implementation).

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
- **Related ADRs:**
  [ADR-002](./architecture/adr/ADR-002-canvas-rendering.md) (canvas scenes are
  invisible to assistive technology, so the accessible surface lives in the
  DOM chrome around them; this ADR is the reason QR-3 exists as a maintained
  commitment).
