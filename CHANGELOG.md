# Changelog

All notable changes to Voice Games are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
