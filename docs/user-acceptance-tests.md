# User Acceptance Tests (Team 40)

End-user-facing acceptance test scenarios for Voice Games. These are maintained
product assets. Each has a stable ID, a goal, preconditions, steps, and an
expected result. The customer executes a subset during the recorded Sprint
Review / UAT session; execution results for the current week are recorded in the
execution history table at the bottom and summarized in the current week's report.

Environment: Google Chrome, microphone allowed, public deployment at
https://scaredofthesix.github.io/voice-games/.

---

## UAT-01 Start a game and control it by voice

- **Goal:** A child can open a game and play it using only their voice.
- **Preconditions:** App open in Chrome, microphone permission granted.
- **Steps:**
  1. On the hub, press Play on Voice Racer (or Bubble Popper).
  2. Press Start to turn on the microphone.
  3. Read aloud the English word shown on screen.
- **Expected result:** The game reacts to the correctly pronounced word
  (the car swerves or a bubble pops) and the score updates.

## UAT-02 Beat the boss in Boss Fight

- **Goal:** A child can play the new Boss Fight game end to end.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Boss Fight.
  2. Choose a word set and press Start Fight.
  3. Pronounce each shown word before its timer runs out.
- **Expected result:** Each correct word lowers the boss health bar; running out
  of time lowers the player's hearts; defeating the boss shows the win screen
  with the number of words defeated.

## UAT-03 Reach orbit in Voice Rocket Climb

- **Goal:** A child can play the new Voice Rocket Climb game (formerly Word
  Ladder) end to end.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Voice Rocket Climb.
  2. Press Start Launch.
  3. Pronounce each shown word.
- **Expected result:** Each correct word advances the rocket one step on the
  progress bar; reaching the top shows the "Orbit reached" win screen.

## UAT-04 Hear how a word should sound

- **Goal:** A child unsure of a word can hear it before saying it.
- **Preconditions:** A game is in progress.
- **Steps:**
  1. While a target word is shown, press the "Hear it" control.
- **Expected result:** The app speaks the English word aloud at a child-friendly
  pace, and the child can then try to repeat it.

## UAT-05 Play the new Sprint 3 games by voice

- **Goal:** A child can play Skate Word and Aste Word Destroyer using only
  their voice.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Skate Word, press Start, and pronounce the
     shown words.
  2. Return to the hub, press Play on Aste Word Destroyer, press Start, and
     pronounce the shown words.
- **Expected result:** In Skate Word each correct word keeps the skater moving
  and scores points; in Aste Word Destroyer each correct word destroys the
  matching asteroid before it hits the base, and the score updates.

## UAT-06 Choose a Boss Fight mode and unlock Endless

- **Goal:** A child can pick a finite Boss Fight difficulty and unlock the
  Endless mode (Sprint 2 customer request, issue #83).
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Boss Fight.
  2. On the setup screen, select a finite mode (for example 10 bosses) and
     start the fight.
  3. Defeat the run's bosses by pronouncing the target words.
- **Expected result:** The fight ends in a victory screen after the chosen
  number of bosses instead of looping forever, and completing a finite run
  unlocks the Endless mode option on the setup screen.

## UAT-07 See the child's progress

- **Goal:** A parent can see what the child has practised (US-10, issue #25).
- **Preconditions:** At least one game round was played on this device.
- **Steps:**
  1. From the hub, open the Progress view.
- **Expected result:** The view shows per-game statistics (words practised,
  high scores, sessions played) that survive a page reload, since they are
  stored on the device.

## UAT-08 Russian interface by default

- **Goal:** A Russian-speaking child sees a familiar interface immediately
  (issue #84), and the app no longer scores its own spoken hints (issue #81).
- **Preconditions:** Fresh browser profile or cleared site data.
- **Steps:**
  1. Open the public deployment.
  2. Start any game and press the "Hear it" control while the microphone is
     live.
- **Expected result:** The UI opens in Russian with a working RU/EN toggle,
  and the spoken hint does not register as the child's answer (no automatic
  score from the app's own voice).

---

## Execution history

| Date | Scenario | Executed by | Result | Notes |
|------|----------|-------------|--------|-------|
| 2026-06-27 | UAT-01 | Customer | Pass | Voice control responded in Voice Racer. Two observations logged for the next release: movement physics felt random while streaming (#85), and the speech engine can self-trigger from its own spoken hint, causing an automatic pass (#81). |
| 2026-06-27 | UAT-02 | Customer | Pass | Boss Fight played end to end (3 player hearts, boss defeated by correct words, per-word timer). Customer asked for finite difficulty modes plus an unlockable Infinite Mode instead of the endless loop (#83). |
| 2026-06-27 | UAT-03 | Customer | Pass | Voice Rocket Climb reached the win state; phrase tracking worked well with long sentences. Pacing tweak and an end-of-climb interactive event suggested for later (#86). |
| 2026-07-03 | UAT-05 | Customer | Pass | Skate Word and Aste Word Destroyer both played by voice with long phrases. Observations for the next release: skater floats above the road and lands on obstacles after jumps (#106); Aste target words should also show Russian translations (#107). |
| 2026-07-03 | UAT-06 | Customer | Pass | Finite 3-boss mode selected on the setup screen and bosses defeated with phrases and fruit words (Endless unlock shown in the demo). Observations: hit counter font too small and its meaning (total vs remaining) ambiguous; duplicated boss health bar questioned (#108). |
| 2026-07-03 | UAT-07 | Customer | Pass | Progress view showed the games played and the stats survived a page reload on the customer's device. Related demo-time bug on the team machine: one game showed 0 sessions / 0 words while the record showed 120 (#103); CSV export requested in readable columns (#104). |
| 2026-07-03 | UAT-08 | Customer | Pass | UI opened in Russian by default; pressing the Help/hear-it control while the microphone was live did not register as the customer's pronunciation (no self-scoring). Observation: rename "Help" to "EN" or a flag icon (#109). |

Results were recorded during the recorded Sprint Review / UAT sessions of
2026-06-27 and 2026-07-03 and are summarized (without private customer details)
in [`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md)
and [`reports/week5/sprint-review-summary.md`](../reports/week5/sprint-review-summary.md).
All executed scenarios passed; the observations above are tracked as
next-release backlog items and the demonstrated builds (v0.2.1, v0.3.0) are not
changed in response.
