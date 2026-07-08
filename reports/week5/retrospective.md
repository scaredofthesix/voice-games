# Week 5 Sprint Retrospective - Team 40

Public and sanitized. No private personal information.

## What went well

- The whole team shipped in parallel: seven reviewed PRs (#88-#94) merged
  within the sprint, every member implemented at least one PBI and reviewed
  someone else's, and no one reviewed their own work.
- Both Sprint 2 customer findings were fixed for MVP v2: the audio-loop
  self-trigger (#81, anti-feedback gate) and the erratic racer movement
  (#85, deterministic update), plus the requested Boss Fight modes (#83).
- The shared voice module refactor (#82) paid off inside the same sprint:
  the anti-feedback gate and the Cyrillic matcher reached all six games
  through one module.
- The architecture, process, and configuration of the product are now
  documented and hosted (architecture views, five ADRs, development-process
  doc, MkDocs site), and the Definition of Done enforces keeping them current.

## What did not go well

- Merging five parallel feature branches produced repeated conflicts in
  `App.tsx` and the game components; three PRs needed conflict-resolution
  merges before they could land, which cost review time at the end of the
  sprint.
- The Progress view PR (#91) sat in a conflicting state for a day because the
  refactor (#93) moved the modules it imported - a sequencing problem the
  team created for itself.
- Customer-facing items (recorded review, demo video, release tag) again
  cluster at sprint close and depend on external availability.

## What we changed from the previous sprint

Following the Sprint 2 retrospective:

- We distributed implementation across all five members with explicit
  implementer/reviewer pairs fixed at planning, instead of concentrating code
  in one person - this sprint every member authored a merged PR.
- We turned customer UAT findings directly into numbered backlog items during
  the review itself (#81-#86), which made Sprint 3 planning a selection
  exercise rather than a rediscovery exercise.

## Action items for the next sprint

1. Sequence dependent PRs at planning time: refactors merge first, features
   rebase on them, to avoid the #91/#93 conflict chain (owner: Scrum Master).
2. Add a GitHub Actions Pages deploy workflow so publishing the app and the
   docs site stops being a manual command (owner: developers).
3. Remove the `src/utils.ts` / `src/useSpeechRecognition.ts` compatibility
   shims once all imports point at `src/voice/` (owner: developers).
