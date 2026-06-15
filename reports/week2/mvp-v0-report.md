# MVP v0 Report - Voice Games (Team 40)

## Purpose and description
MVP v0 is the runnable technical foundation of **Voice Games** - a browser-based voice-controlled learning portal for children. It is a React 19 + Vite + TypeScript application featuring two games (Voice Racer and Voice Bubble Popper) controlled entirely by voice (Web Speech API). It runs fully client-side, with no backend.

## Deployment URL / runnable artifact
- **Live deployment:** https://10.93.26.180:8085/ - hosted on the Innopolis VM, reachable from the Innopolis network/VPN. Open in Google Chrome and accept the self-signed certificate warning. The microphone needs a secure context; if the browser blocks it on the self-signed cert, the app still opens and navigation works (the smoke check below).
- Source in this repository: runnable locally via `npm install && npm run dev` (see [root README -> Local setup](../../README.md#1-local-development-setup)).

## Public video demonstration
- Sanitized public demonstration (< 2 minutes): https://disk.yandex.ru/i/3aCIJDDw9Tat4Q

## Relationship to the prototype and proposed MVP v1 stories
The proposed MVP v1 scope (Must Have only) is US-01, US-02, US-04, US-07, and US-08. MVP v0 already realizes most of this core loop:
- **US-01** (start a game) - the HUB screen, where each game card has a PLAY button.
- **US-02** (choose a game / content) - choosing between Voice Racer and Voice Bubble Popper on the HUB, plus the TASK BOOK word-category selector and custom word lists.
- **US-04** (pronounce a word to trigger the action) - in Voice Racer, speaking a lane's word steers the car into that lane (core Web Speech loop); in Voice Bubble Popper, speaking a bubble's word pops it.
- **US-07** (results) - the game-over / victory state with score and high scores.
- **US-08** (retry a word until it is recognized) - speech recognition runs in continuous mode and the listening loop auto-restarts while playing, so the child can keep pronouncing a word until it is matched rather than failing on a single mis-hear.

US-06 (immediate feedback) was downgraded to Should Have at the customer review and is not part of the MVP v1 slice; v0 still shows lightweight feedback (the word-match flash and the voice-status panel showing what was heard).

The interactive prototype refines how these are presented as the proposed MVP v1 user experience (Home -> game selection -> main game with microphone interaction -> results).

## Current limitations, placeholders, and mocks
- **Chrome-only** voice recognition (Web Speech API); other browsers are not supported.
- **Word matching:** the matcher in `src/utils.ts` (`matchesWord`) uses phonetic and prefix rules. Overly permissive matching undermines the pronunciation-learning goal and is tracked as an open question (see [analysis.md](./analysis.md), affects US-04 / US-06).
- No backend: stats and settings persist only in browser `localStorage`; there is no parent/teacher account, progress sync, or custom word-list management yet (US-10, US-11).

## Local setup instructions
See [root README -> Local setup](../../README.md#1-local-development-setup). No API key required.

## Repeatable smoke-check scenario
**Type:** Web application.

**Access instructions:** open the deployment at https://10.93.26.180:8085/ in Google Chrome (from the Innopolis network/VPN) and accept the self-signed certificate warning. Alternatively, run locally: clone this repository, run `npm install && npm run dev`, and open http://localhost:3000 in Google Chrome on a device with a microphone.

**Steps:**
1. Open the deployment URL (or http://localhost:3000 when running locally).
2. Confirm the HUB screen renders with two game cards (Voice Racer, Voice Bubble Popper).
3. Click **PLAY** on the Voice Racer card, then click **START HIGHWAY RACE!** and allow microphone access when prompted.
4. Confirm the race track appears with lane target words and the microphone visualizer becomes active.

**Expected result:** the application opens without errors, primary navigation works (HUB -> playing), and the microphone-listening state activates. (Voice-driven lane changes additionally require speaking a visible lane word in Chrome.)
