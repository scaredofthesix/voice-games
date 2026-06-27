# User Acceptance Tests (Team 40)

End-user-facing acceptance test scenarios for Voice Games. These are maintained
product assets. Each has a stable ID, a goal, preconditions, steps, and an
expected result. The customer executes a subset during the recorded Sprint
Review / UAT session; execution results for the current week are recorded in the
execution history table at the bottom and summarized in the Week 4 report.

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

---

## Execution history

| Date | Scenario | Executed by | Result | Notes |
|------|----------|-------------|--------|-------|
| 2026-06-27 | UAT-01 | Customer | Pass | Voice control responded in Voice Racer. Two observations logged for the next release: movement physics felt random while streaming (#85), and the speech engine can self-trigger from its own spoken hint, causing an automatic pass (#81). |
| 2026-06-27 | UAT-02 | Customer | Pass | Boss Fight played end to end (3 player hearts, boss defeated by correct words, per-word timer). Customer asked for finite difficulty modes plus an unlockable Infinite Mode instead of the endless loop (#83). |
| 2026-06-27 | UAT-03 | Customer | Pass | Voice Rocket Climb reached the win state; phrase tracking worked well with long sentences. Pacing tweak and an end-of-climb interactive event suggested for later (#86). |

Results were recorded during the recorded Sprint Review / UAT session of
2026-06-27 and are summarized (without private customer details) in
[`reports/week4/customer-review-summary.md`](../reports/week4/customer-review-summary.md).
All three scenarios passed; the observations above are tracked as next-release
backlog items and the demonstrated build (v0.2.1) is not changed in response.
