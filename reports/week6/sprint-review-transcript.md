# Week 6 Sprint Review, UAT, and transition-readiness transcript (Team 40)

Sanitized English transcript of the single recorded session that covered the Sprint 4
Sprint Review, the customer-executed UAT (UAT-09 through UAT-14), the customer-facing
documentation review, and the Week 6 transition-readiness discussion for the `v0.4.0`
Week 6 trial release. Recording and publication of this clean transcript were both
explicitly permitted by the customer at the start of the session (see Part 1 below).

Private exact timecodes tied to real-world clock time, the recording itself, and any
customer-identifying detail are not in this file; they are in the Week 6 Moodle PDF. The
timestamps below are relative to the start of each of the three recorded parts, as noted in
the transcript conventions.

See [`reports/week6/sprint-review-summary.md`](./sprint-review-summary.md) for the summary
and [`reports/week6/README.md`](./README.md) for the resulting feedback-response table and
UAT results.

---

## Transcript conventions

- **Customer**: the customer reviewing and testing the product.
- **Team**: any member of the project team.
- **Game / screen**: words read from a UAT, displayed by the interface, or spoken while testing a game.
- Timestamps are local to each original recording and reset at the beginning of every part.
- Filler words, microphone checks, and accidental speech repetitions were removed.
- Grammar and obvious speech-recognition errors were corrected without removing requested changes, decisions, or feedback.

---

# Part 1: Beginning

*[00:00-02:43: Pre-call microphone checks and incomplete false starts omitted.]*

**[02:44] Team:** Hello, can you hear me?

**[02:47] Customer:** Yes.

**[02:55] Team:** One minute, please.

**[03:03] Team:** Hello. Today, we want to show you our Week 6 trial release, version 0.4.0, which completes our game catalog and adds adaptive word selection. We will ask you to try several tasks yourself, collect your feedback, and discuss the transition. Before we start, may we record this session for our coursework?

**[03:29] Customer:** Yes.

**[03:31] Team:** May we also publish a clean, anonymized English transcript?

**[03:36] Customer:** Yes.

**[03:39] Team:** Thank you. During this sprint, we focused on delivering a stable trial release that completes the ten-game set and establishes a solid foundation for the handover. We added the final four games: Voice Treasure Hunter, Sentence Bird, Echo Microphone, and Magic Wizard. We also implemented adaptive word selection, so words a child struggles with appear more frequently; resolved a critical progress data-loss risk; added export functionality for teachers; and standardized elements such as sounds, buttons, microphone indicators, and target cards across all ten games. The trial release completes our core features and is live for your testing.

**[04:29] Team:** I will show you the link now. Is that okay?

**[04:48] Customer:** Yes. I have not received it yet because of problems with Telegram. Could you please share it here in the chat?

**[05:01] Team:** I shared it in the meeting chat.

**[05:05] Customer:** I do not see it.

**[05:12] Team:** It is next to the meeting chat.

**[05:14] Customer:** There is nothing there as far as I can see.

**[05:22] Customer:** I thought you had shared the link.

**[05:24] Team:** I was sharing my screen instead. Sorry. Can you see the screen now?

**[05:31] Customer:** Yes, I can see it.

**[05:35] Team:** Here is our sprint milestone. All tasks for the milestone are complete.

**[05:45] Customer:** Great. Let us see the results.

**[05:51] Team:** Here is our Sprint 4 backlog. You can see the different tasks and their story points.

**[06:10] Customer:** Great. Each task appears to be connected to a pull request. Good discipline. Do you use issue metadata to track story points, or do you also write them in the descriptions?

**[06:31] Team:** What do you mean?

**[06:33] Customer:** Could you open issue 103?

**[06:45] Customer:** I can see that the story points are stored in the project metadata. Could you scroll up, please?

**[07:06] Customer:** On the right, the project field already contains the story points. Why do you additionally store them in a comment on the issue? Is that a refinement comment?

**[07:26] Team:** I do not think so. We just added it.

**[07:36] Customer:** What about the responsible person? Who was responsible for this issue? Do you store that in the issue?

**[07:47] Team:** This issue was created by Maxim.

**[07:55] Customer:** Who was responsible for implementing it? Was that also Maxim?

**[08:07] Team:** Yes, Maxim.

**[08:10] Customer:** Is that tracked anywhere?

**[08:15] Team:** Maxim is assigned as the responsible person. It is tracked in GitHub.

