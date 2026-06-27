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
| _TODO (Sprint Review / UAT session date)_ | UAT-01 | Customer | _TODO pass/fail_ | _TODO_ |
| _TODO_ | UAT-02 | Customer | _TODO_ | _TODO_ |
| _TODO_ | UAT-03 | Customer | _TODO_ | _TODO_ |

Record the customer-executed results here after the recorded session, and
summarize them (without private customer details) in
`reports/week4/README.md`.
