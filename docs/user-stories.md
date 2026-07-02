# User Stories - Current Index (Voice Games, Team 40)

Authoritative current registry of stable user-story IDs and current membership. The **issue tracker is the source of truth for live issue details and execution state**; this file mirrors enough metadata for quick traceability. Historical Assignment 2 narrative lives in [reports/week2/user-stories.md](../reports/week2/user-stories.md) and is preserved unchanged.

- Supporting technical/infra/docs PBIs are tracked as separate linked issues in the tracker (not indexed here).
- **Work Status** uses the canonical values: To Do, Ready, In Progress, Review, Done.
- **SP** is the story-point estimate (Fibonacci). **MVP** is the targeted release (v1 / v2 / v3).
- **Sprint** links the Sprint milestone when assigned, otherwise `-`.
- Order: active stories by MoSCoW, then by Sprint, then by stable ID; removed stories last.

| ID | Short title | MoSCoW | SP | MVP | Issue | Work Status | Sprint |
|---|---|---|---|---|---|---|---|
| US-01 | Start a game from the home screen | Must Have | 2 | v1 | [#16](https://github.com/scaredofthesix/voice-games/issues/16) | Done | [Sprint 1](https://github.com/scaredofthesix/voice-games/milestone/1) |
| US-02 | Choose which word game to play | Must Have | 8 | v1 | [#17](https://github.com/scaredofthesix/voice-games/issues/17) | Done | [Sprint 1](https://github.com/scaredofthesix/voice-games/milestone/1) |
| US-04 | Pronounce a word to trigger the in-game action | Must Have | 8 | v1 | [#19](https://github.com/scaredofthesix/voice-games/issues/19) | Done | [Sprint 1](https://github.com/scaredofthesix/voice-games/milestone/1) |
| US-07 | See my results at the end of a round | Must Have | 3 | v1 | [#22](https://github.com/scaredofthesix/voice-games/issues/22) | Done | [Sprint 1](https://github.com/scaredofthesix/voice-games/milestone/1) |
| US-08 | Retry a word until it is recognized | Must Have | 5 | v1 | [#23](https://github.com/scaredofthesix/voice-games/issues/23) | Done | [Sprint 1](https://github.com/scaredofthesix/voice-games/milestone/1) |
| US-03 | See the target word clearly | Must Have | 2 | v2 | [#18](https://github.com/scaredofthesix/voice-games/issues/18) | Done | - |
| US-05 | Grant microphone access easily | Must Have | 2 | v2 | [#20](https://github.com/scaredofthesix/voice-games/issues/20) | Done | - |
| US-09 | Hear how the English word should sound | Must Have | 2 | v2 | [#24](https://github.com/scaredofthesix/voice-games/issues/24) | Done | - |
| US-10 | Review my child's progress | Must Have | 8 | v2 | [#25](https://github.com/scaredofthesix/voice-games/issues/25) | Done | [Sprint 3](https://github.com/scaredofthesix/voice-games/milestone/3) |
| US-11 | Upload a custom word list | Must Have | 5 | v2 | [#26](https://github.com/scaredofthesix/voice-games/issues/26) | Done | - |
| US-18 | Play with built-in words without uploading a list | Must Have | 3 | v2 | [#51](https://github.com/scaredofthesix/voice-games/issues/51) | Done | - |
| US-06 | Get immediate feedback on each attempt | Should Have | 3 | v2 | [#21](https://github.com/scaredofthesix/voice-games/issues/21) | Done | - |
| US-15 | See and hear the word's translation | Should Have | 5 | v2 | [#29](https://github.com/scaredofthesix/voice-games/issues/29) | Done | - |
| US-17 | Localized interface with a language toggle | Should Have | 5 | v2 | [#32](https://github.com/scaredofthesix/voice-games/issues/32) | Done | - |
| US-12 | Adjust difficulty level | Could Have | 3 | v2 | [#27](https://github.com/scaredofthesix/voice-games/issues/27) | Done | - |
| US-16 | Pause the game | Could Have | 2 | v2 | [#30](https://github.com/scaredofthesix/voice-games/issues/30) | Done | [Sprint 2](https://github.com/scaredofthesix/voice-games/milestone/2) |
| US-19 | Download the word list with stats as CSV | Could Have | 3 | v2 | [#52](https://github.com/scaredofthesix/voice-games/issues/52) | To Do | - |
| US-20 | Phrase-based translation game | Could Have | 13 | v3 | [#53](https://github.com/scaredofthesix/voice-games/issues/53) | To Do | - |
| US-13 | Play on any browser | Won't Have | - | - | [#28](https://github.com/scaredofthesix/voice-games/issues/28) | - | - |
| US-14 | Real-time multiplayer voice race | - | - | - | [#31](https://github.com/scaredofthesix/voice-games/issues/31) | - | - |

## Estimation summary

- **MVP v1 (Sprint 1) committed:** 26 SP (US-01 2, US-02 8, US-04 8, US-07 3, US-08 5) - delivered as release v0.1.0.
- **Delivered through v0.3.0 (MVP v2):** 66 SP - every active story except US-19 and US-20. The four extra games requested by the customer were also delivered (issue [#54](https://github.com/scaredofthesix/voice-games/issues/54), closed).
- **Remaining active backlog:** 16 SP (US-19 CSV export 3 SP, US-20 phrase game 13 SP - MVP v3 candidate).

## MVP v1 scope (Sprint 1)

Selected **only from Must Have** stories: **US-01, US-02, US-04, US-07, US-08**. US-03 (see word) and US-05 (mic permission) are realized as elements/states **within** the MVP v1 game screen and are themselves scheduled into MVP v2. Supporting MVP v1 PBIs: [#33](https://github.com/scaredofthesix/voice-games/issues/33) (remove placeholder), [#34](https://github.com/scaredofthesix/voice-games/issues/34) (bubble speed), [#35](https://github.com/scaredofthesix/voice-games/issues/35) (robust recognition). MVP version is tracked with the `mvp-v1` label and shipped as [release v0.1.0](https://github.com/scaredofthesix/voice-games/releases/tag/v0.1.0).

## Changes from the Sprint 1 customer review (2026-06-19)

- US-03 and US-05 (both Must Have, previously unlabelled) were added to **MVP v2**.
- US-11 reworded from "create/define" to **"upload"** a custom word list.
- US-09 made specific to the **English** word (for imitation); the Russian translation audio (for understanding, not imitation) stays separate as US-15.
- US-06 reworded to immediate in-game practice and confirmed **Should Have** (the aggregated parent view lives in US-10).
- New stories added: **US-18** (play with built-in words, no upload), **US-19** (CSV export, sub-story of US-10), **US-20** (phrase-based translation game, MVP v3 candidate).
- Agreed to add **four more games** for MVP v2 (idea collection tracked in [#54](https://github.com/scaredofthesix/voice-games/issues/54)).
