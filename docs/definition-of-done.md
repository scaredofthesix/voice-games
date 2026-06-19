# Definition of Done (Team 40)

A Product Backlog Item (user story or supporting PBI) is **Done** only when all of the
following are true. This is the team's shared quality bar, agreed for Assignment 3 and
applied from Sprint 1 onward.

1. All of the item's **acceptance criteria** are met and manually verified in Google Chrome
   (the only supported browser for the Web Speech API).
2. Code is committed on a branch named after the issue (`<issue#>-short-desc`) and merged
   through a **pull request linked to the issue** (`Closes #n`).
3. The PR is **reviewed and approved by a different team member** - no self-approval.
4. `npm run build` passes and there are **no console errors** during the covered flow.
5. The branch is merged into `main` via the **protected merge-commit workflow**
   (one required approval, no force-push).
6. Any **user-facing change is recorded in `CHANGELOG.md`** under the right version.
7. Any new behavior is reflected in the relevant docs (`docs/user-stories.md`,
   `docs/roadmap.md`) and the issue is moved to **Work Status = Done**.

## Story point scale

Relative Fibonacci sizing: **1, 2, 3, 5, 8, 13**.
- 1 = trivial copy/config change.
- 3 = a small, self-contained feature.
- 8 = a full game-loop feature spanning canvas + voice + state.
- 13 = a large, multi-mode feature that should usually be split before a sprint.
