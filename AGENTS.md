# Agent guidance for Voice Games

Guidance for AI coding agents (Claude Code, Copilot, Codex, or similar) working in this
repository. Human contributors should read [CONTRIBUTING.md](./CONTRIBUTING.md) instead;
this file adds agent-specific constraints on top of the same workflow.

## What this project is

Voice Games is a browser-based, voice-controlled English-learning app for children
(React 19 + Vite 6 + TypeScript, client-side only, no backend). Voice is the only game
controller: the child says the target word and that drives gameplay. Ten games currently
exist (Voice Racer, Bubble Popper, Boss Fight, Voice Rocket Climb, Skate Word, Aste Word
Destroyer, Treasure Hunter, Sentence Bird, Echo Microphone, Voice Maze Quest). See
[docs/architecture/README.md](./docs/architecture/README.md) for the full picture.

## Ground rules

- **Follow [CONTRIBUTING.md](./CONTRIBUTING.md)** for the branch/PR/review workflow, the
  Definition of Done, and code/testing/documentation conventions. Everything there applies
  to agents too - issue-linked branch, PR with `Closes #n`, review by someone other than
  the implementer, green CI before merge.
- **`main` is a protected branch.** Never force-push, never bypass required review or CI,
  never rewrite published history. If you cannot open a PR yourself (no push access under
  your own identity), prepare the branch/commit and hand off instructions rather than
  pushing under someone else's account.
- **No secrets exist in this project and none should be introduced.** The app needs no API
  keys (see [docs/customer-handover.md](./docs/customer-handover.md#configuration-secrets-and-external-services)).
  Never commit a `.env` with real values, a private key, or any credential. `server.key`
  (TLS private key for the internal VM deployment) must stay out of git - it already is,
  via `.gitignore`.
- **Verify before claiming done:** run `npm run lint`, `npm test`, `npm run build` (see
  [package.json](./package.json) scripts) and read the actual output rather than assuming
  success. Do not report a task complete based on the diff looking plausible alone.
- **Plain hyphens only** in any text you write (docs, commit messages, comments, PR
  descriptions) - no em dashes or en dashes, project-wide convention.
- **Keep the bilingual UI intact.** Any new user-facing string needs both an English and a
  Russian value (see `uiLanguage.tsx` and `translationRu` fields in `data.ts`); the UI
  defaults to Russian on first launch.

## Testing gotchas specific to this codebase

- Games render decorative visuals on `<canvas>`, but `jsdom` (the test environment) has no
  real canvas implementation - `getContext()` returns `null` under test. Canvas drawing
  code must null-guard `getContext()` and treat a failed context as a no-op, never throw.
  Game *state* must live in React/`gameLogic.ts` (pure functions), not in canvas-only
  state, so tests can assert on the DOM without a real canvas.
- Speech recognition is mocked in tests via a fake `SpeechRecognition`
  (`src/test/mockSpeechRecognition.ts`); don't try to test against the real Web Speech API.
- Critical modules (`gameLogic.ts`, `src/voice/`, `src/progress.ts`, etc.) have per-file
  coverage floors enforced in `vitest.config.ts` - check `npm run test:coverage` output
  before assuming a change is adequately tested.

## Deployment gotchas specific to this repo

- On Windows/Git-Bash (MSYS), the flag `--base=/voice-games/` passed to `vite build` gets
  silently path-mangled into `/Git/voice-games/`, producing a blank page in production.
  Always prefix Pages builds with `MSYS_NO_PATHCONV=1`, or build from PowerShell, if you
  ever need to reproduce or fix the GitHub Pages publish step
  (see [docs/customer-handover.md](./docs/customer-handover.md#setup-deployment-recovery-and-verification)).
- Do not deploy or publish (GitHub Pages, the internal VM, a tagged release) without the
  human operator's explicit go-ahead in the current session - these are visible,
  hard-to-reverse actions affecting a real customer-facing product.

## GitHub Project board (ProjectV2) gotcha

If you ever need to add options to a single-select custom field on the Project board
(`Sprint`, `MVP`, `Status`), be aware that GitHub's `updateProjectV2Field` mutation
**replaces the entire option list and regenerates every option's ID**, which silently wipes
every item's existing value for that field even when option names are unchanged. Before
mutating: snapshot every item's current field value (via a GraphQL query), then after the
mutation, restore each item's value using the new option ID that matches the same name.
Never mutate this field's options without doing the snapshot-and-restore first.

## Reports and evidence

Content in `reports/weekN/` (Sprint Review summaries, transcripts, retrospectives,
reflections, LLM-usage reports) documents real events - real customer meetings, real team
decisions. Never fabricate quotes, feedback, timecodes, or outcomes. If information is
genuinely not yet available (a customer hasn't responded, a meeting hasn't happened), say
so explicitly rather than inventing a plausible-sounding placeholder.

## Where to look first

| Need to know... | Look at |
|---|---|
| What the product does, how to run it | [README.md](./README.md) |
| Current handover/transition status | [docs/customer-handover.md](./docs/customer-handover.md) |
| How a change becomes a merged PR | [CONTRIBUTING.md](./CONTRIBUTING.md), [docs/development-process.md](./docs/development-process.md) |
| System design, deployment, ADRs | [docs/architecture/README.md](./docs/architecture/README.md) |
| Quality bar for "done" | [docs/definition-of-done.md](./docs/definition-of-done.md) |
| Test strategy | [docs/testing.md](./docs/testing.md) |
| Current sprint scope | The active milestone linked from [docs/roadmap.md](./docs/roadmap.md) |
