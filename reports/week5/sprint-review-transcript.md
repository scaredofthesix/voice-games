# Customer Review / UAT Transcript - Week 5 (Team 40)

Sanitized English transcript of the Sprint 3 customer review and user acceptance
test session. The customer granted recording and transcript permission for the
coursework at the start of the meeting, so this file is published in the public
repository. The external customer is referred to by role only.

**Format requirement (do not drop this):** every spoken line is on its own line
and begins with its own `[mm:ss]` timestamp (relative to the start of the
recording segment), then the speaker, then the text. Team speakers are shown as
`Role (Name)`; the external customer is shown by role only. Unclear audio is
marked `[inaudible]` and removed private or confidential content is `[redacted]`.
Filler words and false starts were removed and grammar was lightly corrected
without changing the meaning.

- Date: 2026-07-03.
- Session length: about 47 minutes in two recording segments (segment 1: Sprint
  Review, demo, and most of the UAT; segment 2: remaining UAT, documentation
  review, and closing). Timestamps restart at the beginning of segment 2.
- Participants: Scrum Master (Maksim), Developer (Aleksandr), Developer
  (Svyatoslav, observing), and the Customer.
- Build demonstrated: v0.3.0 (MVP v2) on the public deployment, version footer
  visible on screen.
- Recording permission: granted.
- Transcript publication permission: granted (for coursework and transcript).

---

## Segment 1 - Sprint Review, live demo, and customer-executed UAT

