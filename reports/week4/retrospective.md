# Week 4 Sprint Retrospective - Team 40

Public and sanitized. No private personal information.

## What went well

- We delivered the two customer-requested games (Boss Fight, Word Ladder) and a
  full automated quality foundation in one sprint.
- Pulling game rules into a pure `gameLogic.ts` module made tests fast and
  reliable and gave us 100 percent coverage on that module.
- CI now enforces the Definition of Done automatically (type check, tests,
  coverage, build, accessibility audit), so quality is no longer a manual
  checklist.

## What did not go well

- The legacy canvas games remain untested, so global coverage looks low and we
  had to document why.
- We set the Lighthouse accessibility threshold without a local run, so it still
  needs confirmation in CI.
- Several non-code items (Sprint milestone, reviewer assignments, recorded
  meetings, release tag) bunch up at the end of the sprint and depend on the
  whole team and the customer.

## What we changed from the previous sprint

Following the Sprint 1 retrospective, which highlighted that everything happened
through a single person and at the last minute, this sprint we:

- Front-loaded the engineering and split product work (two games) from quality
  work (tests, QRTs, CI) so reviews can be distributed across members.
- Wrote the quality and testing documentation as we built, instead of after.

## Process improvements for the next sprint

1. Create the Sprint milestone and assign implementer plus a different reviewer
   to every PBI at planning time, not at submission time.
2. Run the CI accessibility job early on a draft PR so the threshold is
   confirmed before the increment is frozen.
