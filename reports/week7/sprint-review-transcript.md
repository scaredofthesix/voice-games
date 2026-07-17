# Sprint 5 Review transcript (Week 7)

Sanitized English transcript of the Week 7 Sprint 5 review / customer-trial session.
Grammar and phrasing were cleaned while preserving the decisions, uncertainty, and
conversational tone. `TEAM` combines the presenting team members; `CUSTOMER` is the product
stakeholder who tested the build and gave feedback; `GAME DEMO` marks text-to-speech or
repeated in-game test phrases, not interview participants. No names, credentials, or private
access details appear here; those are kept in the Week 7 Moodle PDF per the assignment's
public/private evidence split.

> A separate short final MVP v3 confirmation review was completed on 2026-07-17. Its
> sanitized decisions and customer-executed UAT-12/UAT-13/UAT-15 results are recorded in
> [the review summary](./sprint-review-summary.md) and
> [the maintained UAT history](../../docs/user-acceptance-tests.md). The supplied full source
> remains private unless separate publication permission is confirmed.

---

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

**[00:10:15] TEAM:** When the new game is ready, we can send you the product link in Telegram and you can confirm whether the game passes.

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

**[00:25:33] CUSTOMER:** Yes. Send the link in Telegram.

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

**[00:57:32] TEAM:** After we make the final changes, should we send you the link and a written list of changes in Telegram, or should we arrange another short review session for MVP v3?

**[00:58:23] CUSTOMER:** I am happy to have another short session. Then I can review the final version and test the changes directly.

**[00:58:42] TEAM:** We will contact you in Telegram and arrange a short call to review MVP v3, which will be our final product version.

**[00:59:03] CUSTOMER:** Great. I will be available and will write in the chat.

**[00:59:15] TEAM:** Thank you for your patience with the missing items.

**[00:59:28] CUSTOMER:** No problem. This is a normal working process. Thank you for implementing all the games. It is great to see the team's creativity in the product.

**[00:59:44] TEAM:** Thank you very much. Goodbye.
