# Week 4 Report - Voice Games (Team 40)

Canonical public report and submission index for Assignment 4 (Sprint 2).
All public evidence is linked from here. Private identity, recordings, and
credentials live only in the Moodle PDF.

> Items marked _TODO_ depend on a team, customer, or Moodle action that cannot
> be produced from the codebase alone. See the bottom of this file for the
> remaining-work checklist.

## Project

**Voice Games** is a browser-based set of voice-controlled English word games
for children (ages about 6 to 10). The child controls each game by pronouncing
the target English word out loud (Web Speech API, Chrome only).

- Repository: https://github.com/scaredofthesix/voice-games
- Deployed product (public, HTTPS): https://scaredofthesix.github.io/voice-games/
- Run / access instructions: [root README](../../README.md)

## Sprint

- **Sprint Goal:** Strengthen product quality and raise customer value by adding
  two requested games and putting automated quality gates (tests, quality
  requirement tests, coverage, CI, and an accessibility check) in place that
  govern all later work.
- **Sprint dates:** _TODO start_ to _TODO finish_.
- **Sprint milestone (authoritative scope):** _TODO link to the Assignment 4
  Sprint milestone_.
- **Product Backlog board:** _TODO link to the GitHub Project Product Backlog
  view_.
- **Sprint Backlog board/table:** _TODO link to the GitHub Project Sprint
  Backlog view filtered to the Assignment 4 milestone_.
- **Total Sprint size (Story Points):** _TODO sum once PBIs are estimated_.

## Delivered product changes

- **Boss Fight** game: pronounce words to damage the boss; a per-word timer
  means a missed word costs the player a life. Beat the boss to win.
- **Word Ladder** game: pronounce words to fly a rocket one step higher; reach
  the top of the ladder to win.
- Both games reuse the shared recognition matcher and a new shared speech hook,
  and are wired into the game hub.
- Automated tests, quality requirements, quality requirement tests, CI quality
  gates, and an accessibility audit (see below).

## Customer feedback response

