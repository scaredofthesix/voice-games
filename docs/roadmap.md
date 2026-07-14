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

## Done - four more games (main pre-Sprint-4 work, not yet tagged as a release)

Delivered on `main` between the Sprint 3 release and Sprint 4 planning, completing the
customer's "four more games" request from the Sprint 3 review: Voice Treasure Hunter
(submarine spelling game), Voice Magic Wizard (magic battle game), Sentence Bird
(speech-driven cloud jumping), and Echo Microphone (speech memory chain). The product now
has **ten games total**, meeting the "ten games total in the final version" target early.
This work has not yet been cut into a tagged release; that happens as part of the Sprint 4
trial release below.

## Done - Sprint 4 (Week 6, 2026-07-06 to 2026-07-12) - release v0.4.1

Assignment 6 Sprint 4. Selected Sprint Backlog = [milestone #4](https://github.com/scaredofthesix/voice-games/milestone/4).
Fixes the customer's Sprint 3 review feedback and stands up the handover artifacts needed
for transition, ahead of the Week 6 trial/transition-readiness meeting.

- **Adaptive word selection driven by progress statistics**: repeat struggled words,
  introduce unseen ones, de-prioritize mastered ones, in all games - issue #105
  (customer's main feature request).
- Progress view fix: lost sessions/words counters - issue #103.
- Game polish from the review: Skate Word ground/jump - issue #106; Aste Word Destroyer
  Russian translations - issue #107; Boss Fight HUD (hit counter, duplicated health bar) -
  issue #108; one consistent hear-the-word control across games, "Help" renamed to
  "EN"/flag - issue #109.
- Maintained handover documentation: `docs/customer-handover.md`, `CONTRIBUTING.md`,
  `AGENTS.md`, refreshed `README.md` and `CHANGELOG.md` - issue #124.
- Corrective SemVer release `v0.4.1`, the canonical Week 6 trial release after the original
  `v0.4.0` tag was found to precede its package-version and final code commits.

## Sprint 5 (Week 7, 2026-07-13 to 2026-07-19) - final MVP v3 and transition

Assignment 6 Sprint 5. Selected Sprint Backlog = [milestone #5](https://github.com/scaredofthesix/voice-games/milestone/5).
This is the state the product reaches by the end of the course; no post-course versions are
planned beyond it.

- CSV export in readable columns - issue #104 (relates to US-19, issue #52), completed early
  during Week 6 and retained in Sprint 5 traceability.
- Week 6 customer trial follow-up: Sentence Bird #140, Echo Microphone #141, Magic Wizard
  #142, adaptive word selection #143, bulk custom-word input #144, and cross-game audio and
  internationalization polish #145.
- Cross-game completion audit: all ten games use progress-weighted word scheduling, expose
  English and Russian playback for built-in and newly added custom words, and finish with
  score, record, and per-word practice reporting.
- Product decision for #142: keep both Magic Wizard and Treasure Hunter in the final ten-game
  roster. Magic Wizard keeps the approaching-monster spell battle, while Treasure Hunter
  keeps the submarine, depth, and chest-collection loop with a more visible timer. No game is
  merged or retired without a later customer-backed roster decision.
- README and documentation restructuring #146, completed during Week 6 finalization.
- Confirm the final transition outcome and handover level with the customer against
  `docs/customer-handover.md` - issue #125.
- Final SemVer release mapped to **MVP v3**, the last course version, plus a public
  sanitized demo video and Demo Day preparation.
- US-20 phrase-assembly mode (issue #53) and the accessibility pass (keyboard fallback,
  captions) are stretch scope for Sprint 5 if time allows; not committed.
