# Week 5 Report - Voice Games (Team 40)

Canonical public report and submission index for Assignment 5 (Sprint 3,
MVP v2). All public evidence is linked from here. Private identity,
recordings, and credentials live only in the Moodle PDF.

> Status: sprint in progress. Items marked TODO are completed at sprint close
> (customer session, release tag, screenshots) and filled in before submission.

## Project

**Voice Games** is a browser-based set of voice-controlled English word games
for children (ages about 6 to 10). The child controls each game by pronouncing
the target English word out loud (Web Speech API, Chrome only).

- Repository: https://github.com/scaredofthesix/voice-games
- Deployed product (public, HTTPS): https://scaredofthesix.github.io/voice-games/
  (the GitHub Pages link may not open from some networks or regions without a
  VPN; this is an external GitHub availability restriction outside the team's
  control, and the same build can always be run locally from the repository)
- Hosted documentation site (MkDocs): https://scaredofthesix.github.io/voice-games/docs/
- Run / access instructions: [root README](../../README.md)

## Sprint

- **Sprint Goal:** Deliver MVP v2 - grow the game library and voice
  reliability while making the product's architecture, development process,
  and configuration explainable and maintainable for future evolution.
- **Sprint dates:** 2026-06-29 to 2026-07-05.
- **Sprint milestone (authoritative scope):** [Assignment 5 - Sprint 3 (MVP v2)](https://github.com/scaredofthesix/voice-games/milestone/3).
- **Product Backlog board:** [GitHub Project - Product Backlog view](https://github.com/users/scaredofthesix/projects/1).
- **Sprint Backlog board/table:** [GitHub Project - Sprint Backlog view](https://github.com/users/scaredofthesix/projects/1) (filter Sprint = "Sprint 3").
- **Total Sprint size (Story Points):** 45 SP planned across 8 PBIs, plus 5 SP
  of emergent work accepted mid-sprint (#97, #101, #102) = 50 SP delivered.
- **Release:** MVP v2 = [v0.3.0](https://github.com/scaredofthesix/voice-games/releases/tag/v0.3.0) (tagged 2026-07-03, marked Latest). MVP v1 = v0.1.0; v0.2.x were Sprint 2 increments toward MVP v2.

## Sprint scope and traceability

Every Sprint 3 backlog item is mapped to the issue, the reviewed PR that
delivered it, the implementer and reviewer (always different members), the
implementation, and the verification.

| Backlog item (issue) | SP | Reviewed PR | Implementer -> Reviewer | Implementation | Verification |
|---|---|---|---|---|---|
| Two new games: Skate Word + Aste Word Destroyer | 8 | [#88](https://github.com/scaredofthesix/voice-games/pull/88) | TeraloToxin -> scaredofthesix | `src/components/SkateWordGame.tsx`, `src/components/AsteWordGame.tsx` | UAT-05; manual smoke |
| Voice anti-feedback guard ([#81](https://github.com/scaredofthesix/voice-games/issues/81)) + Russian-first UI ([#84](https://github.com/scaredofthesix/voice-games/issues/84)) | 5 | [#89](https://github.com/scaredofthesix/voice-games/pull/89) | scaredofthesix -> Kotumbaa | `src/voice/engine.ts` gate, `src/uiLanguage.tsx`, matcher RU/EN | UAT-08; unit tests; [ADR-004](../../docs/architecture/adr/ADR-004-tts-anti-feedback-gate.md) |
| Shared voice-processing module ([#82](https://github.com/scaredofthesix/voice-games/issues/82)) | 5 | [#93](https://github.com/scaredofthesix/voice-games/pull/93) | flikspy -> TeraloToxin | `src/voice/engine.ts`, `src/voice/useVoiceGame.ts` | `src/voice/voiceEngine.test.ts`; [ADR-005](../../docs/architecture/adr/ADR-005-shared-voice-module.md) |
| Boss Fight finite modes + unlockable Endless ([#83](https://github.com/scaredofthesix/voice-games/issues/83)) | 5 | [#90](https://github.com/scaredofthesix/voice-games/pull/90) | Kotumbaa -> flikspy | `src/gameLogic.ts`, `src/components/BossFightGame.tsx` | UAT-06; `src/gameLogic.gauntlet.test.ts` |
| Deterministic Voice Racer movement ([#85](https://github.com/scaredofthesix/voice-games/issues/85)) | 3 | [#94](https://github.com/scaredofthesix/voice-games/pull/94) | flikspy -> MMavInno | `updateRacerMovement` in `src/voice/engine.ts` | unit tests on the movement update |
| End-of-climb alien encounter ([#86](https://github.com/scaredofthesix/voice-games/issues/86)) | 3 | [#92](https://github.com/scaredofthesix/voice-games/pull/92) | MMavInno -> flikspy | `src/components/RocketClimb.tsx`, Rocket Climb win screen | win-screen integration test |
| Progress view, US-10 ([#25](https://github.com/scaredofthesix/voice-games/issues/25)) | 8 | [#91](https://github.com/scaredofthesix/voice-games/pull/91) | Kotumbaa -> MMavInno | `src/progress.ts`, `src/components/ProgressView.tsx` | UAT-07; progress unit + integration tests |
| Architecture, process docs, docs site, reports ([#95](https://github.com/scaredofthesix/voice-games/issues/95)) | 8 | [#96](https://github.com/scaredofthesix/voice-games/pull/96), [#100](https://github.com/scaredofthesix/voice-games/pull/100) | scaredofthesix -> Kotumbaa | `docs/architecture/*`, `docs/development-process.md`, `mkdocs.yml`, `reports/week5/*` | link check CI; docs site build |
| Strict voice matching, no false accepts ([#97](https://github.com/scaredofthesix/voice-games/issues/97)) - emergent, from user testing | 3 | [#98](https://github.com/scaredofthesix/voice-games/pull/98), [#99](https://github.com/scaredofthesix/voice-games/pull/99) | scaredofthesix -> TeraloToxin | `matchesWord` in `src/voice/engine.ts` | no-false-accepts unit suite; local playtest |
| Aste difficulty rebalance ([#101](https://github.com/scaredofthesix/voice-games/issues/101)) + version footer ([#102](https://github.com/scaredofthesix/voice-games/issues/102)) - emergent, follow-up to #97 | 2 | [#99](https://github.com/scaredofthesix/voice-games/pull/99) | scaredofthesix -> TeraloToxin | `src/components/AsteWordGame.tsx` levels; `__APP_VERSION__` footer in `src/App.tsx` | playtest of all levels; footer visible on the live build |

## Delivered product changes (MVP v2 over v0.2.1)

- **Two new games:** Skate Word and Aste Word Destroyer - six voice games total.
- **Voice reliability:** the app no longer scores its own spoken hints
  (anti-feedback gate), the matcher handles Russian transcripts and small
  pronunciation slips (Cyrillic normalization + Levenshtein tolerance), and
  false accepts were eliminated with strict per-token matching (#97).
- **Russian-first UI** with an RU/EN toggle.
- **Boss Fight modes:** finite runs (10/20/30) plus an unlockable Endless mode
  (direct Sprint 2 customer request).
- **Deterministic Voice Racer movement** under live speech streaming.
- **Rocket Climb alien encounter** on the win screen.
- **Progress view:** per-game words practised, high scores, and sessions,
  persisted on the device.

## Architecture and process documentation (new in Assignment 5)

- [Architecture overview](../../docs/architecture/README.md) with
  [static](../../docs/architecture/static-view.md),
  [dynamic](../../docs/architecture/dynamic-view.md), and
  [deployment](../../docs/architecture/deployment-view.md) views (Mermaid).
- [Five ADRs](../../docs/architecture/adr/README.md) recording the significant
  decisions (client-only Web Speech, canvas rendering, GitHub Pages, the
  anti-feedback gate, the shared voice module).
- [Development process and configuration management](../../docs/development-process.md)
  (Scrum cadence, protected-trunk Git workflow with a gitGraph, quality gates,
  SemVer releases).
- Hosted docs site: https://scaredofthesix.github.io/voice-games/docs/
  (MkDocs Material, `mkdocs.yml`; published 2026-07-03).
- Definition of Done extended with the architecture documentation gate
  ([docs/definition-of-done.md](../../docs/definition-of-done.md), item 12).
- Four new UAT scenarios UAT-05..08
  ([docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md)).

## Scrum events and evidence

- Sprint planning: milestone #3 scoped 2026-06-29 with implementer/reviewer
  assignment per PBI (see the table above).
- Customer Sprint Review + UAT session: TODO (recorded session; summary in
  [customer-review-summary.md](./customer-review-summary.md), sanitized
  transcript alongside it; private links and timecodes in the Moodle PDF).
- Retrospective: [retrospective.md](./retrospective.md).
- Reflection: [reflection.md](./reflection.md).
- LLM usage report: [llm-report.md](./llm-report.md).

## Evidence checklist (screenshots in ./images/, added at sprint close)

- [ ] Milestone #3 with all issues closed - TODO
- [ ] Sprint 3 board view (Work Status = Done) - TODO
- [ ] Green CI run on main after the last merge - TODO
- [ ] v0.3.0 release page - TODO
- [ ] A reviewed PR showing approval by the assigned reviewer - TODO
- [ ] Docs site home page - TODO
- [ ] Public demo video (under 2 minutes) - TODO
