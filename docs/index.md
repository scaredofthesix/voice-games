# Voice Games documentation

**Voice Games** is a browser-based collection of voice-controlled English word
games for children aged about 6-10. The voice is the only game controller:
children pronounce English words to steer a racer, pop bubbles, defeat bosses,
launch a rocket, ride a skateboard, and destroy asteroids.

- **Play it:** <https://scaredofthesix.github.io/voice-games/> (Google Chrome,
  microphone required)
- **Source:** <https://github.com/scaredofthesix/voice-games>

## Where to start

| I want to… | Read |
|---|---|
| Understand how the system is built | [Architecture overview](architecture/README.md) |
| See why key design decisions were made | [Architecture decision records](architecture/adr/README.md) |
| Learn how the team works and releases | [Development process](development-process.md) |
| Check the quality bar for changes | [Definition of Done](definition-of-done.md) |
| See measurable quality requirements | [Quality requirements](quality-requirements.md) |
| Understand the test strategy | [Testing strategy](testing.md) |
| Run customer acceptance scenarios | [User acceptance tests](user-acceptance-tests.md) |
| Browse the product backlog context | [User stories](user-stories.md), [Roadmap](roadmap.md) |

## Project facts

- **Team:** Team 40, five members, Scrum with one-week sprints.
- **Stack:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Web Speech API,
  Canvas 2D; Vitest + React Testing Library for tests.
- **Architecture:** client-only static SPA, no backend; deployed on GitHub
  Pages. See [ADR-001](architecture/adr/ADR-001-client-only-web-speech.md) and
  [ADR-003](architecture/adr/ADR-003-static-spa-github-pages.md).
- **Releases:** Semantic Versioning; MVP v1 = v0.1.0, MVP v2 = v0.3.0.
  Notable changes tracked in the repository `CHANGELOG.md`.
