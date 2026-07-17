# Week 7 LLM Usage Report - Team 40

## Tools used

- OpenAI Codex.

## How it was used

- Audited the combined Sprint 5 implementation against the Week 6 issues, maintained UAT
  scenarios, customer-review transcripts, handover requirements, and GitHub workflow rules.
- Helped implement and test the final cross-game speech-recognition gate so one accepted
  browser recognition event cannot complete two consecutive prompts. The implementation stops
  the active recognizer, clears the accepted result, waits briefly, and starts a fresh session.
- Helped make Voice Maze Quest default to 5x5, pass the selected size to the generator, persist
  it across reopening and new floors, and keep larger wrapping route cards below the map.
- Helped refine bulk custom-word paste so only a real tab or exactly four spaces split the two
  columns. Valid rows are saved while invalid and duplicate rows remain editable with a reason.
- Updated the English and Russian interface guidance, README, changelog candidate, maintained
  UAT history, roadmap, handover document, Week 7 report, and Sprint Review summary from the
  real 2026-07-17 customer feedback.
- Reconciled the final-review branch with the already merged PR #166 so its real Sprint 5
  retrospective, reflection, and sanitized 2026-07-16 transcript were preserved instead of
  overwritten.
- Verified the public Yandex Disk demo link through an anonymous HTTP request and the public
  resource API before adding it to customer-facing documentation.
- Assisted with the release-candidate quality gate, including stabilization of two canvas
  frame simulations that were timing-sensitive only under coverage instrumentation. The final
  local run passed TypeScript checking, 172 tests across 23 files, coverage thresholds at
  71.73% statement coverage, and the production build.
- Assisted with issue-linked branch preparation, PR description, and release evidence audit.

## Human oversight and original team work

- Team members conducted the real customer meetings, interpreted product priorities, selected
  the final scope, recorded the public demo, and remain responsible for the Moodle evidence,
  Demo Day materials, independent PR review, merge, release, deployment, and Telegram request.
- Codex worked from repository evidence and the supplied cleaned transcript. It did not invent
  customer quotes, UAT results, rehearsal completion, deployment, or written acceptance.
- A different human team member must review and merge the final PR. Codex neither approves its
  own changes nor bypasses the protected-branch workflow.

## Limitations observed

- Automated speech tests use the repository's mocked Web Speech API. They verify event
  consumption and game state but cannot measure the accuracy of Chrome's external
  speech-to-text service.
- The public gameplay demo shows the release candidate, but it is not evidence of customer
  acceptance or customer-side deployment.
- Week 7 rehearsal completion and the customer's final written Telegram confirmation remain
  separate human evidence and are not inferred from code, tests, or the demo video.
