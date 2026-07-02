# ADR-002: Canvas 2D for game scenes, DOM for UI chrome

- **Status:** Accepted (Sprint 1, documented in Sprint 3)
- **Deciders:** Team 40

## Context

Each game needs an animated scene (a highway with a swerving car, floating
bubbles, a boss arena, a climbing rocket, a skating run, falling asteroids)
that stays smooth while React state updates on every recognized transcript.
Rendering the scenes as React-managed DOM would re-render hundreds of moving
nodes per frame; a full game engine (Phaser, PixiJS) would add a large
dependency and its own asset pipeline for what are visually simple 2D scenes.

## Decision

Render the **animated game scene on a Canvas 2D element** driven by
`requestAnimationFrame`, and keep **all UI chrome (menus, buttons, status,
scores, word prompts) as regular React DOM**. React owns game state; the
canvas draw loop reads the latest state from refs and only paints.

## Alternatives considered

- **Pure React DOM + CSS animation for scenes.** Simplest mentally, but frame
  drops once many elements animate, and per-frame reconciliation fights the
  60fps loop. Rejected on performance.
- **Game engine (Phaser / PixiJS).** Sprites, physics, and scenes out of the
  box, but a heavyweight dependency, a second programming model next to
  React, and harder to test. Overkill for our scene complexity. Rejected on
  effort and bundle size.
- **SVG scenes.** Declarative and accessible, but same reconciliation problem
  as DOM for continuous motion. Rejected.

## Consequences

- Smooth scenes independent of React render frequency; recognition events can
  update state at any rate without stuttering the animation.
- Canvas content is not accessible by itself, so every gameplay-relevant fact
  drawn on canvas (target word, score, lives, progress) is **also** exposed as
  DOM with ARIA labels and live regions - this is quality requirement QR-3.
- Tests cannot assert on canvas pixels; integration tests assert on the ARIA
  layer and on game state instead. jsdom lacks a canvas context, which the
  tests tolerate by design.
- Each game owns a small hand-written draw loop - acceptable because scenes
  are simple, but a shared engine would be reconsidered if scene complexity
  grows (parallax, particles, physics).
