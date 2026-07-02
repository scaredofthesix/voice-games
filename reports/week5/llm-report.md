# Week 5 LLM Usage Report - Team 40

## Tools used

- Claude (Anthropic) via agentic coding assistants, used by team members for
  pair-programming and documentation drafting during Sprint 3.

## How it was used

- Implementing Sprint 3 PBIs from the team's written task briefs: the shared
  voice module extraction (#82), the deterministic racer movement update
  (#85), the Boss Fight finite/Endless modes (#83), the alien encounter (#86),
  and the Progress view with its pure `src/progress.ts` store (#25), each on
  its own issue-linked branch.
- Resolving merge conflicts when parallel feature branches collided (for
  example merging `main` into the Progress view PR after the voice-module
  refactor moved its imports), followed by running the full gate suite
  (type check, tests, build) before pushing.
- Drafting the Assignment 5 documentation: the architecture views and ADRs
  under `docs/architecture/`, `docs/development-process.md`, the MkDocs site
  configuration, the Definition of Done and testing-strategy updates, the new
  UAT scenarios, and these Week 5 report drafts.

## Human oversight

- The team decided the sprint scope, the implementer/reviewer assignment, and
  the architectural decisions the ADRs record; the assistant wrote them down.
- Every PR was reviewed and approved by the assigned human team member (never
  the implementer) before merge, per the protected-branch rules.
- Generated changes were verified by the local gates and CI (type check, unit
  and integration tests, coverage thresholds, production build, Lighthouse
  accessibility audit) before review.
- The customer Sprint Review / UAT session, its recording, the demo video,
  and the release decision are performed by people only.

## Limitations observed

- The assistants work per-branch and do not see each other's in-flight
  changes, which contributed to the end-of-sprint merge-conflict cluster; the
  retrospective's PR-sequencing action item addresses this.
- Generated documentation had to be fact-checked against the actual code
  (module paths, test file names, coverage numbers) - drafts referenced
  pre-refactor paths until corrected.
