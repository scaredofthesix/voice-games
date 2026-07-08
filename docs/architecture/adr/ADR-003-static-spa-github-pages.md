# ADR-003: Static SPA deployment on GitHub Pages

- **Status:** Accepted (Sprint 2/3; replaces the VM as the primary deployment)
- **Deciders:** Team 40
- **Quality requirements addressed:** [QR-1](../../quality-requirements.md#qr-1-functional-correctness-of-speech-matching) (real HTTPS gives persistent microphone permission, the precondition for speech matching to work in customer sessions)

## Context

MVP v0 was served from a university VM (`https://10.93.26.180:8085/`, Docker +
`python http.server`). Two problems surfaced in customer reviews: the VM is
reachable only inside the Innopolis network, so the customer could not test
from home, and its self-signed certificate broke persistent microphone
permission. Because the app is client-only (ADR-001), any static host with
real HTTPS suffices.

## Decision

Deploy the production build as a **static SPA on GitHub Pages** at
`https://scaredofthesix.github.io/voice-games/`, published from the `gh-pages`
branch. The hosted documentation site (MkDocs) is published into the `docs/`
subfolder of the same branch. The VM deployment is frozen as a historical
artifact.

## Alternatives considered

- **Keep the university VM.** Already running, but internal-only and with an
  untrusted certificate - it failed the actual customer workflow twice.
  Rejected.
- **Netlify / Vercel free tier.** Equivalent HTTPS static hosting with nicer
  previews, but adds a third-party account and secrets to a course project
  that already lives on GitHub. GitHub Pages keeps everything in one place.
  Rejected as unnecessary.

## Consequences

- Public HTTPS URL: the customer, teammates, and graders can open the product
  anywhere; microphone permission persists.
- Zero hosting cost and no server maintenance.
- Project-page hosting requires building with `--base=/voice-games/` and an
  SPA 404 fallback; on Git Bash for Windows the base flag must be protected
  from MSYS path mangling (`MSYS_NO_PATHCONV=1`). Documented in the
  [deployment view](../deployment-view/README.md).
- Publishing is currently a manual command; a Pages deploy workflow in GitHub
  Actions is a known improvement candidate.
- Regional note: github.io can require a VPN in some regions; recorded in the
  README as an external restriction.
