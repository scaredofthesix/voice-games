# Customer Review Summary - Week 4 (Team 40)

Public sanitized summary of the Sprint 2 customer review and UAT session. Private
customer details are kept out of this file; they belong only in the Moodle PDF.

- **Date:** 2026-06-27.
- **Participants / roles:** Team 40 - Product Owner (Marat) and Scrum Master
  (Maxim) presented; the Customer attended and executed the UAT. The session ran
  as one recorded meeting (Sprint Review, a short recess, then UAT), which the
  assignment allows.
- **Sprint Goal reviewed:** Strengthen product quality and customer value by
  adding two requested games and putting automated quality gates (tests, QRTs,
  coverage, CI, accessibility) in place that govern later work.

## Delivered increment discussed

- Boss Fight and Voice Rocket Climb games, played live from the public deployment
  (the live build is v0.2.1).
- Per-game visual theme pickers with a pre-game preview, the RU/EN bilingual
  interface, model pronunciation audio (English and Russian), Pause in every
  game, and the new Short / Long phrase vocabulary sets.
- The automated quality foundation: tests, quality requirements and QRTs,
  CI gates, and the accessibility audit. Milestone 2 delivered 29 story points.

## UAT results

- Scenarios executed by the customer, in Chrome on the public build:
  UAT-01 (Voice Racer voice control), UAT-02 (Boss Fight), UAT-03 (Voice Rocket
  Climb). See `docs/user-acceptance-tests.md`.
- Passed: all three. Voice control responded in every scenario, the boss fight
  played end to end, and phrase tracking worked well with long sentences.
- Observations raised during testing (logged as defects / enhancements for the
  next release, not blockers to acceptance): the speech engine can self-trigger
  from its own spoken hint (audio-loop false positive); Voice Racer movement
  physics felt random while streaming; English is the default language on launch.

## Quality evidence discussed

- ISO/IEC 25010 quality requirements and their automated tests, critical-module
  coverage, and the CI quality gates that now enforce the Definition of Done.

## Feedback, approvals, and requested changes

- **Approval:** the customer accepted the Sprint 2 increment and confirmed the
  plan of delivering two games per week.
- **Most important feedback points:**
  1. Speech engine self-triggers when the game speaks a hint - fix by muting the
     microphone while text-to-speech plays and / or dropping the auto hint and
     recalibrating the matching tolerance lowered after v0.1.0 ([#81](https://github.com/scaredofthesix/voice-games/issues/81)).
  2. Move core voice processing into a shared module reused by all games for
     uniform accuracy ([#82](https://github.com/scaredofthesix/voice-games/issues/82)).
  3. Replace Boss Fight's infinite loop with finite difficulty stages
     (10 / 20 / 30 words) plus an unlockable Infinite Mode, and document the
     design choice ([#83](https://github.com/scaredofthesix/voice-games/issues/83)).
  4. Default the interface to Russian on launch ([#84](https://github.com/scaredofthesix/voice-games/issues/84)).
  5. Smooth Voice Racer movement physics under streaming ([#85](https://github.com/scaredofthesix/voice-games/issues/85)).
  6. Future polish: an interactive end-of-climb event (meet an alien) in Voice
     Rocket Climb ([#86](https://github.com/scaredofthesix/voice-games/issues/86)).

## Decision on the current release

The demonstrated build, **v0.2.1, is not modified** in response to this review.
All feedback is carried into the **next release** as the resulting backlog
(issues #81 to #86) and reflected in `docs/roadmap.md` and the `[Unreleased]`
section of `CHANGELOG.md`.

## Risks and action points

- Risk: the lowered matching tolerance trades recognition strictness for
  child-friendly acceptance; the audio-loop fix (#81) must keep that balance.
- Action points: triage #81 to #86 into the next sprint; document the Boss Fight
  mode design (#83); confirm headphones / mic-muting guidance for testing.

## Resulting Product Backlog / scope changes

- Six new backlog items created from this review: #81 to #86 (see above), all
  targeted at the next release. No change to the v0.2.1 sprint scope.

## Permissions

- Transcript publication in the public repo: granted (recording and transcript
  approved for the coursework at the start of the meeting).
- Recording permission: granted.
- Private instructor sharing if public publication refused: not needed;
  publication was granted.
