# Sprint 5 Review transcript, Parts 1 and 2 (Week 7)

Sanitized English transcript of the Week 7 Sprint 5 review / customer-trial session.
Grammar and phrasing were cleaned while preserving the decisions, uncertainty, and
conversational tone. `TEAM` combines the presenting team members; `CUSTOMER` is the product
stakeholder who tested the build and gave feedback; `GAME DEMO` marks text-to-speech or
repeated in-game test phrases, not interview participants. No names, credentials, or private
access details appear here; those are kept in the Week 7 Moodle PDF per the assignment's
public/private evidence split.

> Publication permission for both sanitized sessions was confirmed after the initial Week 7
> report was prepared. One session was not enough to identify, implement, and verify all
> remaining changes. Part 1 records the 2026-07-16 Sprint Review and trial. Part 2 records the
> separate 2026-07-17 final-candidate review after the team replaced Magic Wizard, completed
> the follow-up work, and prepared the remaining UAT retests.

---

# Part 1 - Sprint Review and customer trial, 2026-07-16

## Sentence Bird, Echo Microphone and Magic Wizard demo

**[00:00:00] TEAM:** We have published the cleaned interview transcript in the repository. This is our Sprint 5 milestone review. Most of the work is complete, but we still have three open questions. We plan to fix them today or tomorrow because we need to release MVP v3 and make several final changes to the games.

**[00:00:46] TEAM:** First, we reworked the mechanic in Sentence Bird. The player now presses Space to pronounce a word. For example: "cherry".

**[00:01:00] CUSTOMER:** I cannot see your screen. Are you showing the game?

**[00:01:17] TEAM:** Can you see it now? Okay. The current word is "peach".

**[00:01:34] CUSTOMER:** Did you press Space?

**[00:01:38] TEAM:** Yes. I need to press Space before speaking. The game cycles through words such as "squirrel", "zebra" and "elephant". If I do not press Space, the game does not listen. When the time runs out, the player loses three hearts. The result screen then shows the record and points.

**[00:02:26] TEAM:** Next is Echo Microphone. We changed it into a memory game. We removed the visible word card when the game asks the player to repeat a word, so the player has to remember what was spoken.

**[00:03:05] GAME DEMO:** The team repeatedly tests the word "orange".

**[00:03:13] TEAM:** Something is wrong with my microphone. Let me try another microphone.

**[00:04:11] GAME DEMO:** The team tests several words and phrases, including "ice", "I don't know", "What is your name?", "Have a nice day" and "Nice to meet you".

**[00:05:27] TEAM:** I found the problem. My system microphone level was too low, so I increased it. Next, I will show the full changes to Magic Wizard.

**[00:06:01] TEAM:** This is a new version of the game. In the previous interview, you asked us to make it different. The player chooses a spell, for example Ice, and then pronounces the sequence of rune words required to cast it.

**[00:06:27] TEAM:** There is also a cursed rune. The child should avoid pronouncing that shape or word. If the child pronounces the cursed rune, the player loses one shield. The rune vocabulary includes shapes such as box, ring, triangle, cylinder and tube.

**[00:07:09] GAME DEMO:** The game presents a sequence of rune words such as cylinder, circle, crescent, square, cube, lion and pyramid, and then the round ends.

**[00:07:35] TEAM:** Each spell has four levels. The player can choose Fire, Ice or Storm.

**[00:07:49] CUSTOMER:** I do not fully understand the idea. Is the player trying to increase the spell's power?

**[00:07:58] TEAM:** Not exactly. The player pronounces the recipe for a magic spell.

**[00:08:07] CUSTOMER:** Okay.

**[00:08:10] TEAM:** There is a spell book.

**[00:08:13] CUSTOMER:** What about the cursed rune? I do not see it on any card. Why would a child pronounce it?

**[00:08:37] TEAM:** This was the last game we implemented, and we had very little time. It was difficult to add a complete mechanic. Could you suggest a simple way to improve it?

**[00:09:07] CUSTOMER:** You could make it a simple puzzle game. I do not think you currently have a puzzle.

**[00:09:15] TEAM:** What kind of puzzle do you mean?

**[00:09:18] CUSTOMER:** For example, moving boxes around a map to unblock a path, or another very simple puzzle.

**[00:09:32] CUSTOMER:** A labyrinth could also work.

**[00:09:40] TEAM:** Would the child pronounce words to move parts of the picture left or right?

**[00:09:48] CUSTOMER:** Possibly, but pronunciation can be less frequent. For example, in a labyrinth the player could pronounce a word at specific points to open a door.

