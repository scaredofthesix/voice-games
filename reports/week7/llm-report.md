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
- Updated the English and Russian interface guidance, README, dated changelog entry, maintained
  UAT history, roadmap, handover document, Week 7 report, and Sprint Review summary from the
  real 2026-07-17 customer feedback.
- Reconciled the final-review branch with the already merged PR #166 so its real Sprint 5
  retrospective, reflection, and sanitized 2026-07-16 transcript were preserved instead of
  overwritten.
- Verified the public Yandex Disk demo through an anonymous HTTP request, the public resource
  API, video metadata, and five sampled frames across its 1:52.5 duration before adding it to
  customer-facing documentation. The sampled frames showed product gameplay only.
- Assisted with the release quality gate, including stabilization of two canvas
  frame simulations that were timing-sensitive only under coverage instrumentation. The final
  local run passed TypeScript checking, 172 tests across 23 files, coverage thresholds at
  71.73% statement coverage, and the production build.
- Assisted with issue-linked branch preparation, PR description, release evidence audit, and
  capture of the public product, successful GitHub Pages deployment, and final GitHub Release
  screenshots.
- Assisted with creating and verifying the final `v0.5.0` GitHub Release from the exact
  protected `main` commit, including the required milestone, product, handover, report, demo,
  run-instruction, and changelog links.
- After publication permission was confirmed, helped turn the supplied 2026-07-17 source
  transcript into Part 2 of the public Sprint Review transcript. Personal names, private
  communication channels, and internal access details were removed while the customer
  feedback, UAT outcomes, accepted limitations, and release decisions were preserved.

## Human oversight and original team work

- Team members conducted the real customer meetings, interpreted product priorities, selected
  the final scope, and recorded the public demo. TeraloToxin independently reviewed and merged
  PR #167 and approved release-preparation PR #168, after which the repository workflow
  deployed the reviewed build. The team remains responsible for the Moodle evidence, Demo Day
  materials, and written acceptance request.
- Codex worked from repository evidence and the supplied cleaned transcript. It did not invent
  customer quotes, UAT results, rehearsal completion, deployment, or written acceptance.
- A different human team member reviewed and merged the final implementation PR. Codex neither
  approved its own changes nor bypassed the protected-branch workflow.

## Limitations observed

- Automated speech tests use the repository's mocked Web Speech API. They verify event
  consumption and game state but cannot measure the accuracy of Chrome's external
  speech-to-text service.
- The public gameplay demo shows the final release build, but it is not evidence of customer
  acceptance or customer-side deployment.
- Week 7 rehearsal completion and the customer's final written confirmation remain
  separate human evidence and are not inferred from code, tests, or the demo video.