**[08:24] Customer:** Good. An issue might be created by the team lead rather than by the person who must implement it. Unless you explicitly assign the issue to Maxim, he may not know that he is expected to work on it, and the responsibility will not be visible in the issue history. When an issue is assigned to someone, it becomes clear that they must work on it.

**[08:58] Customer:** So you are using assignees. Good, you do track this.

**[09:04] Customer:** Who is accountable for the success of this issue? Who checks that it is fully completed?

**[09:23] Team:** I think it is Mikhail.

**[09:29] Customer:** Did you write that anywhere? How did you let Mikhail know that he was the reviewer?

**[09:43] Team:** Every pull request has a reviewer. If you open the pull request, you can see the linked issue, the person who implemented it, and the reviewer.

**[10:01] Customer:** That works well when one issue can be closed by a single pull request. What happens if an issue requires several pull requests? A reviewer may approve an individual pull request, but who checks that the whole issue is completely done? Is it the same reviewer?

**[10:38] Team:** Yes, it is the same reviewer.

**[10:42] Customer:** It is safer to track both people directly: the person who must implement the issue and the person who must review it and is accountable for its success. The responsible person implements the work. The accountable person is responsible for the successful completion of the issue. The assignment suggested tracking both people in the issue description. This is not very important now, at the end of the project, but in future projects you should track both roles if you want it to be clear who is working on an issue and who verifies its completion.

**[11:32] Team:** Okay.

**[11:40] Customer:** You have closed all issues for this sprint and made good progress. What would you like to discuss next?

**[11:49] Team:** I can now show you what we added to the product.

**[11:57] Customer:** Great.

**[12:00] Team:** First, we added the progress view. Here you can see sessions, records, words, and statistics for different games. You can also download a CSV file containing data for every word in every game, including how many times it was spoken and how many times the learner struggled with it. The view also includes high scores.

**[12:29] Customer:** Nice. Is the data shown separately for each game?

**[12:35] Team:** Yes.

**[12:38] Team:** We also added four new games. I will switch the interface to English.

**[12:53] Team:** This is Voice Treasure Hunter.

*[The team demonstrates the game, its reward levels, and the lose screen.]*

**[13:20] Team:** This is Sentence Bird. It is similar to Flappy Bird.

**[13:25] Game / screen:** Cat. Dog. Rabbit.

**[13:37] Customer:** What happens if the player does not pronounce anything?

**[13:41] Team:** That is currently a problem in this game. We did not fix it before the interview. The planned solution is to add a timer for every word.

**[14:05] Customer:** Will the bird visibly fall, or will there only be a timer?

**[14:13] Team:** There will be a lose animation, as in the other games. It will be added here too.

**[14:25] Customer:** Nice concept.

**[14:31] Team:** This is Echo Microphone. The player must pronounce words and remember the cards that appear.

**[14:51] Team:** Now you need to pronounce "horse."

**[14:53] Game / screen:** Horse.

**[14:54] Team:** Now you have two words to memorize.

**[15:00] Game / screen:** Horse. Mouse.

**[15:11] Team:** The game ends after the player successfully pronounces five words. The player needs to memorize the sequence.

**[15:18] Customer:** What happens if the player pronounces an incorrect word?

**[15:22] Team:** The player has a timer and three lives. If the player does not pronounce the required word, they lose a life.

**[15:37] Team:** The last new game is Magic Wizard. The player kills monsters by pronouncing words.

**[15:49] Game / screen:** Penguin. Dog. Panda. Fox.

**[16:07] Team:** There are still some bugs in this game. We will fix them.

**[16:15] Customer:** Is this similar to Boss Fight?

**[16:20] Team:** The mechanics are different. In Boss Fight, the player must pronounce three words to defeat a monster; otherwise, the monster hits the player. In Magic Wizard, each correctly pronounced word defeats one enemy.

**[16:48] Customer:** Understood.

**[16:53] Team:** We can now run the UATs. Should I share the link?

**[17:01] Customer:** Yes, please share the UAT link in the meeting chat.

**[17:19] Customer:** It is still inaccessible.

**[17:35] Team:** I have sent it now.

**[17:39] Customer:** What should I do?

**[17:41] Team:** Could you share your screen with us?

**[17:47] Customer:** I cannot while you are sharing yours.