**[00:10:01] TEAM:** Understood. We will replace or substantially change this game. We simply did not have enough time to improve it before this review.

**[00:10:12] CUSTOMER:** Nothing too fancy is required.

**[00:10:15] TEAM:** When the new game is ready, we can send you the product link and you can confirm whether the game passes.

**[00:10:29] CUSTOMER:** The other games look good to me. I consider them approved.

## Previous feedback, adaptive words and custom vocabulary

**[00:10:40] CUSTOMER:** Did you fix the microphone interaction itself? I think you fixed Echo Microphone's mechanic, but not the general microphone interaction. Is that correct?

**[00:11:04] TEAM:** We changed how pronunciation is accepted in Sentence Bird. The player now has to press a button before speaking. That prevents the issue we saw after the previous round.

**[00:11:26] CUSTOMER:** You mean Sentence Bird?

**[00:11:29] TEAM:** Yes. In Echo Microphone, we removed the written word that used to appear below the screen. Showing the word broke the memory mechanic, so we removed it.

**[00:11:55] CUSTOMER:** Please remind me of the other comments from the previous review. I think you had a script.

**[00:12:07] TEAM:** Previously, adaptive word selection did not work well across the games. We improved it. If a player misses a word several times and continues playing, the difficult word should return sooner.

**[00:12:23] CUSTOMER:** Right. The difficult word should return sooner so the player can learn it faster.

**[00:12:28] TEAM:** We also added CSV import to the custom-word feature. A parent can prepare a file in Excel with the English word in the first column and the translation in the second column.

**[00:13:10] TEAM:** I will demonstrate it now.

**[00:13:25] TEAM:** This Excel file has the English word in the first column and the translation in the second. The game imported 16 words.

**[00:14:01] TEAM:** Something went wrong during this demonstration. I do not know why.

**[00:14:07] CUSTOMER:** How will these entries appear in the game? Will the game show icons, or will it show the Russian text?

**[00:15:16] TEAM:** I am not sure. It worked correctly yesterday. Let me try another example.

**[00:15:32] CUSTOMER:** This may be an encoding problem.

**[00:15:39] TEAM:** We found an issue and will fix it before the final day. We will send you a link so you can verify the fix.

**[00:15:54] TEAM:** Next, we will demonstrate adaptive word selection with a small set of words: "hello", "good" and "nice".

**[00:16:24] GAME DEMO:** The game cycles through "hello", "good" and "nice". The team intentionally skips or mishandles one of the words to see whether it returns more often.

**[00:16:54] TEAM:** It is difficult to tell which word is actually being prioritized. We need a clearer demonstration.

**[00:18:13] CUSTOMER:** In this example, you pronounced "hello" and "good", so "nice" should have appeared more often.

**[00:18:37] TEAM:** I can show CSV import on my laptop. It works here, although it did not work on the other laptop. The file contains an English word in the first column and a translation in the second.

**[00:19:51] CUSTOMER:** The feature appears to work here, but if CSV import is fragile, it may be better to remove it and keep only the paste-text feature.

**[00:20:15] TEAM:** I agree. It does not work consistently on every laptop or with every file, and it may be difficult for children and parents. We should remove CSV import.

**[00:20:47] CUSTOMER:** Let us test copying and pasting directly from Excel. Clear the current list, copy the rows from Excel and paste them into the product.

**[00:21:17] TEAM:** The current format may be wrong, but let us try.

**[00:21:28] CUSTOMER:** Try one word first. That works.

**[00:21:41] TEAM:** Now let us try several words.

**[00:21:59] TEAM:** Several words work as well.

**[00:22:02] TEAM:** The pronunciation also works correctly with this format.

**[00:22:09] CUSTOMER:** Open a text editor such as VS Code and check which separator Excel places between the two columns when you copy them. It may be a tab rather than a normal space.

**[00:22:24] TEAM:** I initially thought it was a space. I will open VS Code.

**[00:22:29] CUSTOMER:** The editor should make tabs visible when you paste the text.

**[00:22:51] TEAM:** It looks like several spaces.

**[00:22:55] CUSTOMER:** If the editor shows a long arrow or another special marker, it is a tab.

**[00:23:17] CUSTOMER:** Please verify the exact separator later. If the parser does not support it, add this separator. Typing entries manually is inconvenient, but pasting from Excel is easy.

**[00:23:41] TEAM:** If the separator were an ordinary space, phrases containing spaces would be difficult to import correctly.

**[00:23:54] CUSTOMER:** Exactly. Please also try LibreOffice.

**[00:24:27] TEAM:** The separator looks like a long space.

