# Week 5 Reflection - Team 40

## Learning points

- Writing the architecture down after two sprints of building was revealing:
  the act of drawing the static view exposed that voice logic was scattered
  across `utils.ts` and `useSpeechRecognition.ts`, and the refactor into
  `src/voice/` (#82) happened in the same sprint as the documentation that
  demanded it. Architecture documentation is not paperwork; it is a review
  tool.
- ADRs are cheapest when written close to the decision. Reconstructing
  ADR-001..003 from Sprint 1-2 memory took real effort; ADR-004 and ADR-005,
  written in the sprint the decision was made, took minutes. The new
  Definition of Done item 12 exists so we never have to reconstruct again.
- Parallel feature work on a shared codebase makes merge conflicts a process
  issue, not an accident: five feature PRs landed in three days and three of
  them needed a conflict-resolution merge from `main`. The
  merge-main-into-branch rule (never rewrite history on a shared PR) kept
  every conflict resolution reviewable.
- A cross-cutting fix proves an architecture. The anti-feedback gate (#81)
  reached all six games through two functions in the shared voice module -
  the strongest evidence the #82 refactor drew the right boundary.

## Validated assumptions

- Confirmed: the shared voice module made the two newest games (Skate Word,
  Aste Word Destroyer) and all voice fixes cheaper - no game-specific voice
  wiring diverged this sprint.
- Confirmed: pure-module-first design (progress store in `src/progress.ts`,
  movement update in `engine.ts`) again produced high-coverage tests without
  fighting the canvas.

## Invalidated assumptions / surprises

- We assumed the customer's "random movement" complaint (#85) was a
  recognition-accuracy problem; it was actually frame-timing - fixed by a
  deterministic fixed-timestep update, not by touching the matcher.
- We assumed documentation hosting would be trivial; serving the app at the
  Pages root and the MkDocs site under `/docs/` of the same `gh-pages` branch
  needed a publish procedure that does not clobber either artifact.

## What we would do differently

- Stagger the merge order of large parallel PRs (merge the refactor first,
  then rebase features on it) instead of racing all five and resolving
  conflicts afterwards.
- Add the architecture-gate DoD item at the start of a project, not in week 5.
