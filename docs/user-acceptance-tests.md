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
  1. On the hub, press Play on Voice Lane Racer (or Voice Bubble Popper).
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
  1. While a target word is shown, press the "Hear it" control or the speaker icon.
- **Expected result:** The app speaks the English word aloud at a child-friendly
  pace, and the child can then try to repeat it.

## UAT-05 Play the new Sprint 3 games by voice

- **Goal:** A child can play SkateWord and AsteWord Destroyer using only
  their voice.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on SkateWord, press Start, and pronounce the
     shown words.
  2. Return to the hub, press Play on AsteWord Destroyer, press Start, and
     pronounce the shown words.
- **Expected result:** In SkateWord each correct word keeps the skater moving
  and scores points; in AsteWord Destroyer each correct word destroys the
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
  2. Start any game and press the "Hear it" control or the speaker icon while the microphone is
     live.
- **Expected result:** The UI opens in Russian with a working RU/EN toggle,
  and the spoken hint does not register as the child's answer (no automatic
  score from the app's own voice).

## UAT-09 Navigate deep water in Voice Treasure Hunter

- **Goal:** A child can play the Voice Treasure Hunter game using only their voice.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Voice Treasure Hunter.
  2. Select a word set, check the submarine preview, and press Start.
  3. Pronounce the English target words shown on screen.
- **Expected result:** Correct pronunciation steers the submarine deeper to collect treasure chests, and the money counter increases.

## UAT-10 Fly through the clouds in Sentence Bird

- **Goal:** A child can play the Sentence Bird game, pronouncing full phrases, and experience game over when lives are lost.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Sentence Bird.
  2. Select a phrase set and press Start.
  3. Speak before pressing any microphone control.
  4. Press the on-screen **Click & say / Нажми и скажи** button or Space and verify that the
     microphone indicator becomes active, then pronounce the shown phrase correctly.
  5. Let a phrase time out to lose a heart.
- **Expected result:** Speech outside the push-to-talk window is ignored. The visible mic
  control opens a short listening window, correct pronunciation guides the bird through a
  gate, and losing all hearts triggers the Game Over screen.

## UAT-11 Practice pronunciation memory in Echo Microphone

- **Goal:** A child can practice pronunciation by hearing a word sequence and repeating it back.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Echo Microphone.
  2. Select a word set, or add a custom word, and press Start.
  3. Listen to the spoken chain and confirm that the microphone is paused during playback.
  4. When **Speak now** appears, confirm that unanswered word cards are hidden and repeat the
     chain from memory.
  5. Give one non-matching answer, then repeat correctly while the retry message is visible.
- **Expected result:** Recognition starts only after playback, a correct chain grows into a
  longer one, and the run can continue until the player loses all hearts. A first non-match
  keeps listening for a clear retry instead of immediately removing a heart. If the retry
  expires, the same chain is read again before the next attempt. Unanswered text is not left
  visible during the memory phase.

## UAT-12 Explore the endless Voice Maze Quest

- **Goal:** A child can read the map, choose routes by voice, clear a maze floor, and continue
  into a new floor without a team explanation.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. From the hub, press Play on Voice Maze Quest.
  2. Select a theme, difficulty, and word set, inspect the maze preview, and press Start.
  3. Compare the adjacent door cards with the visible map and pronounce the word on the route
     you want to take.
  4. Find the red hazard cell and choose an alternate route around it.
  5. Reach the portal before collecting everything and verify that the locked-exit alert
     reports how many crystals are still missing.
  6. Take branches to collect every crystal, then return to the portal.
  7. Intentionally say a different word once and remain silent once.
  8. On the floor-clear screen, continue into the next generated maze, then finish the
     expedition from a later floor.
- **Expected result:** Speaking one visible door word moves the wizard through that route and
  updates the map, visited rooms, score, and collected items. Route words remain readable on
  the map. The hazard route has no spoken entrance and the rest of the maze remains
  solvable. No unrelated gift or bonus-chest items appear. The large portal stays locked until all crystals are collected and shows the missing
  count when reached early. Incorrect or silent input gives clear retry feedback without a
  failure sound or unexplained penalty. Clearing a floor offers another generated floor, so
  the run is not limited to six doors, while Finish opens the standard result screen with
  aggregate and per-word pronunciation statistics. No spell recipe, cursed rune, or outdated
  instruction is shown.

## UAT-13 Reinforce learning with Adaptive Word Selection

