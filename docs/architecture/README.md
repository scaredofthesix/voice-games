# Architecture (Team 40)

This section documents the architecture of Voice Games: how the system is
decomposed, how the parts interact at runtime, how the product is deployed, and
which significant design decisions were made and why. It was introduced in
Assignment 5 (Sprint 3) and is a maintained project asset: any change that
alters a component boundary, a runtime flow, or the deployment shape must
update the affected view and, for significant decisions, add an ADR.

## Contents

Each architectural view lives in its own directory together with its
diagrams-as-code sources (Mermaid embedded in Markdown):

| Document | What it answers |
|---|---|
| [Static view](./static-view/README.md) | What are the components and how do they depend on each other? |
| [Dynamic view](./dynamic-view/README.md) | What happens at runtime when a child speaks a word? |
| [Deployment view](./deployment-view/README.md) | Where does the code run and how does it get there? |
| [Architecture decision records](./adr/README.md) | Why is the system built this way? |

All diagrams use [Mermaid](https://mermaid.js.org/) so they render natively on
GitHub and on the hosted docs site without generated image files, and the
diagram sources are versioned and reviewed together with the code they
describe.

## System in one paragraph

Voice Games is a **client-only single-page application**. Everything runs in
the child's browser: React renders the UI, the Web Speech API turns the child's
voice into text and reads words aloud, a pure matching engine decides whether
the spoken text matches the target word, and each game turns matches into
gameplay on a canvas or DOM scene. There is no backend service and no account
system; the only persistence is `localStorage` on the child's device. The
production build is a static bundle served from GitHub Pages over HTTPS (HTTPS
is required for microphone access).

## Static view (component diagram)

Full view with the diagrams and the component responsibilities table:
[static-view/README.md](./static-view/README.md).

**What the diagrams show.** The layer diagram decomposes the codebase into
five components: the application shell (`App.tsx`, view routing and shared
state), the six game components, the shared voice module (`src/voice/`), the
pure logic and data modules (`gameLogic.ts`, `progress.ts`, `data.ts`), and
the browser platform APIs. Arrows are compile-time dependencies and always
point from UI toward pure logic. A second, zoomed-in diagram shows the voice
path: every game reaches speech recognition and text-to-speech through the
same two files.

**Coupling and cohesion.** Coupling is low and one-directional: game
components depend on the voice module and pure logic, never on each other, and
pure modules import no React code. Cohesion is highest where it matters most:
all voice concerns (recognition lifecycle, matching, TTS, the anti-feedback
gate) live in one module, so a cross-cutting voice fix lands in one place and
reaches all six games at once. The remaining known coupling debt is the pair
of re-export shims (`src/utils.ts`, `src/useSpeechRecognition.ts`) kept for
older imports; they are documented in the view and scheduled for removal.

**Maintainability implications.** A new game is added by writing one component
against the voice module and pure logic, without touching other games; this is
exactly how Skate Word and Aste Word Destroyer landed in Sprint 3. Pure
modules are unit-testable without a browser, which keeps the test suite fast
and the CI gate cheap.

**Quality requirements.** The structure directly supports
[QR-1](../quality-requirements.md#qr-1-functional-correctness-of-speech-matching)
and [QR-2](../quality-requirements.md#qr-2-response-time-of-speech-matching):
one pure, perf-tested matcher serves every game. It constrains
[QR-3](../quality-requirements.md#qr-3-operable-accessible-game-controls):
canvas scenes are invisible to assistive technology, so accessible names,
roles, and live regions must be provided in the DOM chrome around the canvas
(see [ADR-002](./adr/ADR-002-canvas-rendering.md)).

## Dynamic view (sequence diagram)

Full view with the sequence and state diagrams:
[dynamic-view/README.md](./dynamic-view/README.md).

**What the diagram shows and why this scenario.** The sequence diagram traces
the one flow every game shares and the product cannot exist without: **a child
speaks a word and the game reacts**. It involves five components (the browser
recognizer, the recognition hook, the voice engine, the game component, and
the progress store) and shows both branches that shaped the design: transcripts
arriving while the app itself is speaking are dropped (the anti-feedback gate,
[ADR-004](./adr/ADR-004-tts-anti-feedback-gate.md)), and genuine transcripts
go through strict token matching before any game state changes (issue #97).
A companion state diagram covers the recognition lifecycle: auto-restart on
silence and recovery from recognizer errors.

**What it helps reason about.** The diagram makes the two architecture
boundaries visible: the browser boundary (speech recognition is delegated to
Chrome, [ADR-001](./adr/ADR-001-client-only-web-speech.md)) and the shared
voice module boundary ([ADR-005](./adr/ADR-005-shared-voice-module.md)).
It is also the reasoning tool for
[QR-1](../quality-requirements.md#qr-1-functional-correctness-of-speech-matching)
(where false accepts are filtered out) and
[QR-2](../quality-requirements.md#qr-2-response-time-of-speech-matching)
(the match happens synchronously between two in-browser calls, with no network
round-trip in the loop the team controls).

## Deployment view (deployment diagram)

Full view with the diagram, environments table, and publish procedure:
[deployment-view/README.md](./deployment-view/README.md).

**What the diagram shows.** The deployment diagram shows the three
environments and the paths between them: the repository and CI on GitHub, the
static production hosting on GitHub Pages (app plus the MkDocs docs site on
the same `gh-pages` branch), and the child's device where the SPA, the Web
Speech API, and `localStorage` live. Solid arrows are runtime requests drawn
from initiator to responder (the customer-facing access path is the browser
fetching the bundle over HTTPS); dotted arrows are build-time or publish-time
flows, including the internal Innopolis VM mirror of released builds.

**Why this deployment model.** The app is client-only
([ADR-001](./adr/ADR-001-client-only-web-speech.md)), so any static host with
real HTTPS suffices. GitHub Pages was chosen over the university VM because
the VM was reachable only inside the university network and its self-signed
certificate broke persistent microphone permission
([ADR-003](./adr/ADR-003-static-spa-github-pages.md)). Pages gives a public
URL, free HTTPS, and zero server operations.

**How it supports and constrains the product, and what operating it takes.**
The model supports the course constraints perfectly: no secrets, no paid
infrastructure, the customer opens a URL and tests from home. The constraints
to keep in mind when operating it: Chrome is the only supported browser,
recognition needs network connectivity (Chrome streams audio to its speech
service), GitHub availability restrictions may require a VPN in some regions
(documented in the README and reports), and publishing is a manual
`gh-pages` push described step by step in the view.

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

## Decisions and quality requirements

The five [ADRs](./adr/README.md) record why the system is built this way, and
each one names the quality requirement(s) from
[docs/quality-requirements.md](../quality-requirements.md) it addresses:

| ADR | Decision | Quality requirements addressed |
|---|---|---|
| [ADR-001](./adr/ADR-001-client-only-web-speech.md) | Client-only app on the Web Speech API | QR-1, QR-2 |
| [ADR-002](./adr/ADR-002-canvas-rendering.md) | Canvas 2D scenes, DOM UI chrome | QR-2, QR-3 |
| [ADR-003](./adr/ADR-003-static-spa-github-pages.md) | Static SPA on GitHub Pages | QR-1 |
| [ADR-004](./adr/ADR-004-tts-anti-feedback-gate.md) | Mute recognition while the app speaks | QR-1 |
| [ADR-005](./adr/ADR-005-shared-voice-module.md) | One shared voice module | QR-1, QR-2 |

## How this documentation is kept honest

- The static view names real files and directories; CI keeps the referenced
  modules compiling and tested.
- The Definition of Done ([docs/definition-of-done.md](../definition-of-done.md))
  requires architecture-relevant changes to update these documents.
- Decisions are never edited in place: a superseded ADR is marked superseded
  and a new ADR records the replacement decision.
