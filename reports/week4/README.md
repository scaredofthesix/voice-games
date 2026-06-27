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
- **Product Backlog board:** [GitHub Project - Product Backlog view](https://github.com/users/scaredofthesix/projects/1).
- **Sprint Backlog board/table:** [GitHub Project - Sprint Backlog view](https://github.com/users/scaredofthesix/projects/1) (filter Sprint = "Sprint 2"; the seven Assignment 4 milestone items).
- **Total Sprint size (Story Points):** 29 SP across 7 PBIs (Boss Fight 8, Voice Rocket Climb 5, test suite 5, quality reqs 3, CI 3, Pause 3, Week 4 report 2).

## Sprint scope and traceability

Every Sprint 2 backlog item, and the user story it serves, is mapped here to the
concrete evidence that represents it: the issue, the reviewed PR that delivered
it, the implementation file(s), the automated test, and the user-facing
acceptance or smoke scenario. This makes explicit how each selected scope item
(including the voice-recognition story US-08) is realized and verified in the
product.

| Backlog item (issue) | User story served | Reviewed PR | Implementation | Automated test | UAT / smoke |
|---|---|---|---|---|---|
| Boss Fight game ([#61](https://github.com/scaredofthesix/voice-games/issues/61)) | "More games" ([#54](https://github.com/scaredofthesix/voice-games/issues/54)); voice recognition US-08 | [#68](https://github.com/scaredofthesix/voice-games/pull/68) | `src/components/BossFightGame.tsx`, `src/gameLogic.ts` | `src/components/BossFightGame.test.tsx`, `src/gameLogic.test.ts` | UAT-02 + Boss Fight smoke |
| Voice Rocket Climb game, formerly Word Ladder ([#62](https://github.com/scaredofthesix/voice-games/issues/62)) | "More games" (#54); voice recognition US-08 | [#68](https://github.com/scaredofthesix/voice-games/pull/68) | `src/components/WordLadderGame.tsx`, `src/gameLogic.ts` | `src/components/WordLadderGame.test.tsx`, `src/gameLogic.test.ts` | UAT-03 + Voice Rocket Climb smoke |
| Pause the game ([#30](https://github.com/scaredofthesix/voice-games/issues/30), US-16) | customer review feedback | [#79](https://github.com/scaredofthesix/voice-games/pull/79) | Pause/resume control + microphone off in every game | manual smoke | n/a |
| Voice recognition accuracy = QR-1 functional correctness | US-08 robust recognition | [#65](https://github.com/scaredofthesix/voice-games/pull/65), [#68](https://github.com/scaredofthesix/voice-games/pull/68) | `src/utils.ts` (`matchesWord`), `src/useSpeechRecognition.ts` | `src/utils.test.ts` (QRT-1) | UAT-01..03 voice control |
| Start / response time = QR-2 performance efficiency | time behaviour | [#65](https://github.com/scaredofthesix/voice-games/pull/65) | recognition matcher path in `src/utils.ts` | `src/utils.perf.test.ts` (QRT-2) | smoke timing note |
| Accessibility / operability = QR-3 usability | usability for children | [#67](https://github.com/scaredofthesix/voice-games/pull/67) | ARIA roles in the game components | a11y assertions in integration tests + Lighthouse job (QRT-3) | UAT manual + Lighthouse |
| Automated test suite + coverage gates ([#58](https://github.com/scaredofthesix/voice-games/issues/58)) | quality foundation | [#65](https://github.com/scaredofthesix/voice-games/pull/65) | `vitest.config.ts`, `src/test/*` | full unit + integration suite | n/a |
| CI + accessibility QA ([#60](https://github.com/scaredofthesix/voice-games/issues/60)) | quality foundation | [#67](https://github.com/scaredofthesix/voice-games/pull/67) | `.github/workflows/ci.yml`, `lighthouserc.json` | CI on every PR and on `main` | n/a |
| Quality reqs + QRTs + DoD ([#59](https://github.com/scaredofthesix/voice-games/issues/59)) | quality foundation | [#69](https://github.com/scaredofthesix/voice-games/pull/69) | `docs/quality-requirements.md`, `docs/quality-requirement-tests.md`, `docs/definition-of-done.md` | QRT mapping | n/a |
| Week 4 report ([#64](https://github.com/scaredofthesix/voice-games/issues/64)) | process evidence | [#66](https://github.com/scaredofthesix/voice-games/pull/66) | `reports/week4/*` | n/a | n/a |

## Delivered product changes

- **Boss Fight** game: pronounce words to damage the boss; a per-word timer
  means a missed word costs the player a life. It is an endless gauntlet of 15
  bosses (Slime through Phoenix) with selectable arena themes.
- **Voice Rocket Climb** game (formerly Word Ladder): pronounce words to fly a
  rocket one step higher through selectable mission themes; reach orbit to win.
- Both games reuse the shared recognition matcher and a new shared speech hook,
  and are wired into the game hub.
- **Phrase practice:** two new vocabulary sets (Short Phrases, Long Phrases) let
  children practise whole greetings and sentences; the recognition matcher grades
  multi-word phrases by word overlap.
- Automated tests, quality requirements, quality requirement tests, CI quality
  gates, and an accessibility audit (see below).

## Customer feedback response

| Feedback point | Resulting PBI or issue | Status | Response |
|---|---|---|---|
| The customer asked for more games (about four more for MVP v2). | [#54](https://github.com/scaredofthesix/voice-games/issues/54) plus _TODO new issues for Boss Fight and Voice Rocket Climb_ | Done (2 of the requested games) | Shipped Boss Fight and Voice Rocket Climb this sprint; the remaining games are queued for later sprints. |
| _TODO any other feedback from the Sprint 1 review or later._ | _TODO_ | _TODO_ | _TODO_ |

Pause (US-16, [#30](https://github.com/scaredofthesix/voice-games/issues/30))
and the RU/EN bilingual interface toggle (US-17) were additionally delivered
this sprint. Feedback not addressed this sprint (for example parent progress
US-10 and difficulty levels US-12) was deferred to keep the sprint focused on
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

All automated tests pass locally and in CI (53 tests at the time of writing).

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
- [Customer review / UAT transcript (per-line timestamps)](./customer-review-transcript.md):
  publish only if the customer permits; every line carries its own `[mm:ss]`
  timestamp. If publication is refused, keep it Moodle-only and state that here.
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

## Submission integrity checklist (avoid repeat deductions)

Lessons carried over from earlier assignment feedback. Confirm each before the
Moodle upload:

- [ ] Scope traceability: the "Sprint scope and traceability" table above maps
  every scope item and its user story (including US-08) to issue, PR, code, and
  test.
- [ ] Voice-triggered outcome: the smoke evidence shows at least one full
  spoken-word-to-win outcome per new game, not just app open plus microphone on
  (see `docs/testing.md`).
- [ ] Transcript timestamps: `customer-review-transcript.md` has a per-line
  `[mm:ss]` timestamp on every line.
- [ ] Fresh link check: the Lychee run linked in the submission is the run on the
  final submitted commit of `main`, not an older run. Re-run the Link check
  workflow (`workflow_dispatch`) on the final commit and link that run.
- [ ] PR evidence: the linked PRs show a filled "Testing performed" section.

---

## Remaining-work checklist (team / customer / Moodle)

1. Create the Assignment 4 Sprint milestone (dates, Sprint Goal, PBIs) and the
   Sprint Backlog Project view; create issues for Boss Fight and Voice Rocket
   Climb and the quality work, with implementer and a different reviewer each.
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
