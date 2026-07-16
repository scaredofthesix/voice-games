# Week 7 LLM Usage Report - Team 40

> **Status: IN PROGRESS.** This report records completed Sprint 5 assistance and will be
> extended if the team uses LLM tools for the remaining final-transition or release work.

## Tools used

- OpenAI Codex.

## How it was used

- Collected the Week 6 customer-review follow-up scope from the maintained transcript,
  Sprint Review summary, GitHub issues #140-#146, and their linked pull requests.
- Audited the combined Sprint 5 integration branch against every acceptance criterion.
- Identified and fixed gaps left after the first implementation pass: Echo Microphone could
  reuse one recognized phrase for several cards and did not clearly separate teaching
  playback from hidden-card recall; Magic Wizard's animated canvas preview bypassed the translation dictionary;
  generated Web Audio effects and queued Echo speech needed explicit navigation cleanup.
- Audited all ten games for bilingual word playback, adaptive selection, detailed result
  reporting, replay/back-button consistency, custom-word behavior, and narrow-screen layout.
- Removed the redundant Sentence Bird mic button and Echo target card, added three-heart
  defeat timing, extended adaptive scheduling to the four remaining games, and added a
  shared bilingual per-word result report to Sentence Bird, Echo, and Magic Wizard.
- Replaced pasted delimiter-based custom-word bulk entry with a tested two-column CSV file
  importer and corrected batched state updates so every imported row is retained.
- Added focused tests for Sentence Bird push-to-talk and timeout behavior, Echo card matching
  and playback cleanup, Magic Wizard preview localization, and centralized audio shutdown.
- Updated the changelog and recorded the non-destructive #142 product decision to keep Magic
  Wizard and Treasure Hunter as distinct games in the ten-game roster.
- Re-audited #142 against the original customer transcript after the initial hitbox fix and
  identified that the gameplay-overlap concern was still unresolved. Reworked Magic Wizard
  into an untimed, progressively larger rune-recipe puzzle, added pure recipe/matching logic
  tests and integration coverage, and synchronized the UAT and Week 7 review materials.
- Ran TypeScript checking, 145 automated tests, coverage, the production build, and diff
  whitespace validation.

## Human oversight

- A human team member selected the task and remains responsible for reviewing the changes,
  performing real-browser and microphone UAT, assigning reviewers, and merging the linked
  pull requests. Codex did not approve, merge, release, or deploy anything.
- The Week 6 customer feedback and issue acceptance criteria were treated as source material;
  no new customer quote, approval, or test outcome was invented.

## Limitations observed

- Automated speech tests use the repository's mocked Web Speech API. They verify state and
  interaction behavior but do not replace a Chrome test with a real microphone.
- The redesigned Magic Wizard recipe state and mocked voice flow are automated, but the
  final visual feel and real-microphone behavior still require human Chrome UAT.
