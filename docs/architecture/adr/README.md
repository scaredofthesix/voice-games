# Architecture decision records (Team 40)

An ADR captures one significant architectural decision: the context that
forced it, the decision itself, the alternatives that were rejected, and the
consequences the team accepts. ADRs are immutable history - a changed decision
gets a new ADR that supersedes the old one.

Format: a lightweight variant of Michael Nygard's ADR template
(Status / Context / Decision / Alternatives considered / Consequences).

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](./ADR-001-client-only-web-speech.md) | Client-only app on the Web Speech API, no backend | Accepted |
| [ADR-002](./ADR-002-canvas-rendering.md) | Canvas 2D for game scenes, DOM for UI chrome | Accepted |
| [ADR-003](./ADR-003-static-spa-github-pages.md) | Static SPA deployment on GitHub Pages | Accepted |
| [ADR-004](./ADR-004-tts-anti-feedback-gate.md) | Mute recognition while the app itself is speaking | Accepted |
| [ADR-005](./ADR-005-shared-voice-module.md) | One shared voice module instead of per-game voice code | Accepted |