**[17:51] Team:** Sorry. You should read the UATs and play the games yourself. We will fill in our table.

**[18:12] Customer:** I will share my screen, then. I will open the product in Chrome.

**[18:24] Team:** Should you open the UAT document or the game?

**[18:26] Customer:** The game. I will open the repository in Chrome and then open the UATs.

**[18:39] Team:** The game link is the same. I will post it in the chat.

**[18:50] Customer:** I will disconnect for a moment because the site does not work without my VPN.

*[Connection pause.]*

**[19:45] Customer:** It now works with the VPN. I can start the demonstration. I will share my screen again.

**[20:01] Customer:** Could you please tell me what I should do?

**[20:05] Team:** Please read and execute UAT-09 through UAT-14.

## UAT-09: Voice Treasure Hunter

**[20:25] Customer:** "Navigate deeper in Voice Treasure Hunter. From the hub, press Play on Voice Treasure Hunter."

**[20:51] Customer:** "Select a word set, check the submarine preview, and press Start."

**[21:08] Game / Customer test:** Peach. Blackberry.

**[21:15] Customer:** Maybe my microphone is not enabled. What happened?

**[21:22] Game / Customer test:** Fig. Pineapple. Tangerine. Apple. Avocado. Strawberry. Grape. Mango.

**[21:46] Customer:** The expected result says that correct pronunciation steers the submarine deeper and collects treasure chests, and that the money counter increases. I was looking at the depth meters rather than the money counter.

**[21:57] Game / Customer test:** Watermelon. Apricot. Papaya. Grapefruit. Plum. Apricot. Banana. Apricot.

**[22:22] Customer:** The money counter increases. This is a pass.

## UAT-10: Sentence Bird

**[22:28] Customer:** "Fly through the clouds in Sentence Bird. Pronounce several phrases and experience a game over when all lives are lost."

**[22:47] Customer:** "From the hub, press Play on Sentence Bird. Select a phrase set and press Start."

**[22:53] Customer:** I will select long phrases.

**[23:09] Customer:** I think something is wrong with the text color or the background color here.

**[23:18] Game / Customer test:** The weather is beautiful today. I love playing educational voice games. Can you please help me with this? My favorite color is bright blue.

**[23:44] Customer:** Accuracy is 100%.

**[23:48] Customer:** I can see some bugs.

**[23:52] Team:** We will fix them.

**[23:55] Customer:** The UAT expects a game over when the lives are lost. I experienced a game over, but it did not happen in the way I expected.

**[24:07] Customer:** What happens if I play again? Will all counters be reset?

**[24:15] Game / Customer test:** Cat. Dog. Rabbit. Lion. Panda. Monkey.

**[24:41] Customer:** I lose health whenever I pronounce anything because the microphone treats speech as an attempt, even when it is not the expected word. I am not sure when the player is supposed to speak.

**[25:10] Customer:** Should the microphone be active only at specific moments, or should it remain active all the time?

**[25:38] Customer:** Perhaps it should activate only when the bird is at risk of crashing into an obstacle, rather than listening continuously. However, that alone may not prevent the game from treating unrelated speech as an incorrect answer.

**[26:25] Customer:** Consider adding explicit activation with the Space key: the player presses Space and then pronounces the word. There should also be an on-screen button for tablet users who do not have a physical keyboard.

**[26:56] Customer:** The displayed word itself could be the activation button. This should be separate from the existing button used to hear the pronunciation, so the two actions do not conflict.

**[27:30] Customer:** In other words, make the displayed word clickable and instruct the player to "click and say this word." After the click, activate the microphone and allow the player to pronounce it. This would make the interaction clearer.

**[28:03] Customer:** That was UAT-10. Let us continue to the next test.

**[28:27] Team:** You skipped Echo Microphone. UAT-11 is about Echo Microphone; Sentence Bird was UAT-10.

**[28:41] Customer:** You are right.

## UAT-11: Echo Microphone

**[28:58] Customer:** "From the hub, press Play on Echo Microphone. Select a word set, or add a custom word, and press Start."

**[29:11] Customer:** I do not have custom words, so I will select Short Phrases.

**[29:24] Customer:** "Listen to the spoken words and repeat them while the microphone is active."

**[29:33] Customer:** Let us try this phrase.

**[29:40] Game / Customer test:** Nice to meet you.

**[29:42] Game / screen:** Nice to meet you. Have a nice day.

