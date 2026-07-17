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

In the Sprint 5 review the customer approved nine of the ten games outright and accepted the
tenth slot once it became a simple maze. The remaining questions were about polish and clarity
(microphone-activation cues, first-generation UI consistency), not about whether the product is
useful. The customer's own framing - "this is a normal working process, thank you for
implementing all the games" - is the signal we care about: the product is something they are
willing to keep. The final confirmation call will turn that into an explicit handover-level and
acceptance statement.

## Final delivery of MVP v3

MVP v3's code is complete and deployed; what remains is process and evidence, not product: the
customer's final confirmation, the three UAT retests, the public demo video, and cutting the
SemVer release that ties them together. We deliberately did not cut the release or claim
acceptance early - a maintained product's final report is only worth what its evidence is, and
inventing a confirmation we do not have would undermine exactly the trust the rest of the sprint
was spent building.
