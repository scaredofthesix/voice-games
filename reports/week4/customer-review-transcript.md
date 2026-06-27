# Customer Review / UAT Transcript - Week 4 (Team 40)

Sanitized English transcript of the Sprint 2 customer review and user acceptance
test session. The customer granted recording and transcript permission for the
coursework at the start of the meeting, so this file is published in the public
repository. The external customer is referred to by role only.

**Format requirement (do not drop this):** every spoken line is on its own line
and begins with its own `[mm:ss]` timestamp (relative to the start of the
recording), then the speaker, then the text. Team speakers are shown as
`Role (Name)`; the external customer is shown by role only. Unclear audio is
marked `[inaudible]` and removed private or confidential content is `[redacted]`.

- Date: 2026-06-27.
- Session length: 35 minutes of recording (Sprint Review, a short recess, then
  the user acceptance testing).
- Participants: Product Owner (Marat), Scrum Master (Maxim), and the Customer.
  The system text-to-speech voice is shown as "System voice".
- Recording permission: granted.
- Transcript publication permission: granted (for coursework and transcript).

---

## Part 1 - Sprint Review and increment demo

[00:00] Product Owner (Marat): Today we want to demonstrate the new sprint increment, have you complete three short tasks, and collect your feedback. May we record this session for our coursework and transcript?
[00:18] Customer: Yes, you can record it.
[00:23] Product Owner (Marat): Thank you. The main goal of this sprint focused on quality and reliability rather than expanding features. We integrated the two requested games, built automated tests, completed quality checks, and deployed a CI pipeline to secure all future feature changes.
[00:48] Customer: Great.
[00:53] Product Owner (Marat): I will start by showing some current updates directly from our GitHub repository.
[01:08] Customer: I can see your screen now.
[01:15] Product Owner (Marat): Regarding Milestone 2, all associated tasks are fully completed. This includes Pause the game (worth 3 story points), Boss Fight, and Rocket Climb. In total, this sprint delivered 29 story points. Our main objective was strengthening product quality via automated quality gates, covering test requirements, test coverage, CI, and accessibility checks.
[02:13] Customer: Splendid. I see you also added per-game visual theme pickers.
[02:21] Scrum Master (Maxim): To clarify, we have two versions in this assignment: 0.2.0 and 0.2.1. Version 0.2.1 was deployed to immediately rectify a few issues discovered in 0.2.0, and that is what we are demonstrating today.
[02:53] Customer: Understood. So version 0.2.1 is the active live build.
[03:05] Product Owner (Marat): Yes. Now we will proceed to the main interface demo.
[03:33] Scrum Master (Maxim): The application now fully supports two languages (English and Russian) across the interface. We also implemented the requested visual theme switcher in the menu, allowing users to preview how the theme changes before a game session begins.
[03:58] Customer: Looks excellent.
[04:03] Scrum Master (Maxim): We populated the database with sets of short and long phrases. Let's look at the new Boss Fight game. Once a theme is selected, the target phrase appears on the screen. We also added audio support so you can hear the model pronunciation in English or Russian.
[04:48] Customer: Do the monsters attack back if the child fails to pronounce anything within the time limit?
[04:55] Scrum Master (Maxim): Yes, the player has 3 health points total, and the boss has 8 health points, requiring 8 correct words to defeat. We also included a working Pause feature across all games.
[05:13] Scrum Master (Maxim): Our second new game is Voice Rocket Climb, which features three different planet levels: Earth, Mars, and an advanced planet. The rocket ascends higher into deep space with each successfully pronounced word.
[05:43] Customer: Does the rocket gameplay loop stop at a specific point?
[05:48] Scrum Master (Maxim): Yes, the round concludes successfully after completing a sequence of 10 target words.
[06:38] Customer: It looks great. Perhaps adding an interactive event, like meeting an alien at the end of the space climb, could make it even more engaging for children.
[07:08] Scrum Master (Maxim): That is an excellent suggestion for future polish. That concludes the primary summary of what we have developed.
[07:18] Customer: Do you have plans to implement additional game modes or new games next week?
[07:25] Product Owner (Marat): Yes, our current velocity allows us to deliver two games per week, meaning every team member handles two games total. Svyatoslav, Aleksandr, and Mikhail will complete their respective builds so you can test them regularly.
[07:48] Customer: Sounds like a solid plan. I look forward to reviewing the upcoming builds.
[08:08] Product Owner (Marat): Apologies for the tight meeting coordination; we experienced a few unexpected updates regarding our coursework assignment schedule, forcing us to move this session up. Moving forward, we plan to conduct regular review meetings every Friday.
[08:33] Customer: That schedule works perfectly for me. Thank you for the presentation.

[recess of about 9 minutes before the user acceptance testing]