**[29:48] Customer:** Why did I receive three cards?

**[29:53] Team:** I am not sure. There are some problems with short phrases. You can try regular words instead.

---

# Part 2: Middle

## UAT-11 continued: Echo Microphone

**[00:00] Game / Customer test:** Nice to meet you. How are you?

**[00:03] Customer:** Nice to meet you. How are you? I do not know.

**[00:09] Customer:** I think the issue was audio feedback. My speaker volume was high, so the game heard its own pronunciation and counted it as a successful response.

**[00:25] Game / Customer test:** Excuse me. See you later. What is your name? You are welcome.

**[01:11] Customer:** This is supposed to be a memory game, but I can see the entire phrase on the screen.

**[01:31] Team:** In the developer's version of the game, the phrase was not displayed on this screen. We will remove it after the fixes.

**[01:48] Customer:** At the moment, showing the phrase undermines the memory mechanic. On the other hand, this could be treated as a more advanced reading game for a child who can already read.

**[02:10] Customer:** At some point, the player should still be able to listen to the phrase on a card as a reference.

**[02:18] Team:** Yes, the player can use the reference pronunciation here. These are all the phrases in the game, and the player can listen when needed.

**[02:31] Customer:** Understood. The idea is good. Please also make the Back to Hub button brighter and easier to notice.

**[02:48] Customer:** UAT-11 is mostly a pass, but this display problem remains.

## UAT-12: Magic Wizard

**[03:02] Customer:** "Cast spells in Magic Wizard."

**[03:08] Customer:** I will use Short Phrases.

**[03:13] Game / screen:** Begin spell casting.

**[03:19] Game / Customer test:** What is your name? Nice to meet you. Excuse me.

**[03:27] Customer:** I am not sure what happened. There appear to be some hitbox problems.

**[03:35] Customer:** This game is very similar to Voice Treasure Hunter. There is no monster approaching and hitting me, but if I fail to pronounce a word in time, I still lose one health point. I am not sure this counts as a different mechanic; the underlying mechanics are essentially the same.

**[04:23] Customer:** Perhaps you should invent something more distinct. Let us consider which version is more engaging: Magic Wizard or Voice Treasure Hunter. We already have another game with monsters.

**[04:55] Customer:** Which version does the team prefer?

**[05:01] Game / Customer test:** Koala. Zebra. Hedgehog. Sheep. Duck.

**[05:22] Customer:** This other game also has a monster and a timer, so it is quite similar to Magic Wizard. Magic Wizard is slightly more engaging because a boss approaches the player, forcing them to pronounce the word. In the other game, there is only a timer, and the timer is not clearly visible.

**[06:02] Customer:** The timer could be moved to the top. I really like the visuals in this game, so another option is to have the boss slowly approach the player and hit them when time runs out. The approaching boss would visually represent the timer.

**[06:31] Customer:** You might abandon Magic Wizard as a separate game, but reuse its "approaching monster" mechanic in the more visually appealing game.

**[06:44] Customer:** Let us continue.

## UAT-13: Adaptive word selection

**[06:49] Customer:** "Reinforce learning with adaptive word selection. A child who struggles with specific words receives more practice on them. Start a new game, intentionally mispronounce or remain silent on a specific word several times, and observe the sequence of words as the game progresses."

**[07:21] Customer:** I will need a custom word list.

**[07:26] Team:** Yes, you can create one. Try adding a word.

**[07:33] Customer:** I will add "hello" and "bye."

**[08:18] Customer:** I will start the Skateboard game.

**[08:24] Game / Customer test:** Hello. Hello. Hello.

**[08:42] Customer:** It is difficult to tell whether the game is suggesting "bye" more often than "hello." I will try again.

**[08:54] Game / Customer test:** Hello. Bye. Hello. Hello. Hello. Hello. Hello. Hello.

**[09:36] Customer:** I would expect the game to suggest "hello" according to the accumulated difficulty data.

**[09:42] Team:** Can you add a third word, for example "someone," in addition to "hello" and "bye"?

**[09:56] Customer:** Yes.

*[The customer updates the custom word set and continues testing.]*

**[10:51] Customer:** Does the system adapt word frequency during the current game? For example, if I pronounce "hello" correctly several times, should it appear less frequently later in the same game?

**[11:16] Customer:** More specifically, does the algorithm use dynamic statistics during the round, or does it take a snapshot only after the game ends and apply that snapshot when the next game starts?