[00:00] Developer (Aleksandr): Today we will present the sprint increment, ask you to perform some short tasks yourself, and collect your feedback. Before we begin, may we record this session for our coursework? The recording stays private and is shared only with our instructors.
[00:14] Customer: Okay, yes. I allow you to record and transcribe this meeting.
[00:19] Developer (Aleksandr): Thank you. May we publish a cleaned, anonymized English transcript of this meeting in our public repository, as we did for the previous sprints?
[00:32] Customer: Yes.
[00:34] Developer (Aleksandr): Thank you. Today is the Sprint 3 review for Voice Games, Team 40. Present are our Scrum Master Maksim, two developers, Svyatoslav and myself, Aleksandr, and you as the customer.
[00:55] Developer (Aleksandr): Last time you gave us six findings: the app scoring its own voice, uneven recognition between games, Boss Fight difficulty modes, Russian as the default language, jumpy racer movement, and a fun ending for the rocket game. This sprint we delivered all six, plus the last two of the four games you asked for, and the Progress view for parents. This completes MVP v2, released as version 0.3.0 and already live.
[01:32] Developer (Aleksandr): Now I will show milestone 3 on the sprint board. One moment. Is it visible?
[02:01] Scrum Master (Maksim): Yes.
[02:02] Customer: Yes.
[02:03] Developer (Aleksandr): Here is milestone number three. As you can see, it is 100 percent complete. Here are the sprint backlogs, and most importantly, here is the Sprint 3 backlog.
[02:26] Developer (Aleksandr): Now I will show you the version 0.3.0 release page. Here it is. And our live demo.
[02:45] Developer (Aleksandr): I just need to show you that it is actually version 0.3.0 in the footer. The live demonstration itself will be given by Maksim.
[03:06] Developer (Aleksandr): While it is loading: we also published our architecture and process documentation on a public docs site. We can show it at the end if you are curious. Here it is.
[03:20] Customer: Nice.
[03:22] Developer (Aleksandr): And here, as you can see, the interface is Russian by default.
[03:33] Customer: So you added two games, if I am not mistaken?
[03:48] Scrum Master (Maksim): You may have lost the internet connection for a moment.
[03:53] Customer: Okay, maybe. So you have added two more games, right?
[04:01] Scrum Master (Maksim): Yes.
[04:04] Developer (Aleksandr): Yes. Now I will pass the torch to Maksim to show the live demo.
[04:53] Scrum Master (Maksim): Can you see my screen?
[04:54] Customer: Yes.
[04:57] Scrum Master (Maksim): First, the Russian first launch: when you open the app, the UI comes up in Russian. Second, we now have three finite levels in the Boss Fight game: three bosses, five bosses, and ten bosses. If you complete these levels, you unlock the Infinity mode.
[05:44] Customer: Oh yes. A good mechanic.
[05:50] Scrum Master (Maksim): Next, we added two new games: Skate Word and Aste Word Destroyer. Now I will demonstrate the skateboard game.
[06:28] Scrum Master (Maksim): We also fixed the voice recognition and made it stricter, because we had some bugs at the previous review, and we fixed them. For example, you can pick a theme and words like sunset, duck, dolphin, horse. You can also listen to the pronunciation in Russian and in English. And you lose a heart if you do not say anything.
[07:17] Customer: Okay. Does the automated pronunciation trigger the voice recognition now?
[07:30] Scrum Master (Maksim): No, as we tested. We mute the microphone for about 500 milliseconds around the moment the system pronounces the word.
[07:49] Customer: I mean, if I click "listen to the word", will the system assume that I pronounced the word?
[07:59] Scrum Master (Maksim): No, we fixed this issue.
[08:02] Customer: So you fixed it. Okay.
[08:06] Scrum Master (Maksim): Now the second game. It has three levels; I will demonstrate the easy level. You can see the current goals, the current words, and you pronounce them: duck. This is the easy level, you can see it is slow, and you can also play on medium or hard: squirrel, penguin, cat, tiger, sheep, horse, zebra, bear. And you can see the pronunciation.
[09:19] Customer: So the difference between difficulty levels is the speed?
[09:24] Scrum Master (Maksim): Yes. I tried to find the right speed; when I made the game harder, it was too hard for a child.
[09:43] Customer: In the preview I see some asteroids overlap. Will this happen in the real game, so that the child cannot read a word because the words overlap? Or is it just one asteroid?
[10:03] Scrum Master (Maksim): You can see two asteroids at a time, and two goal words that you can pronounce.
[10:11] Customer: Got it. I mean, can asteroids spawn too close to each other, so that the words overlap and the child cannot see the word?
[10:25] Scrum Master (Maksim): No, not on these difficulty levels. We tuned the game to be nice to play for kids.
[10:41] Scrum Master (Maksim): We also added the changes you asked for at the previous review. In the rocket game we added more levels: you now need to pronounce twenty words correctly; at the previous review it was ten. It makes the game more playable and more interesting.
[11:22] Customer: Yes, a bit more challenging.
[11:27] Scrum Master (Maksim): And when the game ends, you can see an alien in the result view that says hello to the child. I can demonstrate it, but I would need about two minutes to reach that screen.
[11:52] Customer: Okay, we might check it later.
[11:55] Scrum Master (Maksim): And I think that is all for the demonstration.
[12:04] Customer: Okay, you have a Progress button. What is that?
[12:10] Scrum Master (Maksim): Yes, we have a Progress button, where you can see all records, all sessions, and the words the child has already learned. And at the top you can see the top practised words.
[12:35] Customer: Nice. But for this game it shows zero sessions and zero words, while the record is 120. Where did the sessions go? Where did they disappear?
[12:56] Scrum Master (Maksim): Maybe this is from when I played it the last time. [tries the game] Cat. Cat. No, we do have an issue here. Okay, we will find and fix it.
[13:35] Customer: Found the bug. Okay, great.
[13:46] Scrum Master (Maksim): Okay, that closes my demonstration.
[13:49] Customer: Let me look at the progress once more; I did not see all of its parts. Could you please show again the content that opens when you press the Progress button?
[14:14] Scrum Master (Maksim): Here is the Progress button.
[14:17] Customer: Okay. Could you please scroll down? "Top practised words" - so now only "cat" got practised, and it says it was practised one time. Got it.
[14:44] Customer: It seems like the whole progress was overwritten or something, or reopened on another device. Okay, anyway. Can you now export the CSV?
[15:17] Scrum Master (Maksim): One second. Here you can see the table. We can make it more readable in the future, maybe even in the final version.
[15:38] Customer: Pretty good. It just needs splitting into columns: "times struggled" and so on.
[15:47] Customer: So how do you select the next word to show to the kid? Do you use these statistics, like "times struggled", for suggesting the next word?
[16:15] Scrum Master (Maksim): Maybe I do not get the question, can you please rephrase?
[16:19] Developer (Aleksandr): No, we do not.
[16:23] Customer: If the child does not struggle with pronouncing a word, you do not need to show this word to the child in the game. So basically you should choose the words that the child struggles with the most, or the words they have not yet seen at all. Do you use these recorded statistics when selecting the words to show to the child?
[16:53] Scrum Master (Maksim): You mean show the most complex words for the child?
[17:08] Customer: The ones they struggled with the most, so that they learn those words as soon as possible.
[17:15] Scrum Master (Maksim): So, make another table, like the top words the child needs to learn better?
[17:29] Customer: Yes, like this. But basically you should use it in the games, not only in the CSV. You have this bank of words, and you need some algorithm for selecting the words to show to the child in the game. They should not be just random words from the bank; the selection should help the child learn: repeat the words the child struggled with, or, if there are no such words, go to new words - or sometimes show new words and sometimes the words the child struggles with. But do not show the words the child already knows really well very often.
[18:24] Scrum Master (Maksim): Okay. We will add it in all games in the final version, I think. It is a good feature. For example, the child plays Boss Fight with the fruits word base for a long time and pronounces the word "apple" ten times correctly - then we need to show the word "apple" less often than the other words.
[19:03] Customer: Yes, exactly.
[19:06] Developer (Aleksandr): Okay, great.
[19:10] Scrum Master (Maksim): We will make this feature in the next version. And now I pass the torch back to Aleksandr.
[19:21] Developer (Aleksandr): Now we would like to ask you to open the demo and do some tests for us, if you do not mind.
[19:31] Customer: Okay. So I need to open it in Chrome and share the screen, right?
[19:40] Developer (Aleksandr): Yes.
[19:44] Scrum Master (Maksim): For GitHub Pages some regions need a VPN to open it; we also deployed the build on an Innopolis university VM that you can use if the page does not load.
[20:10] Customer: Actually, GitHub Pages works for me now, and I see all the games. Do you see the screen?
[20:21] Developer (Aleksandr): Yes. First, can you please go to Skate Word and pronounce some words - just to check that the game works correctly?
[20:32] Customer: I will try the sunset theme with long phrases. Hello? Okay. Is it paused or is it not?
[20:48] Developer (Aleksandr): It is paused.
[20:53] Customer: "An apple a day keeps the doctor away." "The quick brown fox jumps over the lazy dog." "Can you please help me with this?" Nice. "Let us read the story before going to sleep."
[21:20] Scrum Master (Maksim): "A story"? No, not "story".
[21:25] Customer: Okay. "Can you please help me with this?" "An apple a day keeps the doctor away." "Brave explorers are not afraid of the dark." Okay, it seems to work.
[21:50] Customer: The guy does not actually roll over the road, he rather flies over it. Is it a planned thing?
[22:01] Developer (Aleksandr): It's magic. We will probably lower him.
[22:08] Customer: Okay. And he also jumps onto the obstacle just as it disappears. Maybe he should jump over the obstacle, like the dinosaur in Chrome.
[22:22] Developer (Aleksandr): Yes, we will fix the trajectory of the jump.
[22:29] Developer (Aleksandr): Okay. Please return to the hub and play Aste Word Destroyer.
[22:38] Customer: Okay. Let's go supernova. Easy, short phrases. "You're welcome." "How are you?" - I think this one should be shown in Russian too. "Good morning." "Have a nice day." "You're welcome." Okay, the score increases.
[23:47] Customer: Okay, so this is an infinite game, right?
[23:52] Developer (Aleksandr): Yes, until you lose all your hearts.
[24:03] Scrum Master (Maksim): You can also go back to the hub - the record is still seven, for example.
[24:13] Customer: Let me see. Yes, the record is still seven. What about the Progress view here - okay, the record is seven here too, the records stay. Have I played before? Maybe last time. Okay, anyway.
[24:41] Developer (Aleksandr): Okay, now from the hub press Play on Boss Fight. On the setup screen, select a finite mode - ten bosses is the fastest - and start the fight.
[25:02] Customer: Finite - ten bosses is too much, let me select three bosses.
[25:10] Customer: Okay, let's test long phrases. "I am ready to fly my rocket into deep space." "An apple a day keeps the doctor away." "The weather is beautiful today." "My favorite color is bright blue." "I love playing educational voice games." "Can you please help me with this?" "Brave explorers are not afraid of the dark."
[26:04] Customer: I think the boss does not suffer enough - it looks really happy. "The quick brown fox jumps over the lazy dog." "Practice makes perfect in language learning." Nice. Okay, I killed one boss. This is boss two out of three.
[26:32] Customer: What is this hit counter? Is it like nine? Nine hits?
[26:40] Developer (Aleksandr): Yes, nine hits.
[26:42] Customer: Nine hits in total, or remaining to kill this boss? Slightly confusing.
[26:56] Developer (Aleksandr): Can you check it - just select fruits, for example, and try to hit.
[27:06] Customer: Okay, let's check. Okay, zero. "Plum."
[27:15] Developer (Aleksandr): Yes, it is how many times you hit.
[27:20] Customer: Okay. Maybe increase the font a bit, because it is not clearly visible - you have a lot of space here.
[27:29] Developer (Aleksandr): Yes, okay.
[27:31] Customer: "Pomegranate." "Grape." "Plum." "Orange." "Tangerine." "Strawberry." "Raspberry." "Tangerine." "Orange." "Apricot." Okay. So here is my health, and here is the enemy's health.
[28:06] Developer (Aleksandr): Yes.
[28:12] Customer: And what is this? What does this mean?
[28:21] Scrum Master (Maksim): You fight with the current boss; it changes every time you get to another boss.
[28:34] Customer: Really? Okay. I mean, do I really need to see this progress bar? I see the health bar over the boss all the time. "Apple." "Apple." And I see the health changing there, so maybe I do not need to see this exact health bar a second time.
[29:10] Developer (Aleksandr): I think it is there so that the kids can understand it: an unnamed bar over the boss alone would probably not be enough to communicate to kids that this is the health bar and that they need to deplete it. So the second, labeled health bar above our HP reinforces it: when you hit the boss, it clearly shows that the health depletes.
[29:47] Customer: Okay, maybe you are right. I have not played many kids' games, and I am not sure whether duplicating it is worth it.

