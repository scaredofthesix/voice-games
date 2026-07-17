# Voice Games documentation

**Voice Games** is a browser-based collection of voice-controlled English word
games for children aged about 6-10. Children pronounce English words to steer
characters, solve voice puzzles, and complete ten different games.

- **Play it:** <https://scaredofthesix.github.io/voice-games/> (Google Chrome,
  microphone required)
- **Source:** <https://github.com/scaredofthesix/voice-games>
- **Current Sprint Backlog:** [Sprint 5 milestone](https://github.com/scaredofthesix/voice-games/milestone/5)
- **Project board:** <https://github.com/users/scaredofthesix/projects/1>

## Player quick start

1. Open the Hub and choose a game.
2. Choose a built-in word set, or add your own English words/phrases and translations.
   Multiple rows copied from Google Sheets can be pasted at once: English in column 1 and
   translation in column 2. Separate them with a tab or exactly four ordinary spaces.
   Three or five spaces do not split columns, so phrases such as *Nice to meet you* remain
   intact. Invalid and duplicate rows remain visible for correction. CSV import is not
   used.
3. Choose the difficulty, run length, or mode offered by the game.
4. Press Start and play with your voice.
5. Review the result for that run, then open overall progress. Press **Back to hub** to
   return to the Hub, then press **Progress** in the top-right corner.

![Game result screen: run score, personal high, and a per-word practice report](images/game-result.png)

The end-of-game result reports one run. The separate Progress view combines sessions, high
scores, and word practice across all games on this device.

## Microphone access and controls

Use Google Chrome and choose **Allow** when it requests microphone access. If access was
denied, open the site controls icon to the left of Chrome's address bar, allow the microphone
for this site, and reload. Wait for the on-screen listening indicator before speaking.

Sentence Bird uses push-to-talk and never listens before activation: press
**Click & say / Нажми и скажи**, click the active word card, or press **Space** once, then
speak while the green microphone indicator is active. Echo Microphone pauses recognition
while reading the chain and starts listening automatically when the screen changes to
**Speak now**. A first non-match opens a retry window instead of immediately losing a heart;
after a failed retry, the game reads the same chain again before the next attempt.

## Where to start

| I want to… | Read |
|---|---|
| Operate, support, or recover the application | [Administration and maintenance](admin.md) |
| Understand how the system is built | [Architecture overview](architecture/README.md) |
| See why key design decisions were made | [Architecture decision records](architecture/adr/README.md) |
| Learn how the team works and releases | [Development process](development-process.md) |
| Check the quality bar for changes | [Definition of Done](definition-of-done.md) |
| See measurable quality requirements | [Quality requirements](quality-requirements.md) |
| Understand the test strategy | [Testing strategy](testing.md) |
| Run customer acceptance scenarios | [User acceptance tests](user-acceptance-tests.md) |
| Browse the product backlog context | [User stories](user-stories.md), [Roadmap](roadmap.md) |
| See the selected work for the current sprint | [Sprint 5 milestone](https://github.com/scaredofthesix/voice-games/milestone/5) |

## Project facts

- **Team:** Team 40, five members, Scrum with one-week sprints.
- **Stack:** React 19, TypeScript 5.8.3, Vite 6, Tailwind CSS v4, Web Speech API,
  Canvas 2D; Vitest + React Testing Library for tests.
- **Architecture:** client-only static SPA, no backend; deployed on GitHub
  Pages. See [ADR-001](architecture/adr/ADR-001-client-only-web-speech.md) and
  [ADR-003](architecture/adr/ADR-003-static-spa-github-pages.md).
- **Deployment:** every push to `main` is verified and published by
  `.github/workflows/deploy-pages.yml`; manual publishing is the documented recovery path.
- **Releases:** Semantic Versioning; MVP v1 = v0.1.0, MVP v2 = v0.3.0.
  Notable changes tracked in the repository `CHANGELOG.md`.
