# Architecture (Team 40)

This section documents the architecture of Voice Games: how the system is
decomposed, how the parts interact at runtime, how the product is deployed, and
which significant design decisions were made and why. It was introduced in
Assignment 5 (Sprint 3) and is a maintained project asset: any change that
alters a component boundary, a runtime flow, or the deployment shape must
update the affected view and, for significant decisions, add an ADR.

## Contents

| Document | What it answers |
|---|---|
| [Static view](./static-view.md) | What are the components and how do they depend on each other? |
| [Dynamic view](./dynamic-view.md) | What happens at runtime when a child speaks a word? |
| [Deployment view](./deployment-view.md) | Where does the code run and how does it get there? |
| [Architecture decision records](./adr/README.md) | Why is the system built this way? |

All diagrams use [Mermaid](https://mermaid.js.org/) so they render natively on
GitHub and on the hosted docs site without generated image files.

## System in one paragraph

Voice Games is a **client-only single-page application**. Everything runs in
the child's browser: React renders the UI, the Web Speech API turns the child's
voice into text and reads words aloud, a pure matching engine decides whether
the spoken text matches the target word, and each game turns matches into
gameplay on a canvas or DOM scene. There is no backend service and no account
system; the only persistence is `localStorage` on the child's device. The
production build is a static bundle served from GitHub Pages over HTTPS (HTTPS
is required for microphone access).

## Key architectural properties

- **Client-only, zero backend.** No server code, no database, no secrets. See
  [ADR-001](./adr/ADR-001-client-only-web-speech.md).
- **One shared voice engine.** Speech recognition lifecycle, text-to-speech,
  the anti-feedback gate, and word matching live in a single `src/voice/`
  module consumed by every game, instead of being copied per game. See
  [ADR-005](./adr/ADR-005-shared-voice-module.md).
- **Pure logic, thin components.** Game rules (`src/gameLogic.ts`), matching
  (`src/voice/engine.ts`), and progress tracking (`src/progress.ts`) are pure
  TypeScript modules with unit tests; React components stay thin and are
  covered by integration tests.
- **Static deployment.** The build output is a static SPA on GitHub Pages,
  which gives the team HTTPS, a public URL, and zero hosting operations. See
  [ADR-003](./adr/ADR-003-static-spa-github-pages.md).

## How this documentation is kept honest

- The static view names real files and directories; CI keeps the referenced
  modules compiling and tested.
- The Definition of Done ([docs/definition-of-done.md](../definition-of-done.md))
  requires architecture-relevant changes to update these documents.
- Decisions are never edited in place: a superseded ADR is marked superseded
  and a new ADR records the replacement decision.
