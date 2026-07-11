# Week 6 LLM Usage Report - Team 40

Covers Sprint 4 backlog planning, code implementation, release preparation, and the Week 6
report-writing work, all completed ahead of the 2026-07-12 submission.

## Tools used

- Claude (Anthropic), via an agentic coding assistant (Claude Code), used throughout Sprint 4
  for backlog planning, implementation of the six Sprint 4 fix/feature issues, release
  preparation, and this report set.
- Codex, used by team members for parts of the Sprint 4 game-polish and release-prep work
  (PRs #137, #138, #139), the final Week 6 compliance audit, evidence reconciliation,
  Project board update, and corrective `v0.4.1` release preparation alongside Claude Code.
  Both tools follow the same repository conventions.

## How it was used

- Auditing the repository state against the Assignment 6 requirements: comparing what had
  already shipped (four new games merged directly by teammates) against what the customer's
  Sprint 3 review feedback still required.
- Backlog grooming: creating the Sprint 4 and Sprint 5 GitHub milestones, assigning
  implementer/reviewer/story points/acceptance criteria to the seven open feedback issues,
  and updating the GitHub Project board's Sprint field (including safely working around a
  known GitHub API behavior where adding options to a single-select field regenerates all
  option IDs and can wipe existing item assignments - handled with a snapshot-then-restore
  procedure, verified afterward).
- Drafting `docs/customer-handover.md`, `CONTRIBUTING.md`, `AGENTS.md`, and the README
  refresh, based on the actual current state of the repository (config, secrets handling,
  deployment paths, ownership) rather than assumptions.
- Implementing issues #103, #105, #106, #107, #108, #109 end to end (branch, fix, local
  verification, PR), and preparing the `v0.4.0` release (tag, GitHub Release, `CHANGELOG.md`
  update).
- Turning the Week 6 customer interview transcript into the Sprint 5 backlog: reading the
  full transcript, mapping every distinct feedback point to a new tracked issue (#140-#146)
  in the Sprint 5 milestone, without inventing scope the customer did not actually raise.
- Auditing the Sprint 4 PR history (via the GitHub CLI) for this report's contribution
  traceability table and retrospective, which surfaced a real process gap: PR #128 (adaptive
  word selection) had a review requested but never submitted, and was merged by its own
  author.
- Running the final Week 6 compliance audit, correcting report counts and links, adding
  missing Project board metadata, removing exact public transcript timecodes, closing
  completed milestones, and preparing the reviewed `v0.4.1` corrective release (#150).
- Drafting `reports/week6/sprint-review-transcript.md`, `sprint-review-summary.md`,
  `reflection.md`, `retrospective.md`, and this file, and updating
  `docs/customer-handover.md`'s status table from the actual meeting outcome.

## Human oversight

- The team's actual Sprint 3 customer feedback (issues #103-#109), the Week 6 interview
  content, and the resulting Sprint 4/5 scope decisions are the customer's and team's, not
  the assistant's; the assistant organized and documented them.
- Every fact stated in `docs/customer-handover.md` (no secrets required, what's tracked vs.
  gitignored, VM/repo ownership, the Week 6 handover-status update) was verified against the
  actual repository content or the session transcript before being written down.
- The transcript published in `reports/week6/sprint-review-transcript.md` is reproduced from
  the customer-approved clean transcript; no quotes, decisions, or UAT outcomes were invented
  or altered.
- All generated code changes were verified locally (`npm run lint`, `npx vitest run`,
  `npm run build`) and via CI before merge; this report's claims about test counts (99
  tests, 13 files) and CI status were checked against the current `main` branch, not assumed.

## Limitations observed

- The assistant cannot independently verify facts that only exist outside the repository and
  transcript, such as which specific team members attended beyond the transcript's generic
  "Team" label. Unverified external facts are stated as not confirmed rather than guessed.
- The assistant flagged, but did not resolve, the discrepancy between the team's verbal
  TypeScript-version answer in the meeting ("7.0.2") and `package.json` (`~5.8.2`); resolving
  which is correct requires a team decision, tracked as part of issue #146.
- The assistant identified the unreviewed PR #128 from GitHub PR metadata, but getting it
  reviewed by a second person is a human action the assistant cannot perform.