**[00:24:31] CUSTOMER:** Then it is a tab.

**[00:24:35] TEAM:** Yes, you are right. It is a tab.

**[00:24:47] TEAM:** A tab is convenient.

**[00:24:48] CUSTOMER:** Yes. Because a tab is different from a normal space, the parser can preserve phrases that contain spaces.

**[00:24:59] CUSTOMER:** Add tab as a supported separator. Then the paste flow should work.

## UAT 10 to UAT 14

**[00:25:23] TEAM:** Would you like to run the UATs? We have five tests today.

**[00:25:33] CUSTOMER:** Yes. Send me the link.

**[00:26:50] TEAM:** The tests are UAT 10 through UAT 14.

**[00:26:54] CUSTOMER:** UAT 10 is Sentence Bird: fly through the clouds while pronouncing phrases. Let us wait for it to load.

**[00:27:13] TEAM:** Some of these tests were also used in the previous interview, but they did not pass then, so we would like you to run them again.

**[00:27:46] TEAM:** The current GitHub Pages deployment may require a VPN to play the games.

**[00:27:54] CUSTOMER:** My VPN is not working, so I will pause the recording while I set up another one.

**[00:30:14] CUSTOMER:** Sentence Bird has loaded. The instructions explain that missing a phrase costs a heart. I will start with short phrases.

**[00:30:37] GAME DEMO:** The customer tests phrases such as "Thank you very much", "What's your name?", "See you later", "You're welcome" and "Nice to meet you".

**[00:31:48] CUSTOMER:** This is pretty good. I consider UAT 10 a pass.

**[00:31:48] CUSTOMER:** Next is Echo Microphone: listen to a word sequence, remember it and repeat it back.

**[00:32:16] CUSTOMER:** The instructions say to select a word set, press Start, listen to the spoken words and repeat them. The microphone is active.

**[00:32:40] GAME DEMO:** The customer tests sequences containing phrases such as "I don't know", "Thank you very much", "How are you?" and "You're welcome".

**[00:33:20] CUSTOMER:** The game gave me another chance to repeat the phrase and displayed feedback.

**[00:33:49] CUSTOMER:** Then it incorrectly decided that my pronunciation was wrong and failed the attempt.

**[00:34:02] CUSTOMER:** I wondered whether there should be a button to activate the next round. However, let us keep the current flow for now. Just remember that some games need a clear trigger for microphone activation.

**[00:34:56] GAME DEMO:** The customer repeats another sequence and continues testing the timing and recognition.

**[00:35:31] CUSTOMER:** This is basically a pass. It is not ideal, but it is acceptable.

**[00:36:04] CUSTOMER:** UAT 12 is Magic Wizard: the child should build and cast spells.

**[00:36:11] TEAM:** Please skip this test because we are replacing the game with a different one.

**[00:36:17] CUSTOMER:** Understood. The current UAT instructions will become outdated once the game is replaced.

**[00:36:44] CUSTOMER:** Next is adaptive word selection. The test says to start a new game and intentionally mispronounce or remain silent on one word several times.

**[00:37:05] CUSTOMER:** I will use Echo Microphone because it keeps track of the words I pronounced.

**[00:37:18] GAME DEMO:** The customer repeatedly tests "How are you?" and other phrases while intentionally failing part of the sequence.

**[00:37:53] CUSTOMER:** I could not complete the full sequence, but the next round started with "How are you?", which may indicate that the adaptive selection reacted.

**[00:38:27] TEAM:** The adaptive system still needs improvement. Each game only has three hearts, so waiting for more than two failed recognitions is too slow. A word should become more frequent after one failed pronunciation.

**[00:39:05] TEAM:** We will improve this and send you a link for another test.

## Navigation, UI and localization

**[00:39:27] CUSTOMER:** Unified Hub Navigation has already been tested. It works and passes.

**[00:39:43] CUSTOMER:** The Hub button is present everywhere, which is good. However, Voice Line Racer has a small UI mismatch. In the newer games, the information card and Hub button follow one layout, but in Voice Line Racer the Hub button is in a different place.

**[00:40:44] CUSTOMER:** The first-generation games have a different interface from the later games. It would be better to make the older games visually consistent with the newer ones.

**[00:40:58] TEAM:** Yes, this mainly affects the first two games. They were created before we had a shared reference.

**[00:41:03] TEAM:** We will fix them.

**[00:41:09] CUSTOMER:** I also had a previous comment about localization in previews. The preview is now localized, and I can see the translated interface rather than unwanted English labels.

**[00:42:08] CUSTOMER:** I no longer see English interface phrases in the preview. This is good.

## README, documentation and deployment