- **Goal:** A child who struggles with specific words receives more practice on them.
- **Preconditions:** App open in Chrome, microphone allowed.
- **Steps:**
  1. Start any game.
  2. Intentionally mispronounce or remain silent on one specific word once.
  3. Record the next three eligible target words.
- **Expected result:** The failed word returns within the next one to three eligible prompts.
  It does not repeat forever, every word remains reachable, and a correct answer reduces the
  extra priority gradually. The behavior is deterministic in the automated scheduler test.

## UAT-14 Unified Hub Navigation

- **Goal:** A child can return to the learning hub from any game using the unified navigation button.
- **Preconditions:** A game session is started.
- **Steps:**
  1. Open Voice Lane Racer, start the game, and locate the Back to Hub button. Press it.
  2. Open SkateWord, start the game, locate the Back to Hub button. Press it.
- **Expected result:** Both games immediately return the player to the hub using the same unified button appearance.

## UAT-15 Paste custom words and phrases in bulk

- **Goal:** A parent can paste several English words or phrases with Unicode translations
  without multi-word phrases being split into separate vocabulary items.
- **Preconditions:** App open on any game setup screen.
- **Steps:**
  1. Expand **Add my own words** and open the bulk-paste field.
  2. Paste `Nice to meet you   Приятно познакомиться` with only three ordinary spaces
     between the English phrase and translation, then try to add it.
  3. Replace that separator with four ordinary spaces.
  4. On a second line, paste `Good morning`, a Tab character, and `Доброе утро`, then add
     both rows.
  5. Select **My words** and inspect the saved vocabulary.
- **Expected result:** The three-space version is not silently split or saved as two
  columns. Both the four-space row and the tab-separated row are accepted together.
  *Nice to meet you* and *Good morning* each remain one English phrase, and both Russian
  translations are preserved exactly.

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
| 2026-07-11 | UAT-09 | Customer | Pass | Voice Treasure Hunter: correct pronunciation increased the money counter as expected. |
| 2026-07-11 | UAT-10 | Customer | Issues found | Sentence Bird: text/background contrast bug; continuous listening scored unrelated speech as an incorrect attempt; game-over flow did not match the customer's expectation (#140). |
| 2026-07-11 | UAT-11 | Customer | Pass, with one issue | Echo Microphone: the target phrase was visible on screen, undermining the memory mechanic; Short Phrases produced 3 cards for 1 phrase (#141). |
| 2026-07-11 | UAT-12 | Customer | Issues found | Magic Wizard: spell-cast hitbox problems observed; customer flagged mechanic overlap with Voice Treasure Hunter (#142). |
| 2026-07-11 | UAT-13 | Customer | Inconclusive | Could not confirm live whether adaptive word selection re-weights within the current round rather than only between rounds; team acknowledged the behavior was unverified (#143). |
| 2026-07-11 | UAT-14 | Customer | Pass | Both tested games returned to the hub via the same button; audio from the previous game was still audible after switching games (#145). |

### Final-review disposition

The final customer review accepted Sentence Bird (UAT-10), accepted Echo Microphone with a
minor stability limitation (UAT-11), rejected the old Magic Wizard mechanic and made UAT-12
obsolete, required a one-failure adaptive-selection retest for UAT-13, and kept UAT-14 open
only for the visual comparison of the first-generation games. The scenarios above now
describe the replacement behavior. Automated tests cover the new Voice Maze Quest path,
tab-or-four-space vocabulary paste, preservation of multi-word phrases, deterministic
reinforcement queue, and Echo memory/TTS phase separation. Customer execution of the
revised UAT-12, UAT-13, and new UAT-15 is still required; this repository does not claim
those customer retests have happened.

Results were recorded during the recorded Sprint Review / UAT sessions of
2026-06-27, 2026-07-03, and 2026-07-11, and are summarized (without private customer
details) in
[`reports/week4/customer-review-summary.md`](https://github.com/scaredofthesix/voice-games/blob/main/reports/week4/customer-review-summary.md),
[`reports/week5/sprint-review-summary.md`](https://github.com/scaredofthesix/voice-games/blob/main/reports/week5/sprint-review-summary.md), and
[`reports/week6/sprint-review-summary.md`](https://github.com/scaredofthesix/voice-games/blob/main/reports/week6/sprint-review-summary.md). All
scenarios executed on 2026-06-27 and 2026-07-03 passed and did not change the demonstrated
builds (v0.2.1, v0.3.0). The 2026-07-11 session found real issues in three of the four new
games and an unverified adaptive-selection behavior; these are tracked as Sprint 5 issues
(#140-#143, #145) rather than changing the already-tagged `v0.4.0` release.
