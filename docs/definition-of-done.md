# Definition of Done (Team 40)

A Product Backlog Item (user story or supporting PBI) is **Done** only when all of the
following are true. This is the team's shared quality bar, first agreed for Assignment 3,
extended in Assignment 4 with automated quality gates, and extended in
Assignment 5 with the architecture documentation gate. It applies from Sprint 1 onward
and stays in force for later sprints unless a later requirement explicitly supersedes it.

1. All of the item's **acceptance criteria** are met and manually verified in Google Chrome
   (the only supported browser for the Web Speech API).
2. Code is committed on a branch named after the issue (`<issue#>-short-desc`) and merged
   through a **pull request linked to the issue** (`Closes #n`).
3. The PR is **reviewed and approved by a different team member** - no self-approval.
4. The **CI checks required for the product stack pass** on the PR: TypeScript type check,
   production build, the full automated test suite, and the Lighthouse accessibility QA
   check. There are **no console errors** during the covered flow.
5. **Relevant automated tests exist** for new product logic (unit tests), and **important
   component interactions have integration tests**.
6. **Relevant automated quality requirement tests (QRTs) pass** for any quality requirement
   the change affects (see `docs/quality-requirement-tests.md`).
7. **Critical modules keep at least 30 percent automated line coverage**, enforced by the
   per-file thresholds in `vitest.config.ts`. Global coverage may be lower with the
   explanation recorded in `docs/testing.md`.
8. **Testing evidence is preserved** in the PR, in CI, or in linked documentation (test
   output, coverage report, or CI run link).
9. The branch is merged into `main` via the **protected merge-commit workflow**
   (one required approval, no force-push).
10. Any **user-facing change is recorded in `CHANGELOG.md`** under the right version.
11. Any new behavior is reflected in the relevant docs (`docs/user-stories.md`,
    `docs/roadmap.md`, and the quality docs when applicable) and the issue is moved to
    **Work Status = Done**.
12. Any change that alters a **component boundary, a runtime flow, or the deployment
    shape updates the architecture documentation** (`docs/architecture/` views), and any
    significant design decision or a reversal of one is recorded as an **ADR** in
    `docs/architecture/adr/`.

If later project work changes the product stack, quality requirements, critical modules, or
CI configuration, this Definition of Done and the testing evidence are updated to match
instead of leaving these gates stale.

## Story point scale

Relative Fibonacci sizing: **1, 2, 3, 5, 8, 13**.
- 1 = trivial copy/config change.
- 3 = a small, self-contained feature.
- 8 = a full game-loop feature spanning canvas + voice + state.
- 13 = a large, multi-mode feature that should usually be split before a sprint.