## Part 2 - User Acceptance Testing (customer-executed)

[17:30] Customer: I am ready to begin the User Acceptance Testing (UAT). I will access the live build via Chrome. Should I share my screen?
[17:39] Product Owner (Marat): Yes, please. We sent the testing link to the chat. It is enough to test three of the primary story scenarios.
[20:29] Customer: The site loaded in English by default. For our target audience, it might be more practical to have Russian active by default on launch. Let's start the Voice Race scenario.
[20:41] Customer: The movement physics feel a bit random when streaming, but the voice control responds. What happens if I mumble or mispronounce a word?
[21:49] System voice: Lion.
[21:53] Customer: Panda.
[21:57] System voice: Lion.
[22:01] Customer: Interesting. It seems the speech engine occasionally triggers an automatic pass when the game itself speaks. Let's move to the Boss Fight end-to-end test.
[23:29] Scrum Master (Maxim): We deliberately lowered the voice matching tolerance threshold in this MVP build to ensure mumbled speech from younger children would still be accepted. However, this caused an unintended audio loop bug where the microphone captures the device's own speakers playing the system voice. I will restore a stricter validation model so only clearly pronounced words trigger a success state.
[23:59] Customer: The underlying issue is that when the game pronounces a hint, the microphone captures that audio output and flags it as a user attempt. Disabling the automatic text-to-speech engine entirely during gameplay or recommending headphones might mitigate this loop.
[24:39] Product Owner (Marat): We will ensure all four games are brought up to a unified standard. We can implement a mechanical fix to ensure the application does not trigger falsely from its own audio outputs.
[25:04] Customer: Programmatically muting or blocking microphone inputs while the system text-to-speech voice is actively speaking would resolve the loop cleanly.
[25:34] Scrum Master (Maxim): Alternatively, we can remove the automated spoken hint at the start of the round so it doesn't trigger an immediate false positive.
[25:54] Product Owner (Marat): Right now, the high sensitivity is directly tied to the lowered matching criteria we introduced after version 0.1.0. We will calibrate the algorithm to establish a better operational balance.
[26:39] Customer: This will require some structured code isolation. I recommend moving the core voice processing logic into a shared module reused by all games to ensure uniform accuracy.
[27:29] Customer: Testing the phrase tracking now. How many total bosses are included in the loop?
[28:29] Scrum Master (Maxim): There are 15 bosses in total, arranged in an infinite loop.
[28:45] Customer: An infinite loop can become exhausting for young learners. It might be better to structure the game around a shorter, finite session - for instance, defeating three bosses to win a round.
[29:11] Product Owner (Marat): We can implement a dual layout containing both a Finite Mode (broken down into distinct difficulty stages of 10, 20, or 30 words) and an unlockable Infinite Mode for advanced practice.
[31:14] System voice: An apple a day keeps the doctor...
[31:21] Customer: The speech tracking functions well with long sentences, though pacing can be adjusted. Implementing the step-by-step difficulty layers (10, 20, 30 words) will make this excellent. Please document these game design choices.
[32:49] Product Owner (Marat): We will finalize these modifications. That covers all current user stories ready for verification.
[33:07] Customer: Perfect. We will stick to the plan of delivering two games per week. I'll see you at our next review session on Friday. Thank you for the productive session.
[34:50] Scrum Master (Maxim): Thank you. Goodbye.

---

## Outcome and follow-up

The customer accepted the Sprint 2 increment and executed three UAT scenarios
(Voice Racer, Boss Fight, Voice Rocket Climb) live in Chrome. The increment
demonstrated is the current live build, v0.2.1, which is **not** changed in
response to this session. Every feedback item below is recorded as a backlog
item for the next release.

Resulting backlog items (next release, after v0.2.1):

- Self-trigger audio-loop false positive - [#81](https://github.com/scaredofthesix/voice-games/issues/81).
- Shared voice-processing module reused by all games - [#82](https://github.com/scaredofthesix/voice-games/issues/82).
- Boss Fight finite difficulty modes (10 / 20 / 30 words) plus unlockable Infinite Mode - [#83](https://github.com/scaredofthesix/voice-games/issues/83).
- Russian as the default interface language on launch - [#84](https://github.com/scaredofthesix/voice-games/issues/84).
- Voice Racer movement physics under streaming - [#85](https://github.com/scaredofthesix/voice-games/issues/85).
- End-of-climb interactive event in Voice Rocket Climb - [#86](https://github.com/scaredofthesix/voice-games/issues/86).

The executed UAT outcomes are recorded in
[`docs/user-acceptance-tests.md`](../../docs/user-acceptance-tests.md) and
summarized in [`customer-review-summary.md`](./customer-review-summary.md).