**[11:49] Team:** It is supposed to use the first approach and adapt dynamically, but I do not know what happened during this test. This part is still in progress.

**[12:05] Customer:** To confirm: if I already have statistics and then make two mistakes on a word during the current game, the system should show that problematic word more often during that same game, rather than waiting until the next game. Correct?

**[12:47] Team:** Yes.

**[13:07] Customer:** Add automated tests for this algorithm. You can generate a sequence of player actions, feed it into the word-selection algorithm, and verify that the resulting probability distribution corresponds to the learner's performance. Words pronounced incorrectly, and new words, should receive a higher selection probability.

**[14:07] Customer:** The adaptation should be dynamic because some games, such as Skateboard, can continue indefinitely. Fresh statistics should be used whenever the next word is selected within the same round.

**[14:36] Team:** Okay.

**[14:38] Customer:** That concludes UAT-13.

## UAT-14: Unified Hub Navigation

**[14:45] Customer:** "A child can return to the learning hub from any game using the unified navigation button. Open Voice Lane Racer, start the game, locate the Back to Hub button, and press it."

**[15:05] Customer:** I will open Voice Lane Racer, the first game.

**[15:14] Customer:** I can return to the hub from here. The test says to start the game and locate the Back to Hub button.

**[15:27] Customer:** There is no text label saying "Back to Hub," but I assume the icon is the intended button.

**[15:37] Customer:** Next, I will open Skateboard and start the game.

**[15:39] Customer:** I can still hear sounds from the previous game. Please check whether game audio stops when the player returns to the hub or switches games.

**[15:50] Customer:** I can see the hub button in Skateboard. I will press it.

**[16:01] Customer:** The expected result is that both games immediately return the player to the hub. That worked.

**[16:12] Customer:** I think we have covered UAT-09 through UAT-14.

**[16:18] Team:** Yes, that is everything. Thank you.

## Transition-readiness discussion

**[16:27] Team:** We have several final questions. From your perspective, is the product complete enough for transition? Which parts are ready, and which still need changes next week?

**[16:43] Customer:** We found several problems in the games, and ideally those should be fixed. The progress export appears to be fine; I successfully downloaded a CSV file.

**[17:07] Customer:** The false recognition in Echo Microphone was probably caused by my own speaker volume. The game heard its own audio, so I should reduce the speaker volume. I would not treat that particular case as a confirmed product defect.

**[17:27] Customer:** Overall, the games are playable. I did not retest all of the earlier games, but if they were not modified, they are probably still playable.

**[17:45] Customer:** Let me check internationalization.

**[18:00] Customer:** The progress page is translated into Russian, including "My Words." Good.

**[18:33] Customer:** Please also internationalize the preview screen. That is my main remaining internationalization comment.

**[18:51] Customer:** It is good that you included the game rules.

**[19:23] Customer:** I am not sure whether translating the exported CSV into Russian is good practice. English is acceptable for me, so keep the CSV column names and exported data format in English.

**[19:43] Customer:** Other than the preview, I do not notice any additional text problems. The English version also appears not to contain Russian text.

**[20:16] Customer:** The application is deployed on GitHub Pages, which is good. Do you have continuous deployment, so that a push or merge to `main` is deployed automatically?

**[20:33] Team:** Yes.

**[20:35] Customer:** Great. The product is almost ready. A few things need to be fixed, and then it will be in good shape.

**[20:57] Team:** Thank you.

**[21:00] Customer:** Have you already tested the product with children?

**[21:06] Team:** I tested the first four games with my sister, and she liked them.

## Bulk custom-word input

**[21:18] Customer:** One more comment: the problem with "My Words" remains. How can I add a large number of words, for example fifty words? At the moment, it appears that they must be added one by one.

**[21:49] Team:** Could you click "Listen and Learn" at the bottom?

**[22:12] Customer:** I do not need to hear the Russian version. What I need is a faster way to add many word pairs.

**[22:19] Customer:** It would be useful to add CSV import, or at least one multiline input field where a user can paste many word-translation pairs.

**[22:37] Customer:** For example, one line could contain `hello` and `привет`, and the next line could contain another pair.

**[22:50] Customer:** You can use a delimiter-detection heuristic. Split the input into lines, then split each line by a known delimiter such as a vertical bar, comma, or semicolon.

