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

## Next - MVP v2 (remaining post-review scope)

Confirmed with the customer at the Sprint 1 review.

- **More games:** the customer asked for about four more games; two shipped in Sprint 2,
  more to follow - idea collection in issue #54.
- US-15 / US-09 Bilingual support: Russian translation shown and read aloud (understanding),
  English word clickable for pronunciation (imitation) - issues #36, #37.
- US-17 Localized (Russian) interface with a language toggle.
- US-16 Pause button that also stops the microphone.
- US-10 Parent progress: per-word statistics pooled across all lists and all games,
  with a CSV export for teachers (US-19).
- US-11 Upload custom word lists; US-18 play with built-in words without any setup.
- US-03 / US-05 in-game word visibility and easy microphone access.
- US-06 Immediate in-game feedback so a child can retry mispronounced words.

## Later - MVP v3 and beyond

- US-20 Phrase-based translation game: build an English phrase word by word, with a
  Russian-to-English "translate the phrase" mode (Doodle Jump style platforms).
- US-12 Difficulty levels (largely driven by the chosen word list).
- Progress saving across sessions and an accessibility pass (keyboard fallback, captions).
