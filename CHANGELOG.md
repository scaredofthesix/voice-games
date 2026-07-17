# Changelog

All notable changes to Voice Games are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added one clear bulk custom-word flow for two-column rows pasted from Google Sheets or
  plain text. A tab or exactly four consecutive ordinary spaces separates the
  English word/phrase from its translation; one to three spaces do not. The flow preserves
  multi-word phrases and Unicode translations, accepts BOM and Windows/Unix line endings,
  and reports malformed or duplicate rows (#144).
- Added a deterministic in-round reinforcement queue so a word failed once returns within
  the next one to three eligible prompts, then loses extra priority gradually after correct
  answers (#143).
- Added one detailed, bilingual result-card pattern for games that previously ended with
  only summary totals, including aggregate practised/correct/struggled totals, per-word
  counts, and replay controls.
- Added a production GitHub Pages workflow that verifies, builds and publishes every push
  to `main` without API keys or deployment secrets.

### Changed

- Voice Maze Quest now starts at 5x5, remembers the selected maze size, keeps that size for
  every newly generated floor, and shows the available route words below the map in larger,
  wrapping cards so long phrases remain readable without zooming.
- Custom vocabulary guidance now recommends Google Sheets and documents the two exact
  supported separators: a real tab character or exactly four ordinary spaces.
- Sentence Bird now uses a dedicated microphone button, its active word card, or Space as
  explicit push-to-talk controls. A clear active state and short listening window ensure
  that the game never listens before the child asks it to (#140).
- Echo Microphone now hides the current words during recall to preserve the memory task,
  gives the recognizer a 3.5-second correction window, replays a failed chain, and shows a
  clear transition before the next round (#141).
- Magic Wizard has been replaced in the product by Voice Maze Quest: a procedurally
  generated visual maze where every open route has a valid spoken word. Children collect
  crystals, bypass one visible red hazard cell, unlock a large, easy-to-see
  portal, and continue through endlessly generated, progressively harder floors without
  the rejected cursed-rune mechanic (#142). Route words are now centred high-contrast map labels
  with separate English and Russian playback controls,
  the locked portal reports the exact number of missing crystals, and the maze plays at
  most one positive sound per accepted route with no failure sound for unrecognized speech.
- Adaptive word scheduling now also covers Voice Racer, Bubble Popper, Sentence Bird, and
  Echo Microphone, so all ten games react to recorded struggles (#143).
- Shared setup, play-header, pause, Hub, and result patterns now cover the complete game
  roster, with identical setup/result widths, one compact Hub button directly above each
  game card, and the oldest games migrated to the same bilingual component set.

### Fixed

- Prevented one accepted speech-recognition event from completing two consecutive prompts.
  After a successful match, the microphone pauses, the previous transcript is cleared, and
  a fresh recognition session starts after a short processing delay.
- Valid bulk vocabulary rows are saved while invalid and duplicate rows remain in the input
  with a specific correction reason, including "This word already exists."
- Stopped speech synthesis and generated sound effects when leaving or switching games,
  kept Progress CSV export in English, and localized every visible game HUD and result
  label (#145).
- Removed the fragile custom-vocabulary CSV file upload and ambiguous comma, semicolon,
  pipe, and one-to-three-space delimiter guessing; exactly four ordinary spaces
  remain a supported bulk-paste separator (#144).
- Preserved Russian playback for newly added custom words, standardized high-contrast hub
  buttons and pink replay buttons, and tightened Treasure Hunter's narrow-screen header.

## [0.4.1] - 2026-07-12

Assignment 6, Sprint 4 corrective Week 6 trial release. This patch aligns the SemVer tag,
package metadata, deployed code, and final public evidence after the original `v0.4.0` tag
was created before the version-bump and final Week 6 commits reached `main`.

### Added

- Completed the public game gallery with real gameplay screenshots for all ten games.
- Added the final Week 6 public report, Sprint Review transcript and summary, retrospective,
  reflection, LLM usage report, UAT results, and inspectable evidence screenshots (#150).
- Added `docs/README.md` as a customer-facing index of the maintained documentation set
  (#146).

### Changed

- Restructured `README.md` into a product-first public entry point (live-product link, the
  ten-game list, screenshots, a custom-word Quick Start, then a "For Developers" section),
  removed coursework and internal-mirror wording, and added `docs/README.md` as a
  documentation index, per the Week 6 customer review (#146).
- Pinned the TypeScript dev dependency to an exact version (`5.8.3`) for reproducible
  builds (#146).
- Refactored the canvas game loops to use frame-rate-independent movement calibrated to the
  existing 160 FPS baseline, so game speed stays stable across devices.
- Reconciled the Sprint 4 report, milestone totals, Story Points, backlog links, contribution
  traceability, and handover wording with the final GitHub state (#150).

### Fixed

- Fixed the Sentence Bird failure-message Russian translation fallback.
- Prevented Magic Wizard from casting multiple spells from one recognized word and adjusted
  the monster and spell speeds for the reviewed gameplay pace.
- Corrected the Week 6 release traceability mismatch by bumping package metadata to `0.4.1`
  before creating the replacement trial tag from protected `main` (#150).
- Removed generated content markers, stale evidence captions, and public exact recording
  timecodes from the Week 6 report set (#150).

## [0.4.0] - 2026-07-11

Assignment 6, Sprint 4 (Week 6). Completes the customer's "four more games" request from
the Sprint 3 review, unifies the interface across the ten-game roster, and stands up the
maintained handover documentation ahead of the Week 6 trial release.

### Added

- Four new games completing the ten-game roster: **Voice Treasure Hunter** (submarine
  spelling game, #115), **Magic Wizard** (elemental spell-casting battle game, #116),
  **Sentence Bird** (speech-driven cloud jumping), and **Echo Microphone** (speech memory
  chain).
- A **shared game UI kit** with tested theme and mode pickers, word-set selection,
  target-word playback cards, and pause/resume controls (#133).
- **`docs/customer-handover.md`**: the maintained handover artifact describing current
  transition status, what's transferred vs. retained, configuration/secrets, and
  setup/deployment/recovery/verification steps (#124).
- **`CONTRIBUTING.md`** and **`AGENTS.md`** at the repository root (#124).

### Changed

- Recurring setup and gameplay controls now use one layout and interaction
  pattern across all 10 games, including Echo Microphone, while each game's
  purpose-specific scene and mechanic remain intact (#133).
- Sentence Bird now starts listening automatically during play, shows heard
  speech inside the shared target card, and uses a compact listening pill
  instead of a separate microphone and recognition panel.
- Sentence Bird is reworked into single-word, one-pipe-at-a-time flappy play
  with the shared word sets while keeping its bird and sky scenes.
- Echo Microphone now draws chain words from the shared word sets and includes
  a theme picker on its setup screen.
- Voice Racer now fills its race frame responsively instead of rendering as a
  small letterboxed canvas.
- Voice Racer and Bubble Popper now place the Start action after configuration,
  matching the other game setup screens.
- `README.md` refreshed as the public entry point: current ten-game roster, links to the
  hosted docs site, `docs/customer-handover.md`, `CONTRIBUTING.md`, and `AGENTS.md`.
- `docs/roadmap.md` and `docs/development-process.md` updated for the Sprint 4 / Sprint 5
  plan (Assignment 6, Weeks 6-7).

## [0.3.0] - 2026-07-03

Sprint 3 (MVP v2) release. Every Sprint 2 customer review finding from
2026-06-27 is addressed below.

### Added

- Two new games: **Skate Word** (keep the skater rolling by pronouncing words)
  and **Aste Word Destroyer** (destroy asteroids by saying their words) (#88).
- **Boss Fight difficulty modes**: finite runs of 3 / 5 / 10 bosses plus an
  **Endless mode unlocked** by completing a finite run (#83).
- **Progress view**: per-game words practised, high scores, and sessions
  played, stored on the device and reachable from the hub (US-10, #25).
- A friendly **alien encounter** on the Voice Rocket Climb win screen (#86).
- **Architecture documentation**: static, dynamic, and deployment views with
  Mermaid diagrams and five architecture decision records under
  `docs/architecture/`.
- **Development process and configuration management** documentation
  (`docs/development-process.md`) and a hosted MkDocs documentation site.
- The app version is shown in a footer on every view, so the deployed build
  is identifiable during customer sessions.

### Changed

- The interface now **defaults to Russian** with the RU/EN toggle kept (#84).
- Voice handling consolidated into a **shared `src/voice/` module** (engine +
  recognition hook) used by all six games (#82).
- **Voice Racer movement is deterministic**: lane changes apply on a fixed
  timestep with de-jittered voice input instead of frame-dependent updates
  (#85).
- The recognition matcher normalizes **Cyrillic transcripts** and tolerates
  small pronunciation slips via Levenshtein distance.
- Definition of Done extended with an architecture documentation gate.
- **Aste Word Destroyer difficulty rebalanced** for the stricter matcher:
  fewer and slower asteroids per level, leaving realistic time to pronounce
  each word including recognition latency.

### Fixed

- The speech engine **no longer scores its own spoken hints**: recognition
  results are dropped while text-to-speech is playing (anti-feedback gate)
  (#81).
- **False-positive voice matches eliminated**: the matcher now requires a
  strict token match with a tight, length-scaled edit-distance budget instead
  of substring and consonant-skeleton heuristics that accepted almost any
  speech (#97).

## [0.2.1] - 2026-06-27

### Added

- Per-game visual theme pickers: Voice Rocket Climb mission themes (Earth Orbit,
  Flight to Mars, Alien Nebula), Boss Fight arena themes (Castle Ruins, Lava
  Dungeon, Magic Forest, Void Abyss), plus theme choices for Voice Racer (with a
  live highway preview) and Bubble Popper.
- Two phrase vocabulary sets, Short Phrases and Long Phrases, so children can
  practise whole greetings and sentences instead of only single words.

### Changed

- Renamed the Word Ladder game to Voice Rocket Climb (RU: Космический старт) and
  shortened the app title from "Voice Word Games" to "Voice Games".
- Boss Fight gauntlet expanded from 3 to 15 bosses (Slime through Phoenix) with a
  steadily rising health curve for a longer endless run.
- The recognition matcher now grades multi-word phrases by word overlap, and the
  on-screen target word scales its font down so long phrases stay readable.

## [0.2.0] - 2026-06-26

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
- Pause and resume in every game (US-16): a prominent Pause/Resume control and a
  "Paused" overlay that freezes gameplay and turns the microphone off until you
  resume.
- Russian support: translations for every built-in word set, an in-game RU/EN
  interface toggle, the word translation shown during play, and a "Listen in
  Russian" button.

### Changed

- Boss Fight and Word Ladder reworked into full canvas games. Boss Fight is an
  endless boss gauntlet (Goblin, Ogre, Dragon and beyond) that keeps sending
  tougher bosses until you run out of lives, with an animated arena and a
  per-word timer; Word Ladder flies an animated rocket (now pointing straight up)
  through ground, cloud, sky and space zones. Both open with a setup screen
  (word-set choice, a listen-and-learn warmup, and add-your-own-words) like the
  first two games.
- The interface now scales up on desktop screens, and the Boss Fight hero reads
  more clearly against the arena background.
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

[Unreleased]: https://github.com/scaredofthesix/voice-games/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/scaredofthesix/voice-games/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/scaredofthesix/voice-games/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/scaredofthesix/voice-games/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/scaredofthesix/voice-games/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/scaredofthesix/voice-games/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/scaredofthesix/voice-games/releases/tag/v0.1.0

