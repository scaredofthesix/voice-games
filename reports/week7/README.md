# Week 7 report - Assignment 6, Sprint 5 (Team 40)

> **Status: IN PROGRESS.** This is the canonical Week 7 public report for Sprint 5, and the
> final Assignment 6 submission index. It links the full Week 6 evidence rather than
> duplicating it. Factual Sprint 5 delivery sections are filled below; sections that depend on
> the Week 7 customer transition meeting, the final MVP v3 release, and the public demo video
> are marked `_PENDING_` rather than filled with placeholder content.

**Week 6 report (full context, evidence, and process detail):** [reports/week6/README.md](../week6/README.md)

## Sprint 5 - final MVP v3 and transition

- **Product Backlog board:** https://github.com/users/scaredofthesix/projects/1
- **Sprint 5 Backlog board (Project view):** https://github.com/users/scaredofthesix/projects/1 (filter `Sprint = Sprint 5`)
- **Sprint 5 milestone:** https://github.com/scaredofthesix/voice-games/milestone/5
- **Sprint Goal:** Complete follow-up maintenance from the Week 6 customer trial, finish the
  customer's remaining Sprint-3-review asks, confirm the final transition outcome and
  handover level against `docs/customer-handover.md`, and deliver the final course version
  MVP v3 with a SemVer release, public sanitized demo video, and Demo Day preparation.
