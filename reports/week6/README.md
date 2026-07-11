# Week 6 report - Assignment 6, Sprint 4 (Team 40)

**Project:** Voice Games - a browser-based, voice-controlled English-learning app for
children (Team 40).

## Sprint 4 - Week 6 trial release

- **Product Backlog board:** https://github.com/scaredofthesix/voice-games/issues
- **Sprint 4 Backlog board (Project view):** https://github.com/users/scaredofthesix/projects/1
  (filter the Sprint field to `Sprint 4`).
- **Sprint 4 milestone:** https://github.com/scaredofthesix/voice-games/milestone/4 (14
  issues, 0 open, closed on schedule before the 2026-07-12 deadline).
- **Sprint Goal:** Deliver a stable Week 6 trial / handover-candidate release that responds
  to the Sprint 3 customer review feedback (adaptive word selection above all), stand up the
  maintained customer-handover and contributor/agent guidance the team will need for
  transition, and refresh the public entry-point docs ahead of the Week 6
  transition-readiness meeting.
- **Sprint dates:** 2026-07-06 to 2026-07-12.
- **Total Sprint 4 size:** 30 Story Points (issues #103, #105, #106, #107, #108, #109, #124).

## Week 6 trial-release summary

[Release `v0.4.0`](https://github.com/scaredofthesix/voice-games/releases/tag/v0.4.0)
completes the ten-game roster with the four games merged just before Sprint 4 planning
(Voice Treasure Hunter, Magic Wizard, Sentence Bird, Echo Microphone), and adds:

- Adaptive word selection driven by progress statistics, so struggled words repeat more
  often (#105, PR #128) - the customer's main Sprint 3 request.
- A fix for a critical progress data-loss bug where a bad `localStorage` read could wipe
  saved progress (#103, PR #127).
- A shared game-UI kit unifying setup screens, hub navigation, the microphone indicator, and
  target-word cards across all 10 games (#133, PR #134; further unification in PR #137).
- Game-specific polish from the Sprint 3 review: Skate Word ground/jump physics (#106),
  Aste Word Destroyer Russian translations (#107), Boss Fight HUD clarity (#108), and one
  consistent hear-the-word control across games (#109).
- The maintained handover documentation set: `docs/customer-handover.md`, `CONTRIBUTING.md`,
  `AGENTS.md`, refreshed `README.md` and `CHANGELOG.md` (#124, PR #126).

`main` is green at the release commit: `npm run lint` (TypeScript check) clean, 13 test
files / 99 tests passing, `npm run build` clean.

## Access and documentation links

- [README.md](../../README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/customer-handover.md](../../docs/customer-handover.md)
- [Hosted documentation site](https://scaredofthesix.github.io/voice-games/docs/)
- [docs/roadmap.md](../../docs/roadmap.md)
- **Week 6 product access:** live build at https://scaredofthesix.github.io/voice-games/,
  and the tagged release: https://github.com/scaredofthesix/voice-games/releases/tag/v0.4.0

## Customer-facing documentation review

The customer reviewed `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CHANGELOG.md`, and
`docs/customer-handover.md` live during the meeting (full detail in
[`sprint-review-transcript.md`](./sprint-review-transcript.md), Part 3).

**Found clear / accepted as-is:** `CONTRIBUTING.md`'s setup workflow, Definition of Done, and
code conventions; `AGENTS.md`; the `CHANGELOG.md` being current; the MIT license; and the
facts in `docs/customer-handover.md` (no secrets required, repository ownership, access
model).

**Found unclear or in need of restructuring, not factually wrong:** `README.md` mixes
product-facing and developer-facing content in one flat document, buries the live-product
link, and still carries coursework wording ("Assignment 6", "Sprint 3") that should not be in
a document a future non-team maintainer reads. The customer specified an exact requested
order: live-product link, game list, two representative screenshots, hosted-docs link, then a
"For Developers" section (Repository Layout, Tech Stack, Setup and Deployment, License).
The customer also asked for a `docs/README.md` (renamed from `docs/index.md`) to index the
`docs/` directory, and a short visual Quick Start showing how to add a custom word.

**Found missing:** a way to bulk-add custom words instead of one at a time; an explicit,
pinned TypeScript version in `package.json` (the team's verbal answer at the meeting,
"7.0.2", does not match `package.json`'s `~5.8.2` - this needs reconciling before pinning).

All of the above became [issue #146](https://github.com/scaredofthesix/voice-games/issues/146)
(README/docs restructuring and TypeScript-version reconciliation).

## Transition-readiness summary

The customer's own assessment at the end of the meeting: "The product is almost ready. A few
things need to be fixed, and then it will be in good shape." Specifically:

- **Ready:** public access (GitHub Pages, no account/install needed), continuous deployment
  on merge to `main`, progress export (CSV downloaded successfully), hub navigation, Russian
  interface, repository ownership arrangement (team keeps ownership, customer does not need
  write access), and the overall documentation set's factual content.
- **Needs changes before Week 7 transition confirmation:** the Sentence Bird, Echo
  Microphone, and Magic Wizard issues found live during UAT (see below); confirming adaptive
  word selection is dynamic within a round, not just between rounds; bulk custom-word import;
  audio not stopping when switching games; internationalizing the preview screen; the
  README/docs restructuring described above.
- The customer explicitly accepted the plan to fix these items and present the result in
  Week 7 as sufficient for now; see `docs/customer-handover.md`'s handover-status table for
  the resulting interim `Accepted with follow-up items` status (final Part 8 confirmation is
  a Week 7 activity).

## Customer feedback response table

| Feedback point | Resulting issue | Status |
|---|---|---|
| Sentence Bird: contrast, silence handling, timer/lose animation, push-to-talk mic activation | [#140](https://github.com/scaredofthesix/voice-games/issues/140) | Open, Sprint 5 |
| Echo Microphone: restore memory mechanic, fix short-phrase card bug, brighten hub button | [#141](https://github.com/scaredofthesix/voice-games/issues/141) | Open, Sprint 5 |
| Magic Wizard: hitbox bug, timer visibility, decide overlap with Treasure Hunter | [#142](https://github.com/scaredofthesix/voice-games/issues/142) | Open, Sprint 5 |
| Adaptive word selection: dynamic within-round reweighting, algorithm tests | [#143](https://github.com/scaredofthesix/voice-games/issues/143) | Open, Sprint 5 |
| Bulk custom-word import (multiline, `\|`/`;` delimiter) | [#144](https://github.com/scaredofthesix/voice-games/issues/144) | Open, Sprint 5 |
| Stop audio on hub/game switch; internationalize preview screen; keep CSV in English | [#145](https://github.com/scaredofthesix/voice-games/issues/145) | Open, Sprint 5 |
| README/docs restructuring; reconcile and pin TypeScript version; implementer/accountable-reviewer process note | [#146](https://github.com/scaredofthesix/voice-games/issues/146) | Open, Sprint 5 |
| Progress-view lost counters | [#103](https://github.com/scaredofthesix/voice-games/issues/103) | Closed, Sprint 4 |
| Adaptive word selection (initial implementation) | [#105](https://github.com/scaredofthesix/voice-games/issues/105) | Closed, Sprint 4 (dynamism re-verified as #143) |
| Skate Word ground/jump physics | [#106](https://github.com/scaredofthesix/voice-games/issues/106) | Closed, Sprint 4 |
| Aste Word Destroyer Russian translations | [#107](https://github.com/scaredofthesix/voice-games/issues/107) | Closed, Sprint 4 |
| Boss Fight HUD clarity | [#108](https://github.com/scaredofthesix/voice-games/issues/108) | Closed, Sprint 4 |
| Consistent hear-the-word control | [#109](https://github.com/scaredofthesix/voice-games/issues/109) | Closed, Sprint 4 |
| CSV export readable columns | [#104](https://github.com/scaredofthesix/voice-games/issues/104) | Closed, Sprint 4 (PR #137) |

## Feedback not yet addressed

All Week 6 feedback points above have a tracked issue in the Sprint 5 milestone; none were
left untracked. None are fixed yet as of this report - Sprint 5 work starts after this
submission, per the Sprint 4/Sprint 5 boundary.

## UAT / customer-trial results

| UAT | Scenario | Result | Notes |
|---|---|---|---|
| UAT-09 | Voice Treasure Hunter | Pass | Money counter increased with correct pronunciation, confirmed live. |
| UAT-10 | Sentence Bird | Issues found | Text/background contrast bug; continuous listening scores unrelated speech as wrong; game-over flow not as expected. See #140. |
| UAT-11 | Echo Microphone | Pass, with one issue | Target phrase visible on screen undermines the memory mechanic; short-phrase word sets produced 3 cards for 1 phrase. See #141. |
| UAT-12 | Magic Wizard | Issues found | Spell-cast hitbox problems; customer flagged mechanic overlap with Voice Treasure Hunter. See #142. |
| UAT-13 | Adaptive word selection | Inconclusive | Could not confirm live whether selection is dynamic within the current round; team acknowledged the behavior was unverified. See #143. |
| UAT-14 | Unified hub navigation | Pass | Both tested games returned to the hub via the same button; audio from the previous game was still audible after switching (see #145). |

Full detail and quotes are in
[`sprint-review-transcript.md`](./sprint-review-transcript.md). This session's UAT execution
is also recorded in `docs/user-acceptance-tests.md`'s execution history.

## Sprint Review

- Sprint Review transcript:
  [reports/week6/sprint-review-transcript.md](./sprint-review-transcript.md) (publication
  explicitly permitted by the customer at the start of the session).
- [reports/week6/sprint-review-summary.md](./sprint-review-summary.md)

## Retrospective, reflection, LLM usage

- [reports/week6/retrospective.md](./retrospective.md)
- [reports/week6/reflection.md](./reflection.md)
- [reports/week6/llm-report.md](./llm-report.md)

## Current product status and expected Week 7 follow-up

`v0.4.0` is live with all ten games, adaptive word selection, and unified UI/hub navigation.
The customer confirmed the product is close to transition-ready but identified concrete
defects in three of the newest games plus documentation and usability follow-ups (see the
feedback table above). Sprint 5 (Week 7) will fix issues #140-#146, re-verify the adaptive
word-selection feature's in-round dynamism with automated tests, get the still-unreviewed
adaptive-word-selection PR (#128) reviewed by a second person, cut the final `MVP v3`
release, and run the Week 7 final-transition confirmation against `docs/customer-handover.md`.

## Contribution traceability

| Team member | Issues | PRs | Review | Testing / docs / deployment |
|---|---|---|---|---|
| scaredofthesix (Maxim) | #103, #105, #106, #107, #108, #109, #124, #133 (author/assignee); ran the Week 6 customer session | #126, #127, #128, #129, #130, #131, #132, #134, #137 | Reviewed/approved #118, #122, #123, #135, #136 | Authored `docs/customer-handover.md`, `CONTRIBUTING.md`, `AGENTS.md`, README refresh; verified lint/tests/build before every PR; wrote this report from the session transcript |
| Kotumbaa | #116, #115 (pre-Sprint-4 new games) | #119, #122, #123, #138 (version bump + 160 FPS refactor) | Reviewed/approved #129, #130, #131, #132, #134, #137 | - |
| flikspy | #103 (implementer, per grooming) | #120, #121 (pre-Sprint-4 new games), #135, #136 (Sentence Bird rework, Echo Microphone word-set picker) | Reviewed/approved #127 | - |
| MMavInno | - | - | Reviewed/approved #138, #139 | - |
| TeraloToxin | - | - | Reviewed/approved #126 | - |

## Evidence screenshots

_TODO - add screenshots to `reports/week6/images/` for: the Sprint 4 milestone view, the
`v0.4.0` release page, and one example reviewed issue-linked PR (for example PR #127 or
#134). Not generated in this pass; add before the Week 6 Moodle PDF is assembled._
</content>
