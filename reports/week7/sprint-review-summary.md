# Sprint 5 Review summary (Week 7)

Sprint 5 used two recorded customer sessions: the Sprint Review and trial on 2026-07-16,
followed by the final-candidate review and remaining UAT retests on 2026-07-17. Customer
identity and full attendance evidence remain in the private Week 7 Moodle submission.

## Sprint Review and customer trial, 2026-07-16

The session covered the Sprint 5 Goal, the Week 6 follow-up work, the ten-game roster,
documentation and deployment readiness, and customer-executed UAT-10 through UAT-14. The
[sanitized public transcript](./sprint-review-transcript.md) records this session.

- **UAT-10, Sentence Bird:** Pass. The explicit push-to-talk flow addressed the Week 6 issue.
- **UAT-11, Echo Microphone:** Pass with a browser speech-recognition limitation. The restored
  hidden-card memory mechanic was accepted.
- **UAT-12, Magic Wizard:** Obsolete. The customer requested a simpler voice puzzle or
  labyrinth, so the spell-recipe mechanic was replaced by Voice Maze Quest.
- **UAT-13, adaptive selection:** Rework and retest. The customer asked the scheduler to react
  after one failed or silent attempt.
- **UAT-14, shared Hub:** Pass. Navigation worked, with further UI consistency requested for
  the oldest games.

The same session confirmed the decision to keep paste-based custom vocabulary, support a real
tab separator, pin TypeScript 5.8.3, make GitHub Pages deployment automatic, and improve the
README ordering. These requests were implemented before the follow-up review.

## Final-candidate review and UAT retests, 2026-07-17

The customer reviewed Voice Maze Quest, adaptive word selection, the shared Hub, custom
vocabulary, Progress, Clear Progress, English and Russian playback, and the result screen in
Google Chrome.

- **UAT-12, Voice Maze Quest:** Pass. Route movement, visited rooms, the avoidable hazard,
  crystals, the portal, the next random floor, results, and Progress were exercised.
- **UAT-13, adaptive selection:** Pass. Failed or unrecognized words returned after a short
  interval while new words remained available.
- **UAT-14, shared Hub:** Already passed and remained correct.
- **UAT-15, bulk custom-word paste:** Pass with small usability follow-up. Tab and four-space
  rows were accepted, three spaces were rejected, and duplicate words were not saved.
- Progress totals and Clear Progress continued to work.

## Final follow-up requested before release

- Prevent one accepted speech event from completing two consecutive identical prompts.
- Make 5x5 the default maze and preserve the user's selected maze size.
- Keep invalid and duplicate bulk-input rows visible with a correction reason.
- Recommend Google Sheets and document the exact tab or four-space formats.
- Keep the available maze words below the map and make long route phrases readable.
- Tell users to speak slowly and clearly and wait for each word to be processed.

The customer accepted the current browser speech-to-text limitations for MVP3. Replacing the
speech engine, manual word entry during play, and Skip, Report, or Reroll controls were not
approved as release requirements.

## Acceptance and release status

The final follow-up fixes are implemented in the `v0.5.0` build. They were independently
reviewed in PR #167, merged to protected `main`, and deployed successfully. The customer
explicitly agreed to send a short Telegram acceptance confirmation after receiving and
checking the final release link. Until that release exists and the written reply is received,
the handover level remains **Ready for independent use** and the confirmation status remains
**Accepted with follow-up items**.

The [public sanitized MVP3 gameplay demo](https://disk.yandex.ru/i/xfaSgCVd2CijnA) was
published after the session. It demonstrates the final reviewed build but is not customer
acceptance evidence.
