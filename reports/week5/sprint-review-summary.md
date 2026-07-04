# Week 5 Customer Review / UAT Summary - Team 40

Public, sanitized summary of the Sprint 3 review. Private details (customer
identity, recording link, exact timecodes) go to the Moodle PDF only.

## Session

- **Date:** 2026-07-03.
- **Format:** recorded online session in two segments (about 47 minutes
  total); recording and public-transcript permission granted at the start.
- **Participants:** Scrum Master (Maksim), Developer (Aleksandr), Developer
  (Svyatoslav, observing), and the Customer.
- **Build demonstrated:** MVP v2 = v0.3.0 on the public deployment
  https://scaredofthesix.github.io/voice-games/ (version footer visible in the
  recording as build evidence).
- **Transcript:** [sprint-review-transcript.md](./sprint-review-transcript.md).

## What was shown

1. Sprint 3 outcome against the Sprint Goal: all six Sprint 2 findings
   delivered (anti-feedback gate, stricter recognition, Boss Fight modes,
   Russian-first UI, deterministic racer movement, rocket-game alien ending),
   plus the last two of the four requested games and the Progress view.
2. Scrum evidence: milestone 3 at 100 percent, Sprint 3 backlog, v0.3.0
   release page, live deployment with the v0.3.0 footer.
3. Live demo (Scrum Master): Russian first launch, Boss Fight finite modes
   (3/5/10 bosses) with unlockable Infinity mode, Skate Word, Aste Word
   Destroyer difficulty levels, Rocket Climb at 20 words, Progress view with
   CSV export.
4. Customer-executed UAT on the public deployment (scenarios below).
5. Architecture and process documentation walkthrough on the docs site
   (dynamic, deployment, and static views).

## UAT results

| Scenario | Result | Notes |
|---|---|---|
| UAT-05 (new games) | Pass | Long phrases recognized in both games. Findings: skater floats above the road and lands on obstacles after jumps (#106); Aste words should also show Russian translations (#107). |
| UAT-06 (Boss modes) | Pass | Customer picked the finite 3-boss mode and defeated bosses with phrases and fruit words. Findings: hit counter too small and ambiguous, duplicated boss health bar questioned (#108). |
| UAT-07 (Progress view) | Pass | Progress survived a page reload on the customer's device. A separate demo-time bug: one game showed 0 sessions / 0 words with record 120 (#103). |
| UAT-08 (RU default + no self-trigger) | Pass | UI opened in Russian for everyone; pressing the hear-it/Help control did not register as the customer's pronunciation. Finding: rename "Help" to "EN"/flag (#109). |

Execution results are also appended to the execution history table in
[docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md).

## Verdict

The customer accepted the increment: all six Sprint 2 findings were confirmed
as delivered, the two new games and the Progress view were played end to end,
and no finding blocked MVP v2. All feedback below targets the next (final)
version.

## Feedback and follow-ups

Captured as GitHub issues during/after the session:

| Feedback | Issue |
|---|---|
| Progress view lost per-game sessions/words counters while records persisted (found live during the demo) | [#103](https://github.com/scaredofthesix/voice-games/issues/103) |
| Progress CSV export should be split into readable columns | [#104](https://github.com/scaredofthesix/voice-games/issues/104) |
| Word selection should use progress statistics: repeat struggled words, introduce unseen ones, de-prioritize mastered ones - in all games | [#105](https://github.com/scaredofthesix/voice-games/issues/105) |
| Skate Word: skater floats above the road; jump should clear the obstacle (Chrome-dino style) | [#106](https://github.com/scaredofthesix/voice-games/issues/106) |
| Aste Word Destroyer: show Russian translations for target words | [#107](https://github.com/scaredofthesix/voice-games/issues/107) |
| Boss Fight HUD: bigger and unambiguous hit counter; rethink the duplicated boss health bar | [#108](https://github.com/scaredofthesix/voice-games/issues/108) |
| One consistent hear-the-word control across games; rename "Help" to "EN"/flag; consider clickable word + translation buttons | [#109](https://github.com/scaredofthesix/voice-games/issues/109) |
| Architecture diagrams need a notation legend (Mermaid, not strict UML); deployment-view HTTPS GET arrow must go client to server | [#110](https://github.com/scaredofthesix/voice-games/issues/110) - fixed in the same docs update |

## Deadline agreed with the customer

The final version must be ready by the end of the week preceding the demo day,
that is **by 2026-07-19** (two weeks after this session). The team committed to
four more games plus the fixes above in that window.
