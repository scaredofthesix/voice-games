# Week 6 LLM Usage Report - Team 40

> **Status: IN PROGRESS.** Covers Sprint 4 planning and documentation work so far; will be
> extended as the rest of Sprint 4 (issues #103, #105, #106, #107, #108, #109) is
> implemented.

## Tools used

- Claude (Anthropic), via an agentic coding assistant (Claude Code), used for Sprint 4
  backlog planning and the handover-documentation work.

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
- Drafting `docs/roadmap.md` updates and this report scaffold.

## Human oversight

- The team's actual Sprint 3 customer feedback (issues #103-#109) and the resulting Sprint
  4/5 scope decisions are the customer's and team's, not the assistant's; the assistant
  organized and documented them.
- Every fact stated in `docs/customer-handover.md` (no secrets required, what's tracked vs.
  gitignored, VM/repo ownership) was verified against the actual repository content before
  being written down, rather than assumed.
- The handover level and customer-confirmation status in `docs/customer-handover.md` are
  explicitly marked as pending the real Week 6 customer meeting - not filled with a guessed
  answer.
- All generated changes were verified locally (`npm run lint`, `npm test`, `npm run build`)
  and via CI before merge.

## Limitations observed

_TODO - to be extended once the Sprint 4 code changes are implemented._