- **Sprint dates:** 2026-07-13 to 2026-07-19.
- **Total Sprint 5 size:** 49 Story Points (issues #104, #125, #140-#146).

## Week 7 follow-up and MVP v3 summary

Sprint 5 turned the Week 6 trial feedback into the final ten-game product. The initial fixes
for all six Week 6 follow-up issues were reviewed by a second team member and merged to the
protected `main` branch, followed by a cross-cutting integration pass. A final #142 follow-up
then addressed the customer's deeper gameplay-overlap concern before the Week 7 review:

- **Sentence Bird** (#140, PR #157): three hearts, a visible per-word timer, a defeat fall
  animation, high-contrast active word, and push-to-talk mic activation; unrelated speech no
  longer costs a life.
- **Echo Microphone** (#141, PR #153): the memory mechanic is restored - sequence words show
  during teaching playback then flip to hidden cards for recall - each recognized phrase is
  consumed once, and the hub button is brightened.
- **Magic Wizard + Treasure Hunter** (#142, PR #158 plus the Week 7 follow-up branch):
  Treasure Hunter keeps its timed submarine-and-chest loop and visible countdown. Magic
  Wizard is now an untimed spell-crafting puzzle: the child can pronounce a growing recipe
  of word runes in any order, with no approaching monster or lost lives.
- **Adaptive word selection** (#143, PR #155): progress-weighted scheduling now reacts to
  in-round struggles, with a seeded distribution test suite; extended in integration to
  cover all ten games.
- **Bulk custom-word import** (#144, PR #154, extended in #160): add many words at once by
  pasting a list or importing a two-column CSV file, sharing one delimiter-tolerant parser.
- **Cross-game polish** (#145, PR #156, extended in #160): audio (speech synthesis and
  generated sound effects) now stops centrally when leaving or switching a game; CSV export
  stays English; canvas previews localized.
- **Integration polish** (PR #160): dual file+paste custom-word import, central audio-context
  cleanup, adaptive selection extended to Voice Racer, a shared bilingual per-word result
  card, and a typed audio window replacing the last `as any` casts.

CSV-columns export (#104) landed earlier and is retained in Sprint 5 traceability.

## Access and documentation links

- [README.md](../../README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/customer-handover.md](../../docs/customer-handover.md)
- [Hosted documentation site](https://scaredofthesix.github.io/voice-games/docs/)
- **Final product access (MVP v3):** _PENDING - link the final SemVer release once tagged._
  Current live product (latest trial release): https://scaredofthesix.github.io/voice-games/

## Final transition outcome

_PENDING the Week 7 customer transition-confirmation meeting._ To be stated here and in
`docs/customer-handover.md`: the handover level reached (`Ready for independent use` /
`Independently used by customer` / `Deployed or operated on customer side`) and the
customer-confirmation status (`Accepted` / `Accepted with follow-up items` / `Not yet
accepted`).

## What was transferred, delegated, or retained

The product is a static browser app deployed publicly on GitHub Pages, with source, issues,
CI, and the hosted documentation site all public. The team currently retains the GitHub
repository and the internal Innopolis VM mirror; no private credentials or paid services are
required to run or host it. See [docs/customer-handover.md](../../docs/customer-handover.md)
for the authoritative, current transition scope. _Final transferred/retained wording is
confirmed against the Week 7 meeting outcome (PENDING)._

## Remaining transition blockers, limitations, and support expectations

- Voice input requires Google Chrome (Web Speech API); this is a documented product
  limitation, not a defect.
- Echo Microphone short-phrase card count (#141), the reworked Magic Wizard mechanic (#142),
  and preview-screen language coverage (#145) still require live customer confirmation.
- The final #142 follow-up must be reviewed, merged, and included in the review build before
  the team presents it as delivered.
- _Any further blockers or support expectations raised at the Week 7 meeting: PENDING._

## Customer-independent use / deployment evidence

_PENDING - sanitized public summary of any customer-independent use or customer-side
deployment observed during the Week 7 meeting. Private recordings, timecodes, and credentials
belong only in the Week 7 Moodle PDF._

## Customer feedback response table (Sprint 5 follow-up)

| Week 6 feedback point | Issue | Sprint 5 resolution |
|---|---|---|
| Sentence Bird: contrast, silence handling, timer/lose animation, push-to-talk mic | [#140](https://github.com/scaredofthesix/voice-games/issues/140) | Merged (PR #157) |
| Echo Microphone: restore memory mechanic, short-phrase card bug, brighten hub button | [#141](https://github.com/scaredofthesix/voice-games/issues/141) | Code merged (PR #153); short-phrase card count open for live customer confirmation |
| Magic Wizard: hitbox bug, timer visibility, overlap with Treasure Hunter | [#142](https://github.com/scaredofthesix/voice-games/issues/142) | Initial hitbox/timer fix merged (PR #158); distinct untimed rune-recipe gameplay prepared for review and customer confirmation |
| Adaptive word selection: dynamic within-round reweighting + tests | [#143](https://github.com/scaredofthesix/voice-games/issues/143) | Merged (PR #155), extended to all ten games in PR #160 |
| Bulk custom-word import (multiline, file + paste) | [#144](https://github.com/scaredofthesix/voice-games/issues/144) | Merged (PR #154); CSV-file import added in PR #160 |
| Stop audio on hub/game switch; internationalize preview; keep CSV English | [#145](https://github.com/scaredofthesix/voice-games/issues/145) | Code merged (PR #156); remaining preview English open for customer confirmation |
| CSV export in readable columns | [#104](https://github.com/scaredofthesix/voice-games/issues/104) | Closed (PR #137, Week 6) |

_Additional feedback raised at the Week 7 meeting: PENDING._

## UAT / customer-trial results (Week 7)

Maintained UAT scenarios: [docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md).
_Execution results from the Week 7 transition confirmation: PENDING._

## Release and demo video

- **Final SemVer release (MVP v3):** _PENDING - to be cut from protected `main` with a tag of
  higher SemVer precedence than `v0.4.1`, once the Week 7 meeting outcome and the public demo
  video are ready to link._
- [CHANGELOG.md](../../CHANGELOG.md)
- **Public sanitized demo video:** _PENDING - link once recorded._

## Demo Day preparation

_PENDING - confirmation that the required Week 7 lab rehearsal preparation was completed._
Slide deck is prepared under the team's presentation working folder and submitted through
Moodle (not committed to the public repository).

## Sprint Review

- Sprint Review transcript or notes: _PENDING the Week 7 meeting._
- [reports/week7/sprint-review-summary.md](./sprint-review-summary.md) _(PENDING - filled after the meeting)_

## Retrospective, reflection, LLM usage

- [reports/week7/retrospective.md](./retrospective.md) _(PENDING - after the Sprint 5 retro)_
- [reports/week7/reflection.md](./reflection.md) _(PENDING - after final delivery)_
- [reports/week7/llm-report.md](./llm-report.md)

## Final product status

Ten voice-controlled English games share one UI shell, adaptive per-word scheduling,
bilingual EN/RU playback for built-in and custom words, and per-word practice reporting.
The review branch is green (TypeScript check clean, 145 tests across 19 files, coverage
gates and production build clean).
The final MVP v3 release, transition confirmation, and demo video complete the picture -
_release and confirmation PENDING per the sections above._

## Contribution traceability

| Team member | Issues / PRs authored | Review + merge | Testing | Docs / transition / release |
|---|---|---|---|---|
| scaredofthesix (Maksim Bodulev) | Sprint 5 fix PRs #153-#158, integration PR #160; issues #140-#145 implemented | - | Wrote adaptive/parser/game tests; ran lint + 145 tests + coverage + build gate | CHANGELOG, roadmap, Week 7 report, handover doc, git/release orchestration |
| Kotumbaa | - | Reviewed + merged #153 (Echo), #155 (adaptive) | Live-tested Echo memory mechanic and adaptive repeats | - |
| flikspy | - | Reviewed + merged #154 (bulk import), #157 (Sentence Bird) | Live-tested import and mic push-to-talk | - |
| TeraloToxin | - | Reviewed + merged #156 (cross-game audio); reviewing #160 | Live-tested audio stop on navigation | - |
| MMavInno | - | Reviewed + merged #158 (Magic Wizard + Treasure Hunter) | Live-tested both canvas games | - |

_Demo Day preparation and final-meeting contributions added after Week 7 activities complete._

## Evidence screenshots

_PENDING - Sprint 5 milestone, final MVP v3 release, final product access, an example
reviewed issue-linked PR (e.g. #158 or #160), and other Week 7 evidence, embedded from
`reports/week7/images/`._
