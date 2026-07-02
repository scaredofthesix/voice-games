# ADR-005: One shared voice module instead of per-game voice code

- **Status:** Accepted (Sprint 3, issue #82)
- **Deciders:** Team 40

## Context

By the end of Sprint 2 the voice stack had grown organically: the recognition
hook lived in `src/useSpeechRecognition.ts`, matching and TTS helpers in
`src/utils.ts`, and every one of six games imported pieces of both. Cross-
cutting fixes - the anti-feedback gate (#81), Cyrillic matching (#84) - had to
be threaded through scattered call sites, and a new game could easily wire
voice slightly differently and miss a fix.

## Decision

Consolidate all voice concerns into a **single cohesive module `src/voice/`**:

- `engine.ts` - pure logic: `matchesWord` (RU/EN normalization with a
  Levenshtein tolerance; tightened to strict per-token matching in issue #97),
  `speakWord`/`speakSound` with the anti-feedback bookkeeping,
  `isSpeechSynthesisActive`, and the deterministic racer movement update.
- `useVoiceGame.ts` - the `useSpeechRecognition` React hook owning the
  `SpeechRecognition` lifecycle (start/stop, auto-restart, error mapping).

All games consume voice exclusively through this module. The old paths
`src/utils.ts` and `src/useSpeechRecognition.ts` remain as re-export shims for
compatibility and are slated for removal.

## Alternatives considered

- **Leave the code where it was and fix call sites one by one.** No refactor
  cost now, but every voice bug fix stays an N-games change; the anti-feedback
  gate alone touched every game. Rejected - the duplication had already caused
  real defects.
- **A full `VoiceEngine` class with per-game instances and configuration.**
  More extensible in theory, but our games need identical behavior and the
  hook + pure-function split tests better. Rejected as speculative generality.

## Consequences

- Cross-cutting voice behavior (gating, matching tolerance, language
  normalization) changes in one place and reaches all six games at once.
- Pure logic in `engine.ts` is unit-testable without a browser; the hook is
  exercised through integration tests with a mock `SpeechRecognition`.
- A new game gets voice control by consuming one hook and one matcher - the
  Skate Word and Aste Word Destroyer games validated this shape.
- Two shim files linger until old imports are migrated; tracked as cleanup.