| Feedback point | Resulting PBI or issue | Status | Response |
|---|---|---|---|
| The customer asked for more games (about four more for MVP v2). | [#54](https://github.com/scaredofthesix/voice-games/issues/54) plus _TODO new issues for Boss Fight and Word Ladder_ | Done (2 of the requested games) | Shipped Boss Fight and Word Ladder this sprint; the remaining games are queued for later sprints. |
| _TODO any other feedback from the Sprint 1 review or later._ | _TODO_ | _TODO_ | _TODO_ |

Feedback not addressed this sprint (for example bilingual UI US-17, pause
US-16, parent progress US-10) was deferred to keep the sprint focused on
quality automation and the two requested games; it remains on the roadmap.

## Quality model and documentation

- Quality model: ISO/IEC 25010 product quality. Selected sub-characteristics:
  **functional correctness**, **performance efficiency (time behaviour)**, and
  **usability (operability / accessibility)**.
- [docs/roadmap.md](../../docs/roadmap.md)
- [docs/definition-of-done.md](../../docs/definition-of-done.md)
- [docs/quality-requirements.md](../../docs/quality-requirements.md)
- [docs/quality-requirement-tests.md](../../docs/quality-requirement-tests.md)
- [docs/testing.md](../../docs/testing.md)
- [docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md)

## Testing status

All automated tests pass locally and in CI (43 tests at the time of writing).

| Critical module | Line coverage | Floor |
|-----------------|---------------|-------|
| `src/gameLogic.ts` | 100% | 30% |
| `src/utils.ts` | ~62% | 30% |
| `src/components/WordLadderGame.tsx` | ~92% | - |
| `src/components/BossFightGame.tsx` | ~91% | - |
| `src/data.ts` | 100% | - |

Global coverage is intentionally lower; rationale in
[docs/testing.md](../../docs/testing.md).

- Unit tests: [`src/utils.test.ts`](../../src/utils.test.ts),
  [`src/gameLogic.test.ts`](../../src/gameLogic.test.ts),
  [`src/data.test.ts`](../../src/data.test.ts).
- Integration tests:
  [`src/components/WordLadderGame.test.tsx`](../../src/components/WordLadderGame.test.tsx),
  [`src/components/BossFightGame.test.tsx`](../../src/components/BossFightGame.test.tsx).
- Automated quality requirement tests: QRT-1 (above), QRT-2
  [`src/utils.perf.test.ts`](../../src/utils.perf.test.ts), QRT-3 (accessibility
  assertions in the integration tests plus the Lighthouse job).

## CI and quality gates

- CI pipeline: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
  (type check, tests with coverage, build, Lighthouse accessibility audit).
- Latest protected-branch CI run: _TODO link to the latest green run on `main`_.
- Branch protection evidence: _TODO screenshot or settings link for `main`
  (merge-commit only, one required approval, no force-push)_.
- Additional QA check: Lighthouse accessibility audit (the `accessibility` job).
  Screenshots / report links: _TODO_.
- Link check (separate, not the additional QA check):
  [`.github/workflows/links.yml`](../../.github/workflows/links.yml).

These tests, CI checks, quality requirement tests, and the updated Definition of
Done are maintained assets and continue to govern later project work; later PBIs
must keep them passing or extend them rather than bypass them.

## Release

- SemVer release for the Sprint 2 increment: _TODO link to the `v0.2.0` release
  once tagged on `main`_.
- [CHANGELOG.md](../../CHANGELOG.md)

## Demo and review evidence

- Public sanitized demo video (under 2 minutes): _TODO link_.
- Optional public slides: see `reports/week4/presentation.pdf` if published.
- Public UAT results summary: _TODO once the customer executes UAT-01..03; see
  `docs/user-acceptance-tests.md`_.
- Customer review transcript / notes: _TODO link to
  `customer-review-transcript.md` if publication is permitted, otherwise state
  Moodle-only sharing or link `customer-review-notes.md`_.
- [Customer review summary](./customer-review-summary.md)
- [Reflection](./reflection.md)
- [Retrospective](./retrospective.md)
- [LLM usage report](./llm-report.md)

## Status and next steps

- **Current status:** Two new games shipped behind a full automated quality
  gate; recognition, game logic, and the new games are covered by tests and CI.
- **Next steps:** Tag `v0.2.0`, run the recorded UAT and Sprint Review, fill the
  live links and screenshots below, then continue MVP v2 (bilingual UI, pause,
  parent progress) on top of the now-enforced quality gates.

## Contribution traceability

| Member (GitHub) | Issues | PRs | Reviews | Testing / quality / automation / docs |
|---|---|---|---|---|
| _TODO_ | _TODO_ | _TODO_ | _TODO_ | _TODO_ |

## Embedded screenshots (reports/week4/images/)

_TODO add and embed: Sprint milestone, latest protected-branch CI run, branch
protection, coverage/test report, additional QA check (Lighthouse) result,
SemVer release, an example reviewed issue-linked PR._

---

## Remaining-work checklist (team / customer / Moodle)

1. Create the Assignment 4 Sprint milestone (dates, Sprint Goal, PBIs) and the
   Sprint Backlog Project view; create issues for Boss Fight and Word Ladder and
   the quality work, with implementer and a different reviewer each.
2. Open issue-linked PRs for this branch's work and have a different team member
   review, approve, and merge each (protected `main`).
3. After merge, confirm the CI run on `main` is green (including the Lighthouse
   accessibility job; tune `lighthouserc.json` minScore only if the runner
   reports a genuinely lower achievable score) and tag `v0.2.0`.
4. Run the recorded UAT + Sprint Review with the customer (>=3 scenarios from
   `docs/user-acceptance-tests.md`); record results and permissions.
5. Record the public sanitized demo video (under 2 minutes) and link it here and
   from the release.
6. Fill every _TODO_ link and screenshot above; build the Moodle PDF.
