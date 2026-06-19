# Sprint 1 Review - Customer Meeting Transcript

**Date:** 19 June 2026
**Participants:** Team 40 (Team), Customer

> Published with the customer's permission. Sanitized for readability: the customer's
> personal name is redacted to "Customer", and the conversation is lightly cleaned without
> changing its meaning. The recording is shared privately with instructors via Moodle.

## Part 1: Sprint review

**Team:** Hello, and thank you for joining our sprint review. Today we will show you what we did this sprint, demonstrate the working game, and ask for your feedback.

Before we start, we have a few requests:

1. May we publish a cleaned English transcript of this meeting in our public repository?
2. May we record this meeting? It is your decision; we only want to ask.

**Customer:** Yes, that is fine.

**Team:** Thank you. Last time you gave us three main problems, and we fixed all three.

First, Bubble Popper was too fast. The bubbles now rise more slowly, so children can keep up.

Second, the voice recognition often stopped working. It is now more stable and more forgiving for children.

Third, there was an empty placeholder game in the menu. We removed it.

We also started Russian word translations and Russian audio, as you asked. And we set up our team workflow: issues, pull requests, reviews, a changelog, and a roadmap.

### Live demo

**Team:** Now we will show the game live. I will share my screen.

This is the home screen. You can start quickly. (US-01)

Here you choose the game and the word list. (US-02)

Now I play with my voice. I say the word shown on the screen. (US-04 / US-08)

If recognition is not perfect, the child can try again. The child does not lose because of a single mistake.

At the end we see the results screen with the score. (US-07)

Now I will play Bubble Popper so you can see the new, slower speed.

Our plan for this MVP was five stories: start, choose game, voice control, results, and reliable recognition. All five are done and working.

### What we will improve next

**Team:**

- Pause button: a button to pause the game and also stop the microphone. (US-16)
- Russian language: the menu text in Russian, with a language toggle. (US-17)
- Russian translation: show the Russian word under the English word, both clickable for audio. (US-15 / US-09)
- Recognition accuracy: we want to reach about 80 to 90 percent and test it with children's voices.
- Long phrases: show the full sentence at the top and highlight the current word.
- Parent progress: parents can see the child's progress for each word. (US-10)

## Part 2: MVP v2 backlog review

**Customer:** The Russian translation is a should-have. Do you follow?

**Team:** Yes.

**Customer:** Good. Next: "Adjust difficulty level", a could-have. "As a parent, I want to choose a difficulty level so that the challenge fits my child's age and ability." This is more of a could-have. In practice you control the difficulty through the word list: the harder the words they upload, the higher the difficulty.

Next: "Create a custom word list." "As a teacher, I want to define a custom list of words for the game so that practice matches my current lesson vocabulary." I would say "upload" rather than "define" a custom list. And you mentioned built-in categories. Do you have a user story about categories? I don't think you do. Ideally you should, something like: "As a child, I want to play using built-in words without uploading a custom list, so that I can start playing without spending time on setup and without asking my parents for help."

"Review my child's progress." This one is important. "As a parent, I want a dedicated section in the main menu to see which words my child has practiced and how they performed, so that I can support their learning." The single source of truth should track statistics per individual word, pulled across all lists in all games. I agree with that. It could lead to a sub-story such as: "As a teacher, I want to download the word list as a CSV file," so that I can gather statistics for the whole class later and compare performance.

"Hear how the word should sound." I assume the English word. "As a child learner, I want to click a word and hear how it should be pronounced so that I can imitate it correctly." It uses the Web Speech API. I asked that words on the in-game platforms be clickable so children can hear the pronunciation. Yes.

**Team:** This also applies to Russian, because we have it in English now and we will add it in Russian.

**Customer:** Listening to the Russian word is not meant for imitating pronunciation. If we assume the child can already read, they are not training to pronounce Russian words, so they don't need to imitate. So be specific in this user story about which word you mean, English or Russian. You may need two separate user stories. Better to split it as I mentioned.

"Get immediate feedback on each attempt", a should-have. "As a child learner, I want clear feedback showing which words I pronounced correctly or incorrectly, so that I and my parent can see what needs more practice." But the full statistics are already in the main menu. Do I need the game itself to show which words I pronounced incorrectly? Maybe rephrase it to "so that I can immediately practice the words I mispronounced." The "what needs more practice" part for the parent lives in the main menu as aggregated statistics across all games. Here it is more about immediate, in-game feedback. You downgraded this from must to should at the review, since per-word feedback is most valuable to parents. I agree with should-have and with that reasoning.

So what remains? MVP v1: real-time multiplayer Voice Race. "Play on any browser" is a won't-have, right? "Grant microphone access easily" is a must-have. "See the target word clearly" is a must-have.

Now I have a question: why were these must-have user stories not included in MVP v2?

