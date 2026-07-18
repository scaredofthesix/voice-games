# Week 7 reflection (Team 40)

## What we learned from follow-up maintenance

Sprint 5 was almost entirely maintenance and reconciliation, not new features, and that turned
out to be the harder kind of sprint to do honestly. The valuable work was closing the gap
between what the documentation *claimed* and what the product *did*: the TypeScript version, the
"automatic deployment" statement, the CSV-vs-paste story, and the README's progress
instructions were each individually small, but together they were the difference between a
handover a stranger can trust and one they cannot. The lesson is that for a maintained,
handed-over product, "the docs match reality" is a feature in its own right, and it decays every
time the code changes without the docs following.

## What we learned from final transition work

Replacing Magic Wizard with Voice Maze Quest confirmed the customer's earlier point: a smaller,
finished mechanic that a child understands from the first screen beats a larger, cleverer one
that needs the team standing next to the player to explain it. We had defended the spell-recipe
idea; the customer did not reject it because it was bad, but because nobody could tell what to
do without us. Building the simplest complete version first would have saved a whole redesign
round.

## Customer usefulness feedback

In the Sprint 5 review the customer approved nine of the ten games outright, then passed the
revised maze, adaptive-selection, and bulk-paste UAT scenarios in the 2026-07-17 follow-up.
The remaining requests were small release-polish items, not a new product direction. This
supports the **Ready for independent use** handover level. After the final `v0.5.0` release
and live product links were sent, the customer confirmed acceptance in writing on 2026-07-17,
so the confirmation status is now **Accepted** while the handover level stays **Ready for
independent use**, since no customer-side deployment was demonstrated.

## Final delivery of MVP v3

The three remaining UAT retests passed, the final review fixes are implemented in the
`v0.5.0` build, and the public sanitized demo is available. PR #167 then received independent
review, merged to protected `main`, and deployed successfully. The release-preparation PR was
approved, the resulting protected `main` commit was tagged, and the final `v0.5.0` SemVer
release is now public. Its link was sent to the customer, who replied with written acceptance
on 2026-07-17. We deliberately did not claim written acceptance before it existed: a maintained
product's final report is only worth what its evidence supports, and the acceptance status was
updated only once the customer's written reply was in hand.
