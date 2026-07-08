# Voice Games - Product Roadmap

A living, high-level view of where the product is going. Detailed work lives in GitHub
Issues and the Sprint board; this file gives the customer and team the big picture.
Priorities follow the customer-approved MoSCoW scope and are revisited at each review.

## Done - MVP v1 (release v0.1.0, Sprint 1, 15-21 Jun 2026)

Shipped and demonstrated at the Sprint 1 customer review. Live (public, HTTPS):
https://scaredofthesix.github.io/voice-games/

- US-01 Start a game from a child-friendly home screen.
- US-02 Choose a game (Voice Racer, Voice Bubble Popper).
- US-04 Control the game by pronouncing the target word.
- US-07 See score and lives, and a results screen.
- US-08 Reliable, multi-attempt speech recognition - issue #35.
- Bubble speed tuned for younger players - issue #34; placeholder slot removed - issue #33.

## Done - Sprint 2 (MVP v2 start, Assignment 4)

Quality-and-automation sprint. Delivered increment plus the quality gates that now govern
all later work.

- **Two new games** answering the customer "more games" request (issue #54):
  Boss Fight (a 15-boss endless gauntlet) and Voice Rocket Climb (formerly
  Word Ladder).
- **Automated testing** added with Vitest: unit, integration, and a performance test;
  critical modules kept above the coverage floor (see `docs/testing.md`).
- **Quality requirements** defined against ISO/IEC 25010 with automated quality requirement
  tests (`docs/quality-requirements.md`, `docs/quality-requirement-tests.md`).
- **CI quality gates** added: type check, tests with coverage, build, and a Lighthouse
  accessibility audit. These gates and tests are maintained assets and continue to apply to
  every later sprint per the updated Definition of Done.

## Done - Sprint 3 (MVP v2 complete, release v0.3.0, 29 Jun - 5 Jul 2026)

MVP v2 shipped as [release v0.3.0](https://github.com/scaredofthesix/voice-games/releases/tag/v0.3.0).
Every Sprint 2 customer review finding was addressed.

- **Two more games** completing the customer "four more games" request (issue #54,
  closed): Skate Word and Aste Word Destroyer (PR #88).
- **US-10 Progress view**: per-game words practised, high scores and sessions,
  stored on the device - issue #25.
- **Anti-feedback gate**: the app no longer scores its own spoken hints - issue #81.
- **Shared voice module** (`src/voice/`) reused by all six games - issue #82.
- **Boss Fight difficulty modes**: 3 / 5 / 10 bosses plus unlockable Endless -
  issue #83 (also closes US-12 together with the Aste difficulty levels).
- **Russian-first interface** with the RU/EN toggle kept - issue #84.
- **Deterministic Voice Racer movement** (fixed timestep, de-jittered input) - issue #85.
- **Alien encounter** on the Rocket Climb win screen - issue #86.
- **Strict voice matching**: false accepts eliminated - issue #97; Aste difficulty
  rebalanced for it (#101) and a version footer added (#102).
- **Architecture, process and docs site**: Mermaid views, 5 ADRs,
  development-process doc, hosted MkDocs site - issue #95.

## Next - final version (MVP v3), due 2026-07-19

Scope agreed at the Sprint 3 customer review (2026-07-03): the final version
must be ready by the end of the week preceding the demo day, 2026-07-19.

- **Four more games** (ten games total in the final version) - customer request.
- **Adaptive word selection driven by progress statistics**: repeat struggled
  words, introduce unseen ones, de-prioritize mastered ones, in all games -
  issue #105 (customer's main feature request).
- **One consistent hear-the-word control across games**, "Help" renamed to
  "EN"/flag - issue #109.
- Progress view fixes: lost sessions/words counters - issue #103; CSV export in
  readable columns - issue #104 (relates to US-19, issue #52).
- Game polish from the review: Skate Word ground/jump - issue #106; Aste Word
  Destroyer Russian translations - issue #107; Boss Fight HUD (hit counter,
  duplicated health bar) - issue #108.
- US-20 Phrase-based translation game: build an English phrase word by word, with a
  Russian-to-English "translate the phrase" mode - issue #53 (phrase word sets
  already shipped in v0.2.1; the assembly mechanic remains).
- An accessibility pass (keyboard fallback, captions).