**Team:** Because they are in MVP v1. We closed them. Or should all of MVP v1 also be in MVP v2?

**Customer:** No. Here I filtered out everything except MVP v2 and MVP v1, so now I see user stories that have neither label. Were they included in MVP v1, or did you plan to include them somewhere? Do you see US-05 and US-03?

**Team:** I think we can put them in MVP v2; it could also be MVP v3 or later. We can do them in MVP v2. I'll mark them. US-05 and US-03, yes?

**Customer:** Yes. They had no label and they are must-have, so I wondered why you didn't include them, especially since you included some should-have features in MVP v2. They don't look too hard, so it would be good to include them in MVP v2. So this is your MVP v2 backlog. Then there will be MVP v3, probably about adding games. By the way, in MVP v2 it's better to add a couple of games.

**Team:** Okay. Two games, or more?

**Customer:** Let's see. It's June, so you have about a month to finish the project. You've implemented two games, so you need about four more. At two games per week, that pace should be enough. You could also add three games to leave more time at the end to polish them: prototype or write more games early, then polish each week. We haven't set the MVP v2 deadline yet. If it's in two weeks, aim for four games; if it's in one week, two games is fine. Let's keep it at four for now, in case it's two weeks.

**Team:** Okay, it's not hard anyway.

**Customer:** Good. If the deadline shifts, we can discuss reducing the number of games. That covers the user stories. Anything else you'd like to discuss?

**Team:** I have two questions. First, should we add anything beyond our future plans, in your opinion? Is there something else you'd like to see?

**Customer:** There's one feature I haven't seen that I think we discussed: phrases. I don't think you have a user story for it, right?

**Team:** We discussed it, but we don't have an issue for it yet. I can add it for MVP v2 or v3. We'll add it anyway.

**Customer:** I want this phrase-based mode implemented at some point. You have a list of phrases and their translations. Each phrase can be split into words, and the child pronounces each word separately, or the whole phrase, to advance in the game. The child sees either the English phrase with the Russian translation at the top, plus their progress within the phrase (which words they've already pronounced), or, in a harder version, only the Russian translation, and they have to produce the English phrase to advance. The game doesn't let you advance if you pronounce the phrase incorrectly.

**Team:** So they need to translate the phrase?

**Customer:** Yes, the child translates the phrase from Russian to English without seeing the English version.

**Team:** But our game is only about pronunciation.

**Customer:** Yes, but it's about learning English, and it can be adapted to that. As I mentioned, the game can hint at what to pronounce next. In a Doodle Jump style, some platforms can look "bad" because they contain a wrong word for the phrase. Each platform holds a word, and several platforms together form a phrase. The character jumps from platform to platform and builds the phrase. If a child jumps onto a bad platform, they pronounce the phrase incorrectly. If you show the child the expected sentence in Russian, they can try to translate it into English and pick the platforms with the correct words. They get visual hints (the bad platforms) and semantic hints (knowing the translation, so they select only the good platforms). That's an easy way to adapt a game to Russian-to-English translation. I think that's it.

**Team:** Before we finish, how often will we need to meet online?

**Customer:** Not often. I'll be in Innopolis every week, so we can pick a time during the week, or agree on Fridays for all meetings. I need to charge my phone, please give me a couple of minutes. [aside redacted]

**Team:** We can wrap up; we have no more questions.

**Customer:** One last thing: what game ideas do you have? You may want to discuss them before implementing. Another team created a shared document with game ideas; you could do the same and ask me to comment.

**Team:** We can share ideas in the team chat. Building a game is a long process, so we don't need a weekly meeting for it. If we have ideas, we'll ask you. If anyone has an idea now, they can share it.

**Team:** I have a game idea. There's a prince and some monsters. If the child pronounces a word correctly, the monster loses 1 HP. For example, a boss has 8 HP, so one correct word removes 1 HP. If I don't pronounce the word within 10 seconds, the boss damages me and I lose 1 HP. I start with 3 HP, the boss has 8 HP, so 8 words to kill the boss. A boss-fight game.

**Customer:** That sounds engaging. You could have several monsters attacking the character.

**Team:** Yes, for example four monsters, either sequentially or one by one. Four monsters on screen with four words each, or one monster at a time. I think the sequential version with four words is better.

**Customer:** Yes, and you can make a phrase out of those words.

**Team:** Will it be convenient for you to discuss games in the team chat? We'll send them to our chat.

**Customer:** A shared document is better. Share a Doc and write the descriptions there. We can discuss in the chat, but it's better to record the discussion in the Doc afterward so you don't have to search the chat again. Or we can meet to discuss if you prefer.

**Team:** Okay.

**Customer:** So you need to come up with four game ideas. Please share them when you have them. That's it from my side. Thank you for the meeting.

**Team:** Thanks for the interview.

**Customer:** Goodbye.

**Team:** Bye.
