# Sprint 5 Review summary (Week 7)

**Date:** 2026-07-16 (Sprint 5 review / customer-trial session).

**Attendees:** the customer (product stakeholder), and Team 40 members running the session and
screen-share. Full team attendance is recorded privately in the Week 7 Moodle PDF, per the
assignment's public/private evidence split.

**Format:** one recorded video call covering the Sprint 5 Sprint Review, a customer trial of
the Sprint 5 build, and customer-executed UAT (UAT-10 through UAT-14). See
[`reports/week7/sprint-review-transcript.md`](./sprint-review-transcript.md) for the full
sanitized transcript.

> **Final confirmation pending.** The customer explicitly asked for a second, short MVP v3
> confirmation call after the last fixes land (transcript, `[00:57:32]`-`[00:59:03]`). The
> final customer-confirmation of handover and the customer-executed retests of UAT-12 (Voice
> Maze Quest), UAT-13 (one-failure adaptive selection) and UAT-15 (bulk paste) are recorded
> after that session. This summary does not claim they have happened.

## Agenda (as run)

- Sprint 5 Goal recap and open-question walkthrough.
- Walkthrough of the reworked games: Sentence Bird (push-to-talk), Echo Microphone (memory
  mechanic), and the then-current Magic Wizard.
- Adaptive word selection and custom-vocabulary import demo.
- Customer-executed UAT-10 through UAT-14.
- Navigation / UI consistency and preview localization review.
- README, documentation, and deployment review.
- Arrangement for the final MVP v3 confirmation session.

## What was demonstrated

- Sentence Bird's press-to-speak mechanic, Echo Microphone's hidden-word memory mechanic, and
  the Magic Wizard spell-recipe build (later replaced).
- Adaptive word selection on a small word set, and the custom-vocabulary import flow.
- The ten-game roster with the shared Hub navigation.

## Customer trial / UAT results

Executed live this session (detail in the transcript and in the UAT execution history):

- **UAT-10 (Sentence Bird)** - **Pass.** The customer called the push-to-talk flow "pretty good".
- **UAT-11 (Echo Microphone)** - **Pass with limitation.** Accepted as "basically a pass", but
  the customer observed one false-failure and noted that microphone activation state is not
  always obvious.
- **UAT-12 (Magic Wizard)** - **Obsolete.** Skipped at the team's request; the customer did not
  understand the spell-recipe / cursed-rune mechanic and asked for a simple voice puzzle or
  labyrinth instead. The game was subsequently replaced by Voice Maze Quest, and UAT-12 was
  rewritten around it (retest pending the final session).
- **UAT-13 (Adaptive selection)** - **Rework and retest.** The customer could not clearly see
  prioritization; the team committed to reacting after a single failure (three hearts make
  two-failure waits too slow). Reworked; customer retest pending.
- **UAT-14 (Unified Hub navigation)** - **Pass.** Navigation works; the customer asked that the
  first-generation game layouts be aligned with the newer shared shell.

## Requested changes and resulting decisions

- **Replace Magic Wizard** with a simple voice-controlled puzzle / labyrinth; remove the
  unexplained cursed rune.
- **Remove CSV file import** (fragile across laptops and encodings) and keep the paste-from-Excel
  flow. Confirmed live that the Excel/LibreOffice column separator is a **tab**, and asked that
  a tab be a supported separator so multi-word phrases survive.
- **Adaptive selection must react after one failed or silent attempt.**
- **Unify the first-generation game UI** (Voice Line Racer and the first two games) with the
  newer shared layout and Hub placement.
- **Pin TypeScript to 5.8.3** in `package.json` + lockfile and reconcile the documentation
  (the docs had said 7.0.2).
- **Make deployment truthful:** implement automatic CI deployment (the team committed to it) or
  reword the README to manual.
- **README:** reorder the gameplay steps, show the game result before overall progress with a
  screenshot, and present the custom-word path earlier. Direct game links from screenshots are
  a could-have, not a blocker.

Localized previews and the overall README/documentation structure were **accepted**.

## Status against the requests

All of the above were implemented and merged to `main` during Sprint 5 (see
[`reports/week7/README.md`](./README.md) for the feedback-to-issue/PR mapping). What remains is
the customer's own final confirmation and the three UAT retests, scheduled for the short
follow-up call.

## Decisions and approvals

- The customer **approved the other nine games** in this session ("I consider them approved").
- The customer agreed to a **final short MVP v3 confirmation call** to test the last changes
  directly before final acceptance.
- Repository ownership, GitHub Pages hosting, and CI/CD stay with the team; the customer does
  not need write access (carried over, unchanged from Week 6).

## Risks and open items carried to final delivery

- Final customer confirmation of the handover level and the UAT-12/13/15 retests are still
  outstanding and depend on the follow-up call.
- The MVP v3 SemVer release is not yet cut; it is cut after the confirmation call and the public
  demo video, so the release can link both.