**[00:42:15] TEAM:** We also updated repository documents, including a new README, as requested in the previous review.

**[00:42:29] CUSTOMER:** The README is much better. It immediately explains that the product is for ages 6 to 10, that the child speaks to play, and that there is no login, installation or account. It links directly to the product, recommends Google Chrome, explains microphone permission and includes a VPN note. It also lists all ten games and explains how to start one.

**[00:43:00] CUSTOMER:** The "How to Play" section currently describes four general steps: set up the game, choose the word set and difficulty, press Start, play with your voice, add your own words and track progress.

**[00:43:41] CUSTOMER:** Why is "Add your own words" presented so late in the flow?

**[00:43:56] TEAM:** We placed it later because a child can first try the default word sets and only add new words after trying them.

**[00:44:15] CUSTOMER:** That is reasonable, but adding custom words could be the second step. Some users may want to start with their own vocabulary immediately. The short path to playing with default words is useful, but the README should also show the custom-word path clearly.

**[00:44:43] CUSTOMER:** The progress step also needs more detail. Is the progress screen shown after a game ends, or is it the overall progress page?

**[00:45:13] TEAM:** It is the overall progress page.

**[00:45:14] CUSTOMER:** Then mention exactly where it is located. It is in the top-right corner of the Hub. The current instructions skip the step of returning to the Hub.

**[00:45:52] TEAM:** We can make this a five-step flow: game results first, then overall progress across all ten games.

**[00:46:03] CUSTOMER:** Yes. Alternatively, write the exact navigation: click the Hub button, return to the Hub, click Progress and review the overall progress. It should be a step-by-step instruction.

**[00:46:38] CUSTOMER:** The README now contains descriptions and screenshots for all ten games, which is good. Can I open a game directly from its screenshot?

**[00:46:46] TEAM:** No. The screenshots are currently illustrative only.

**[00:46:49] CUSTOMER:** It would be useful to link each screenshot to the corresponding game, but do not spend time on it if the release is tight.

**[00:47:30] CUSTOMER:** Treat direct game links as a could-have feature. The important part is that the README now includes the screenshots for every game, as discussed previously.

**[00:48:18] CUSTOMER:** The customer handover documentation is present. Has it been updated since the last review?

**[00:48:40] TEAM:** Yes. It was updated recently to include the new features.

**[00:49:02] CUSTOMER:** Do the relative links work correctly on the hosted documentation site?

**[00:49:22] CUSTOMER:** You use index.md for the hosted documentation site, correct?

**[00:49:31] TEAM:** Yes.

**[00:49:32] CUSTOMER:** And docs/admin.md is only for internal navigation inside the repository, not for the hosted documentation site?

**[00:49:48] TEAM:** Yes.

**[00:49:50] CUSTOMER:** Good. Then the relative links should work in their intended context. The roadmap and sprint backlog structure is also present.

**[00:50:22] CUSTOMER:** Some sprint backlog links are missing. That matters more for the course assignments than for the product handover, but they should still be completed.

**[00:50:56] CUSTOMER:** The developer documentation mentions TypeScript 7.0.2.

**[00:51:06] TEAM:** We had difficulty ensuring that every developer used the same TypeScript version.

**[00:51:59] CUSTOMER:** The repository currently appears to use TypeScript 5.8.3. Pin that version in package.json and the lockfile. Then npm or pnpm will install the same version for every developer. The documentation must show the same version.

**[00:52:36] CUSTOMER:** The setup and deployment section correctly says that no API key is required, the game runs fully client-side, microphone access is local, Node.js is needed, and the project uses continuous integration and public deployment.

**[00:53:04] CUSTOMER:** However, the GitHub Pages instructions are unclear. Are they instructions for manual local deployment, or is deployment automated in CI?

**[00:53:26] TEAM:** The current instructions describe local deployment.

**[00:53:29] CUSTOMER:** Did you add deployment to CI?

**[00:53:41] TEAM:** I do not think so.

**[00:53:56] CUSTOMER:** Then the documentation is useful, but the statement about automatic deployment may be inaccurate. Publishing the documentation from a docs directory can also be automated, although links may need adjustment.

**[00:54:33] CUSTOMER:** The README says every push or merge to main is deployed automatically. Is that actually happening?

**[00:54:52] TEAM:** No. At the moment, we manually redeploy after merging to main.

**[00:55:04] CUSTOMER:** Then the README is not up to date. Either change the wording to manual deployment or implement automatic deployment in CI. Automatic deployment should be easy to add.

**[00:56:13] TEAM:** We will implement automatic deployment.

