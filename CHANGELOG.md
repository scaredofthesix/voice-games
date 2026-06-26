# Changelog

All notable changes to Voice Games are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Two new voice games requested by the customer: Boss Fight (pronounce words to
  damage the boss before it beats you) and Word Ladder (pronounce words to fly a
  rocket up the ladder to the top).
- Automated test suite with Vitest: unit tests for the recognition matcher and
  game logic, word-list integrity tests, and integration tests that drive the
  new games through a fake speech recognizer.
- Quality requirements (ISO/IEC 25010) and automated quality requirement tests:
  `docs/quality-requirements.md`, `docs/quality-requirement-tests.md`.
- Testing strategy documentation: `docs/testing.md`.
- Continuous integration: type check, tests with coverage, build, and a
  Lighthouse accessibility audit (`.github/workflows/ci.yml`).

### Changed

- Boss Fight and Word Ladder reworked into full canvas games. Boss Fight is now a
  three-boss gauntlet (Goblin, Ogre, Dragon) with an animated arena, boss phases
  by remaining health, and a per-word timer; Word Ladder flies an animated rocket
  through ground, cloud, sky and space zones. Both now open with a setup screen
  (word-set choice, a listen-and-learn warmup, and add-your-own-words) like the
  first two games.
- Definition of Done now requires passing CI, automated tests, quality
  requirement tests, and minimum coverage on critical modules.

### Notes

- These changes target the MVP v2 / Sprint 2 increment for Assignment 4.

## [0.1.0] - 2026-06-21

### Added

- Two voice-controlled English word games: Voice Racer and Voice Bubble Popper.
- Custom word lists with add / delete / clear (per game).
- Listen-and-practice mode: tap a word to hear its pronunciation.
- Audio visualizer and live "words heard" feedback during play.

### Changed

- Bubble Popper: reduced bubble rise speed and spawn rate so younger players have
  time to read and pronounce each word (#34).
- Game selection now shows only the real playable games; removed the developer
  placeholder slot (#33).

### Notes

- This is the MVP v1 release for the Sprint 1 customer review.
- Voice input requires Google Chrome (Web Speech API).

[Unreleased]: https://github.com/scaredofthesix/voice-games/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/scaredofthesix/voice-games/releases/tag/v0.1.0