## Segment 2 - remaining UAT, documentation review, and closing

[00:00] Customer: The health indicator could also be put on top of the knight; it would just save some space. I am not sure about the UX, but I think there is a kind of duplication here. If you think about how it can be improved, or whether it should stay as it is, that would be nice.
[00:32] Developer (Aleksandr): Okay, I will think about it.
[00:34] Customer: Okay, thank you.
[00:38] Developer (Aleksandr): Now let's see the child's progress. From the hub, open the Progress view - we already did that - so reload the page and open it again.
[00:50] Customer: Okay. Some layout quirks here. Okay. Looks like it remembers something - those are the games I played. Yes, it did remember.
[01:00] Developer (Aleksandr): Yes, and the counters issue we already figured out earlier.
[01:22] Developer (Aleksandr): Okay. "Russian interface by default" is already confirmed - everyone could see it. And also: you can start any game and press the "hear it" control while the microphone is live.
[01:42] Customer: I did not get it.
[01:43] Developer (Aleksandr): No self-scoring: nothing should be scored when you press the "hear it" button.
[01:51] Customer: Where did we observe it last time?
[01:58] Developer (Aleksandr): The rocket game was pretty guilty of that.
[02:03] Customer: Let's see. Okay, animals. So I cannot listen to the English word here?
[02:31] Scrum Master (Maksim): You can - press the Help button.
[02:38] Customer: "Dog." Ah, it is "lion". And as you can see, it does not recognize the app's voice as my pronunciation. Okay.
[02:55] Customer: That's it for me on this one.
[03:00] Customer: I think this "Help" should be renamed to "EN", or a flag of Britain, or something like that.
[03:11] Developer (Aleksandr): Yes.
[03:12] Scrum Master (Maksim): For the final release we want to bring all games to one interface, where the child can hear all words with one button - one consistent control for all games. Because right now every game has its own interface, as you can see, with some differences. In the final version the games will share one interface, so that a child can clearly play them.
[04:00] Customer: Okay. Hopefully this will help the child play. But I am not sure it will work for all games - whether you can find such a consistent interface, since the word may be an element of the game itself.
[04:27] Scrum Master (Maksim): I am talking about the Help button, for example: the Help button exists only in this game, while in another game you can just click on the word and it is pronounced. We could, for example, remove the Help button and make a pronounce button everywhere. Tell us which one you like more: clicking on the word, or a separate pronounce button?
[05:17] Customer: Okay. The approach with buttons separate from the words is more explicit and maybe more understandable. But the more compact version, I think, is when you make the word itself a button, and the child can just press the word to listen to it. And this can still be a consistent approach in many games. It may not work in some games, like the asteroid game: if the child plays and wants to listen to the word on an asteroid, they need to click that word - will they have enough time to click it? Not sure. Maybe there should be some separate control to listen to the word, like you did here.
[06:23] Developer (Aleksandr): What you propose raises another problem, especially in Aste Word Destroyer: there is no translation there. So you could click the asteroid and hear the word, in the future, probably. But with the translation the problem is where to put it.
[06:44] Customer: Yes. I mean, you can put the translation just under the English word, but it will take more space. So I think the current interface is pretty good for this game and convenient: I see all the words that I can target, I see their translations, and I can also listen to those words. For an interface where you just click the word and listen to it, you could remove those buttons and embed them into the word and the translation. I am not sure it will be more user friendly than it is now, but it is a way to go.
[07:46] Customer: I mean, you can have a big button here - "cat", for example - and a big button here - "koshka" - and they look like buttons; and if the child presses the button, the word plays. Something like this.
[08:03] Developer (Aleksandr): Okay. We will think about it in the future.
[08:06] Customer: Yes, thank you. I am not ready to give you a final answer on how to make it best. But thank you for accepting the feedback.
[08:25] Scrum Master (Maksim): Now some quality and architecture evidence - briefly, what we changed. Can you stop your screen sharing? I need to show you some things.
[08:36] Customer: Yes, sure.
[08:42] Scrum Master (Maksim): First, in this sprint we added two games and shipped our new voice recognition matching - we fixed it, and it no longer accepts wrong words. Second, we added our architecture diagrams and process documentation to our public docs site and to the repository. For example, here is the dynamic view, our sequence diagram: when the child pronounces a word, it goes to the speech recognition in the Chrome browser, then to our code - the useVoiceGame hook and engine.ts, where the game decides whether the word is right or not - then to the game component in our six games, and then all the results go to progress.ts and to the result view.
[10:18] Scrum Master (Maksim): The second diagram is our deployment diagram. Our GitHub repo always runs GitHub CI: type checks, tests, builds, Lighthouse - and if something goes wrong, the build does not reach the hosting. The built games go to GitHub Pages and also to our Innopolis VM, and from there to the child's device, where we have the Web Speech API and so on.
[11:10] Scrum Master (Maksim): And we have a third diagram, the static view - how the app is built: App.tsx, which is our menu with the interface and language buttons; the game components with the code for all games; our voice module; and the logic and data used in the games. Then it goes to the browser platform - Web Speech and canvas - and is shown on the child's screen. All these diagrams are on our docs site, which the assignment requires. Here you can see the diagrams, for example our static view.
[12:14] Customer: A couple of comments. In the static diagram, why are there arrows? What do they show? Do you provide a legend for the diagram that explains what is happening on the diagram?
[12:38] Scrum Master (Maksim): We briefly explain the responsibility of each component in the documentation.
[12:48] Customer: Yes, but what happens on the diagram itself: what is a rectangle, what is an arrow? If you use this kind of diagram, it is a slightly non-standard one, so it is not UML - UML is a specified language for describing diagrams. This one is Mermaid, I guess?
[13:19] Scrum Master (Maksim): Yes.
[13:19] Customer: Then you should at least put a link to the Mermaid docs that explain what each element of the diagram means, if they explain that - or you should specify it yourself: a gray rectangle is a device, or a deployment site, and so on.
[13:45] Scrum Master (Maksim): Okay, I get it. We will make it like this.
[14:07] Customer: Another comment is about the HTTP request. I think the arrow should be reversed: it is the child's device that makes the request. Maybe you wanted to show something else, but it was not very clear from the diagram.
[14:36] Scrum Master (Maksim): You mean this arrow, at the bottom?
[14:45] Customer: Yes. We are looking at this diagram, and there is an arrow "HTTPS GET", and it goes from GitHub Pages to the child's device. But the child's device is a client for GitHub Pages; GitHub Pages is a server. So what does this arrow mean? The request is initiated by the client, it goes from the client.
[15:23] Scrum Master (Maksim): Okay, I will rectify this issue.
[15:46] Customer: Yes. Or maybe you should say that it is, for example, the app that GitHub Pages provides to the child's device - then the arrow would be more understandable. But in general it is better to explain what the components on your diagram mean.
[16:17] Scrum Master (Maksim): Okay. Thank you for the review.
[16:32] Scrum Master (Maksim): The next version, the final version, will be in the next sprint, as I understand.
[16:39] Customer: Yes, the final version, and it should be ready by the demo day - I mean, by the end of the week preceding the demo day. So by the 19th of July; you have two weeks to make it.
[16:58] Scrum Master (Maksim): Okay. We will add four games in these two weeks and rectify some issues. Okay, that's all. Thank you for the review. Goodbye.
[17:13] Customer: Yes, thank you for your work. I like working with you. Goodbye.