**[00:56:16] CUSTOMER:** The CONTRIBUTING document, setup guide, Definition of Done, conventions, guidance and license are structured as requested. I like the README structure. Reorder the gameplay steps and add a screenshot that shows how to navigate to Progress.

**[00:56:44] CUSTOMER:** You could also add more microphone guidance, but the current startup instruction may already be sufficient. This is not a major blocker.

**[00:57:16] CUSTOMER:** Overall, the README and documentation are good.

## Final review arrangement

**[00:57:32] TEAM:** After we make the final changes, should we send you the link and a written list of changes, or should we arrange another short review session for MVP v3?

**[00:58:23] CUSTOMER:** I am happy to have another short session. Then I can review the final version and test the changes directly.

**[00:58:42] TEAM:** We will contact you and arrange a short call to review MVP v3, which will be our final product version.

**[00:59:03] CUSTOMER:** Great. I will be available and will write in the chat.

**[00:59:15] TEAM:** Thank you for your patience with the missing items.

**[00:59:28] CUSTOMER:** No problem. This is a normal working process. Thank you for implementing all the games. It is great to see the team's creativity in the product.

**[00:59:44] TEAM:** Thank you very much. Goodbye.

---

# Part 2 - Final-candidate review and UAT retests, 2026-07-17

This follow-up session was held after the team implemented the changes discovered in Part 1.
The transcript keeps the product decisions, feedback, and test outcomes while removing
personal names, private communication channels, and internal access details.

## Voice Maze Quest demonstration

**[00:00:00] TEAM:** This is the final MVP3 review. We implemented the changes discussed in the previous session. I will demonstrate what changed. Can you see my screen?

**CUSTOMER:** Yes.

**TEAM:** Magic Wizard has been replaced with Voice Maze Quest. It is a new game.

**[00:00:32] TEAM:** The new game is a labyrinth with three themes and three randomly generated maze sizes: 5x5, 7x7, and 9x9.

**[00:01:04] TEAM:** The player pronounces words to move step by step toward the exit and must collect all the crystals. The red hazard is a hole that the child must avoid.

**[00:01:37] GAME DEMO:** The team tests route words including "pentagon", "cylinder", "star", "circle", "cross", "rectangle", "diamond", "point", "ring", "comb", "hexagon", and "corner".

**[00:02:10] TEAM:** After collecting all the crystals, the player can leave the labyrinth.

**[00:02:34] TEAM:** The word appeared again.

**[00:02:43] CUSTOMER:** Yes, the game provides a lot of pronunciation practice.

**[00:02:49] TEAM:** There are three difficulty levels. The 9x9 maze is much longer, so I will not demonstrate the entire level now. Every maze is generated randomly and is unique.

## Maze generation and movement

**[00:03:04] CUSTOMER:** Every generated labyrinth can be completed, right?

**[00:03:09] TEAM:** Yes. We use generation rules that guarantee a valid route.

**[00:03:18] CUSTOMER:** How can the player enter the hole?

**[00:03:30] TEAM:** The player cannot enter it. If the player reaches this position, they must choose another route. The interface warns them that there is a hole on the route.

**[00:04:04] CUSTOMER:** What does the light blue color mean? It appears to fill the area I have already walked through.

**[00:04:25] TEAM:** Do you mean this area?

**[00:04:31] CUSTOMER:** Yes. What does it indicate?

**[00:04:33] TEAM:** It marks the rooms the player has already visited.

**[00:04:35] CUSTOMER:** Can the player return there?

**[00:04:40] TEAM:** Yes. The player can move in any available direction. If a child chooses the wrong route, they can return and take another path.

**[00:05:08] CUSTOMER:** Nice. The game seems to work. Should I test it on my side?

## Other implemented changes

**[00:05:13] TEAM:** I can show the other changes first, and then you can test it.

We removed the CSV requirement. Custom vocabulary can now be pasted using a tab character or exactly four spaces between the word and its translation, as we discussed.

**[00:05:49] CUSTOMER:** Nice.

**[00:05:50] TEAM:** The adaptive vocabulary logic was also updated. A failed word returns after only one mistake. If the player makes a mistake on a word, that word appears more frequently.

**[00:06:28] TEAM:** Many other words still appear, but the words missed in the first round are already returning in the next round.

**[00:07:11] CUSTOMER:** Does that mean new words will no longer appear?

**[00:07:15] TEAM:** No. New words will still appear after these words are pronounced correctly.

**[00:07:25] GAME DEMO:** The team tests the words "moon" and "hill". The browser recognizer has difficulty with "hill" and briefly interprets it as a number.

