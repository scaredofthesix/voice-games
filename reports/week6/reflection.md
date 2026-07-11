# Week 6 reflection (Team 40)

## What we learned from the trial release

Bundling the last four games' polish into single-branch PRs (#137 for the cross-game UI
pass, #138/#139 for the release-prep and physics refactor) kept Sprint 4 mergeable without
waiting on five separate reviews, which mattered because the milestone deadline and the
customer meeting both fell on the same week. The tradeoff showed up during the meeting
itself: bugs in Sentence Bird, Echo Microphone, and Magic Wizard that unit tests did not
catch (continuous-listening false positives, a display regression, hitbox issues) only
surfaced once the customer actually played the games live. Automated tests verify mechanics
in isolation; they do not catch a UX flow that only breaks under real, imperfect speech
input.

## What we learned from the documentation review

The customer's README feedback was almost entirely about audience separation, not content
accuracy: the existing README already had the right facts, but mixed product-facing and
developer-facing information in one flat document, buried the live-product link, and carried
coursework-specific wording ("Assignment 6", "Sprint 3") that does not belong in a document a
future non-team maintainer would read. The requested fix (product-first ordering, screenshots
near the top, a "For Developers" section) is a restructuring task, not new writing. This is a
useful signal for the rest of the course: a technically correct README can still fail as a
handover artifact if it is organized around what the team wrote first rather than what a
reader needs first.

## What we learned from the Week 6 customer meeting

The customer's process question, whether the team tracks who is accountable for an issue's
overall success separately from who implements a linked pull request, exposed a real gap:
the team's current workflow ties review to individual PRs, which breaks down for any issue
that needs more than one PR to close. This did not affect Sprint 4's actual delivery, but it
is a concrete process improvement for any project that continues past this course.

The adaptive-word-selection discussion (UAT-13) also revealed a communication gap between the
team and the feature's actual state: the team could not confirm live whether the
customer's top Sprint 3 request behaves dynamically within a single round, despite it being
the headline feature of the trial release. Demonstrating a feature is not the same as having
verified its exact behavior against the customer's specific acceptance criteria.

## Transition blockers discovered

- Whether adaptive word selection updates within a round, not just between rounds, is
  unverified and blocks confidently claiming the customer's main Sprint 3 ask is complete.
- Three games (Sentence Bird, Echo Microphone, Magic Wizard) have customer-confirmed defects
  or design issues that would make an independent user's first experience worse than the
  older six games.
- The README/CONTRIBUTING/AGENTS document set needs restructuring, and the TypeScript
  version claimed verbally does not match `package.json`, so the handover documentation is
  not yet reconciled with the actual repository state.
- None of these block the Week 6 trial release itself; they are the confirmed Sprint 5 scope
  needed before the customer can be asked to confirm final transition in Week 7.
</content>