**[23:23] Team:** Would it be convenient to provide a single field where the user enters a word, a separator, and its translation, with each pair on a new line?

**[23:51] Customer:** Yes, exactly. The user pastes the entire list into one field.

**[24:55] Team:** Could a space be used as the separator?

**[24:59] Customer:** No. Splitting by spaces is unsafe because words and phrases themselves contain spaces. A vertical bar is useful because it is rare in ordinary text. You can also accept a semicolon.

**[25:38] Customer:** For the MVP, accepting either a semicolon or a vertical bar is enough. Each line should represent one pair: the word before the delimiter and its translation after the delimiter.

**[26:08] Team:** Okay.

## README and repository review

**[26:21] Team:** I will send several files from our GitHub repository to the chat. The first one is the README. We would like you to review and accept these files, or tell us what should be changed.

**[27:04] Customer:** You should definitely add screenshots, perhaps from several games. A screenshot of the start screen near the top would attract attention.

**[27:40] Customer:** The note about the hosted live product is useful.

**[27:42] Customer:** Some content is intended for developers and should be moved into a separate "For Developers" section.

**[27:50] Customer:** Remove the "Assignment 6" wording.

**[27:56] Customer:** Remove the "Sprint 3" or release-course wording as well. The README should describe the product, not the coursework stage.

**[28:03] Customer:** The contributing and agent-guidance links can remain, but they belong in the developer section.

**[28:11] Customer:** The customer-handover documentation should be easy to locate. You can provide a customer-oriented section or a clear link to it.

**[28:24] Customer:** The MIT license information can also go in the developer section.

**[28:33] Customer:** Remove the internal mirror information. It is not needed in the public README.

**[28:41] Customer:** The product-backlog and Issues links are also unnecessary; I already know where GitHub Issues are.

**[28:54] Customer:** Keep the roadmap link.

**[29:28] Customer:** Create a README or index file inside the `docs` directory that explains what the documentation files are. Then move detailed documentation-navigation content from the main README into that file. If your hosted documentation site already provides a good index, duplication may not be necessary.

**[29:55] Customer:** I can see that you already have a Voice Games documentation page.

---

# Part 3: End

## Documentation and README review continued

**[00:00] Customer:** I cannot search the repository from here, but you may already have a root file for the documentation.

**[00:28] Customer:** You have an `index.md`. You can rename it to `README.md` so that GitHub renders it automatically when someone opens the `docs` directory. You may need to adjust the documentation-generation pipeline if it currently expects `index.md`.

**[00:45] Customer:** The detailed documentation content can live there. In the main README, keep only the most important public links, such as the application link and the hosted documentation link.

**[01:13] Customer:** The "Setup and Deployment" section can remain. The note that no API keys are required can also remain, as can public deployment and microphone-access information.

**[01:39] Customer:** Move the repository layout into a developer-oriented section.

**[01:59] Team:** Do we need to create a separate README specifically for developers?

**[02:06] Customer:** Not necessarily. A "For Developers" section is enough. "Setup and Deployment," "Repository Layout," and the license are all developer-oriented.

**[02:17] Customer:** Move "Repository Layout" before "Setup and Deployment." Add a link from the main README to the `docs` directory. When someone clicks it, GitHub should open the `docs` directory and render its `README.md`, which should explain what each documentation file contains.

**[03:02] Customer:** You already track milestones in the roadmap, so do not repeat them in the README.

**[03:21] Customer:** Put the tech stack after the repository layout and before setup and deployment. You could turn the technologies into badges or icons, but that may look noisy. Keeping the text list is fine.

**[04:17] Customer:** The README should contain a short product description and a list of all ten games.

**[04:27] Customer:** Use a list for the ten games. Add screenshots to attract attention.

**[04:42] Team:** Do you mean a screenshot for every game?

**[04:46] Customer:** No. Screenshots from two representative games are enough.

**[04:56] Team:** Okay.

**[04:59] Customer:** Put the link to the live product before the game list and screenshots. Access to the product is the most important part of the README.

**[05:27] Customer:** After the live-product link, show the game list and screenshots from a couple of games. After that, add the documentation link, preferably to the hosted documentation site.

**[06:10] Customer:** Then include the repository layout, tech stack, setup and deployment, and license information.

**[06:24] Customer:** That should be enough.

**[06:30] Customer:** Let me verify the links. The documentation site works well, and the link to the games works. The releases also look good. The README is already solid; it mainly needs the restructuring and visual improvements we discussed.