**[00:08:02] TEAM:** Another test used the phrases "See you later", "Have a nice day", and "How are you?". The failed phrase appeared three times, so the adaptive repetition works.

**[00:08:34] TEAM:** The shared game hub is also complete. All games now use one consistent interface.

**[00:08:39] CUSTOMER:** Nice.

**[00:08:41] TEAM:** Automatic deployment is now part of CI. When code is pushed to `main`, the project is built, tested, and published automatically.

**[00:08:57] CUSTOMER:** That is good.

**[00:08:59] TEAM:** The README and game flow were also updated. The player chooses a difficulty, plays the game, sees the result, and can open Progress from the upper-right area. You can now test the product yourself.

## Preparing the remaining UAT checks

**[00:09:31] TEAM:** I will share the public UAT page with the remaining tests so you can mark them as passed or failed.

**[00:10:05] TEAM:** The UAT update may already be in a pending pull request. Once it is merged, I can share the current public page.

**[00:10:58] TEAM:** The pull request has been merged. I will send the UAT link.

**[00:11:19] TEAM:** Can I send the application link now?

**[00:11:33] CUSTOMER:** Yes. I will open it in Chrome.

**[00:11:59] CUSTOMER:** I am sharing my screen now. Can you see it?

**[00:12:09] TEAM:** Yes.

## UAT 12 - Voice Maze Quest

**[00:12:10] CUSTOMER:** The remaining UATs are 12, 13, and 15, correct?

**[00:12:17] TEAM:** Yes.

**[00:12:19] CUSTOMER:** Let us start with UAT 12, "Explore the endless Voice Maze Quest". The test checks voice-controlled routes, gameplay, difficulty, visited rooms, the exit, alerts, and results. It also asks the player to take different branches, collect every crystal, and intentionally remain silent once.

**[00:13:17] CUSTOMER:** I selected the nature theme. Do I need to enable the microphone manually?

**[00:13:46] TEAM:** I am not sure why it is not responding.

**[00:14:01] TEAM:** This appears to be a speech-recognition issue rather than a game-logic issue.

**[00:14:17] GAME DEMO:** The customer tests route words including "sun", "sheep", "penguin", "zebra", and "owl".

**[00:14:33] TEAM:** I also have problems with the word "owl". The current browser speech-to-text engine often fails to recognize it.

**[00:14:55] CUSTOMER:** Perhaps users should be able to type a word that the engine cannot recognize. I am not sure.

**[00:15:04] TEAM:** Another option would be to remove problematic words.

**[00:15:10] CUSTOMER:** But what if the child still needs to learn those words?

**[00:16:03] CUSTOMER:** This looks like a 7x7 maze, but I selected 5x5, did I not?

**[00:16:10] TEAM:** The default may currently be 7x7.

**[00:16:16] CUSTOMER:** The recognizer is not accepting "hill". From this position, I cannot move because I cannot successfully pronounce another available word.

**[00:16:38] TEAM:** We could add a support button for manual input, but I am not sure how best to implement that.

**[00:16:56] CUSTOMER:** A manual button could let the player complete the entire game without pronouncing anything. Perhaps the game should allow a limited number of attempts and then record that the word was pronounced incorrectly.

**[00:17:27] TEAM:** Another option is a word reroll, but the child is supposed to learn the difficult word.

**[00:17:53] TEAM:** This problem comes from the speech-to-text engine, not from the game algorithm.

**[00:17:58] CUSTOMER:** Perhaps a word could disappear after several rerolls. That would indicate a likely speech-to-text problem while still allowing the player to continue.

**[00:18:12] TEAM:** We could give the player one reroll per attempt.

**[00:18:35] CUSTOMER:** Another option is a report button labelled "The game does not understand what I say". Also, the maze is 7x7 again. It may be better to use 5x5 as the default.

**[00:19:43] CUSTOMER:** The game is playable. I found the red hazard cell and chose an alternative route around it. I will also try reaching the portal before collecting all the crystals.

**[00:20:42] CUSTOMER:** I can see the blocked-exit marker. The test mentions the floor-clear screen and continuing to the next generated maze. What is the difference between the floors?

**[00:21:37] TEAM:** Each floor is another randomly generated maze. There is no fixed sequence of predefined levels.

**[00:21:45] CUSTOMER:** Understood. The test also checks that speaking one visible route word moves the wizard through the corresponding door, updates the map, marks the room as visited, updates the score, and collects the item.

**[00:22:12] CUSTOMER:** The route words remain visible on the map. The hazard route has no spoken entrance, which is correct. Long phrases are somewhat readable, but not ideal. I can read them after zooming in.

**[00:22:43] CUSTOMER:** The phrase is readable in the bottom area, but when the player is near the top of the maze, they cannot see the bottom label. The placement could be improved. The game is still playable.

**[00:23:07] CUSTOMER:** There are some speech-to-text issues, but we cannot realistically solve them now. It is acceptable to leave them for the current release.

**[00:23:20] CUSTOMER:** The shared hub appears in the correct place. English and Russian playback still work. I will also check Progress.

## Maze progress and failed pronunciation tracking

**[00:24:02] CUSTOMER:** Where is the word "owl" in my progress? I did not pronounce it successfully, but I do not see it recorded.

**[00:24:19] TEAM:** The word may appear near the bottom.

**[00:24:22] CUSTOMER:** I do not think "owl" is recorded. In other games, mispronounced words may be recorded. In the labyrinth, if I mispronounce a word, I simply do not move.

**[00:24:51] TEAM:** Correct. The player simply does not move and cannot lose in this game.

**[00:24:57] TEAM:** The player usually has several valid route words to choose from, so the game cannot know which specific word the player intended to pronounce.

**[00:25:09] TEAM:** The player can pause and close the expedition if necessary. Their results are still available.

**[00:25:38] CUSTOMER:** I can see the results now. This is a nice game. I think UAT 12 passes.

## UAT 13 - Adaptive word selection

**[00:26:18] CUSTOMER:** Let us continue with UAT 13, "Reinforce learning with adaptive word selection". The test asks me to mispronounce one specific word or remain silent.

**[00:26:39] CUSTOMER:** I can see that "dolphin" returns after a short time in the same game. UAT 13 appears to pass because both failed words returned.

**[00:27:00] TEAM:** There may still be a problem with words such as "owl" or "sun". If the speech-to-text engine cannot recognize them, the adaptive algorithm shows them more frequently, but the child may continue failing because of the recognizer rather than their pronunciation. What should we do in that case?

**[00:27:33] TEAM:** In the future, the speech-to-text engine could be replaced with a better one that recognizes these words more reliably.

**[00:27:50] TEAM:** With the current speech-to-text system, every workaround creates another problem. A manual button or replacement word can be abused.

**[00:28:27] CUSTOMER:** Exactly. If we add a button that permanently removes a word, a child could remove every difficult word. A report button could be abused in the same way.

**[00:28:45] TEAM:** Even if the button appears only after five failed attempts, a child who does not want to practice could intentionally say random sounds and then skip the word.

**[00:29:29] CUSTOMER:** Ideally, the speech-to-text quality itself should be improved.

**[00:29:38] TEAM:** Replacing the speech-to-text engine may be the only complete solution.

**[00:29:47] CUSTOMER:** A better model might be loaded with the website, but I am not sure whether a sufficiently accurate and lightweight model exists for local browser use. For now, the current behavior is acceptable.

**[00:31:19] GAME DEMO:** The customer and team test the word "owl" several times. Recognition is not stable.

**[00:32:07] CUSTOMER:** It works better when I pronounce the word slowly. Perhaps the README should tell users to speak slowly and clearly.

**[00:32:20] GAME DEMO:** The customer tests more route words in the labyrinth, including "horse", "fox", "penguin", "tiger", "squirrel", "giraffe", "panda", "cat", "owl", "cow", "zebra", and "pig".

**[00:33:34] CUSTOMER:** The word "pig" requires many attempts when pronounced quickly.

**[00:34:10] CUSTOMER:** When I slow down, recognition improves.

**[00:34:38] CUSTOMER:** We managed to complete the test despite the difficult words.

**[00:35:28] CUSTOMER:** This UAT passes. In this environment, pronunciation works reasonably well when the user speaks slowly.

**[00:35:59] TEAM:** UAT 14 has already passed. That test covered the shared hub. Only UAT 15 remains.

## UAT 15 - Bulk custom vocabulary

**[00:36:08] CUSTOMER:** UAT 15 is "Add spaced custom words and phrases in bulk".

**[00:36:13] TEAM:** You have already added "oval". You can also try adding a longer phrase containing spaces.

**[00:36:23] CUSTOMER:** Can I use another separator, such as a tab character?

**[00:36:42] TEAM:** Tab support is mainly for pasted table data.

**[00:36:47] TEAM:** When vocabulary is copied from a spreadsheet, the separator between columns is a tab character.

**[00:37:03] CUSTOMER:** Could the parser also accept semicolons or pipe characters? For now, I will use four spaces.

**[00:37:57] TEAM:** The first row contains only three spaces.