## CONTRIBUTING.md, AGENTS.md, CHANGELOG.md, and package metadata

**[07:21] Team:** We also need your feedback on `CONTRIBUTING.md`, `CHANGELOG.md`, and `AGENTS.md`.

**[07:31] Customer:** I am opening the contributing guide.

**[07:34] Customer:** "Before You Start" and the local setup workflow look fine.

**[07:48] Customer:** Some duplication between `CONTRIBUTING.md` and the main README is acceptable. The README is the first thing people see, and they may want to run the setup instructions directly from there.

**[08:12] Customer:** The definition of done and the code conventions look fine.

**[08:23] Customer:** Which TypeScript version do you use? There is a newer TypeScript version that is significantly faster.

**[08:38] Team:** We use version 7.0.2.

**[08:47] Customer:** Where can a developer learn that from the repository? I do not think `package.json` currently makes it obvious. It may only be visible in the lock file.

**[09:07] Customer:** Pin the TypeScript version to a specific version so that the development environment is reproducible.

**[09:18] Customer:** I am checking `AGENTS.md` and its testing guidance.

**[09:42] Customer:** I probably will not need this file myself, but it may provide useful guidance for contributors.

**[10:03] Customer:** `AGENTS.md` is acceptable. `CONTRIBUTING.md` is also acceptable.

**[10:08] Customer:** The changelog appears to be up to date and includes the latest release.

**[10:24] Customer:** The project has an MIT license dated 2026. That is fine.

## Customer handover and repository ownership

**[10:43] Customer:** Are there any other files you want me to review?

**[10:47] Team:** The customer-handover document. I sent you a link.

**[10:52] Customer:** Is it also available in the repository?

**[10:54] Team:** Yes, it is in `docs`.

**[11:08] Customer:** Public product access is documented. Product-source-code access is documented, and read access is already available.

**[11:22] Customer:** Let me review repository ownership and access.

**[11:48] Customer:** The instructions about the internal Innopolis mirror are not important for me. I do not need that operational detail.

**[12:10] Customer:** I probably will not need write access after the project ends.

**[12:21] Customer:** Your GitHub issues preserve the development history, but the main value of this project is the set of strong prototypes and game ideas rather than ten completely finished games. I may later choose the most engaging ideas and continue them in a new project, perhaps combining them with ideas from another team.

**[13:08] Customer:** Therefore, keep this repository under the team's ownership, as you suggested. You do not need to grant me write access.

**[13:24] Customer:** It is good that the handover states that no API keys or secrets are required. Only the documented environment variable is needed. The notes about internal virtual machines, the absence of user accounts, and the absence of payment processing are also clear.

## README visual improvement and quick start

**[14:42] Customer:** This custom-words feature may be useful. Add a screenshot of this part near the top of the README to attract attention.

**[15:03] Customer:** Later in the README, do not use only random screenshots. Add a short visual tutorial showing how to add a custom word or a list of custom words.

**[15:31] Team:** So this should be a Quick Start section?

**[15:37] Customer:** Yes, a small Quick Start section would work.

## Acceptance and final Week 7 requirements

**[16:35] Customer:** We can agree that you will fix the identified items and present the result next week. I explicitly accept that plan in this meeting.

**[16:46] Customer:** If you need additional evidence of acceptance, I can fork the repository. That can count as acceptance.

**[17:06] Customer:** If you fix everything we discussed, there will be no additional follow-up items.

**[17:22] Team:** Is that everything regarding the files?

**[17:30] Customer:** Yes.

**[17:32] Team:** Thank you. Our last question is: what must happen in Week 7 to make the final transition successful? How can we increase the chance that the product remains useful and maintainable for you after delivery?

**[17:56] Customer:** Update the files as I suggested and fix the game issues we identified.

**[18:20] Customer:** Do not remove or hide the project. Keep the repository public and keep the project open source.

**[18:31] Team:** That is everything for today. Thank you for the interview.

**[18:39] Customer:** Thank you for your work, patience, and effort.

**[18:48] Team:** Sorry about yesterday's problem.

**[18:51] Customer:** It is okay. It was worth it.

**[18:59] Team:** Thank you.

**[19:04] Customer:** Thank you. Goodbye.

**[19:06] Team:** Goodbye, and thank you for your time.
</content>