**[00:38:01] CUSTOMER:** That may be the issue. Ideally, an invalid row should remain in the input area so the user can correct it instead of losing it.

**[00:38:35] CUSTOMER:** I had not selected the custom vocabulary yet. I will select "My Words".

**[00:39:39] CUSTOMER:** Why did the game advance twice after one utterance?

**[00:39:46] TEAM:** The next word was the same as the previous one. The recognizer may have processed the same audio twice, once for each word. We may need to stop or mute the microphone briefly after a successful recognition.

**[00:40:13] CUSTOMER:** Yes. One successful utterance should not also count as the first attempt for the next word. The game still works overall.

**[00:40:46] CUSTOMER:** We now have a collection of games, and they mostly work. I will test another phrase, such as "Nice to meet you".

**[00:41:25] TEAM:** The separator may not contain exactly four spaces.

**[00:41:29] CUSTOMER:** The UAT intentionally uses three spaces first to verify that an invalid separator is rejected. I should now replace it with four spaces.

**[00:41:53] CUSTOMER:** The next step asks me to paste "good morning", a tab character, and its translation on the second line. I need a reliable way to create a tab character.

**[00:42:58] TEAM:** Spreadsheet applications normally copy the separator as a tab.

**[00:43:04] CUSTOMER:** There should be a way to paste tab-separated table data into a plain text field. I will continue testing.

**[00:43:20] CUSTOMER:** The duplicate word was not added, which is correct. The three-space version was not silently split or saved as two columns, which is also correct. Both the four-space row and the tab-separated row should be accepted together.

**[00:44:50] TEAM:** The tab character is Unicode U+0009.

**[00:46:27] CUSTOMER:** It is still displayed in a confusing way. I am not sure whether the copied character is truly a tab.

**[00:47:14] TEAM:** The intended use case is that parents prepare vocabulary in a spreadsheet or editor and then paste it into the game. Some editors can convert a tab into spaces depending on their configuration.

**[00:47:54] CUSTOMER:** Exactly. An editor may convert a tab into four spaces, eight spaces, or something else.

**[00:48:30] TEAM:** I tested copying words and translations from separate spreadsheet columns. The spreadsheet inserted a tab character, and the pasted data worked correctly in the game.

**[00:48:55] CUSTOMER:** I have not tried Google Sheets yet. I will test it.

**[00:49:20] CUSTOMER:** Yes, the separator behaves differently from a regular space.

**[00:49:45] CUSTOMER:** Great. We should recommend creating the vocabulary list in Google Sheets so users get consistent results.

**[00:50:08] TEAM:** Okay.

**[00:50:35] CUSTOMER:** I can confirm that the separator is a real tab character. This part works.

## Final feedback and review outcome

**[00:51:14] CUSTOMER:** The remaining issue is the behavior around invalid or duplicate input. The system correctly refuses to add a duplicate word and rejects unsupported separator formats. However, invalid rows are removed from the input. Ideally, those rows should remain visible so the user can edit and correct them.

**[00:51:42] CUSTOMER:** In the instructions, replace the recommendation to use desktop spreadsheet applications with Google Sheets. You may clearly name the service.

**[00:52:13] CUSTOMER:** Mention this in the README, specifically in the step that explains how to paste custom vocabulary.

**[00:52:21] TEAM:** Okay.

**[00:52:22] CUSTOMER:** I think that covers the remaining changes. I will verify the Progress page now.

**[00:52:33] CUSTOMER:** Sessions played, words spoken, and words struggled with are displayed correctly. Clear Progress also works. I think that is everything for the product.

**[00:53:15] TEAM:** Yes, I think that is everything. We can fix the remaining small issues.

**[00:53:34] TEAM:** After we prepare the final MVP3 release, could you send us a short written confirmation that you accept it? We will send you the release link.

**[00:53:59] CUSTOMER:** Send me the final product link, and I will confirm that I accept the release. Yes, we can do that.

## Part 2 outcome

- Voice Maze Quest was playable and UAT 12 passed.
- Adaptive word selection worked and UAT 13 passed.
- The shared hub had already passed UAT 14.
- Bulk custom vocabulary worked and UAT 15 passed, with small usability and documentation fixes requested.
- Progress tracking and Clear Progress worked.
- The customer accepted the documented browser speech-to-text limitations for MVP3.
- The team agreed to prevent one recognition event from advancing two prompts, keep 5x5 as the persistent default, preserve invalid and duplicate rows for correction, improve route-label readability, recommend Google Sheets, and add slow-speaking guidance.
- The team would send the final MVP3 release link, after which the customer agreed to provide a short written acceptance message.
