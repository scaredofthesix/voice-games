# Contributing to Voice Games

Thanks for your interest in Voice Games (Team 40) - a browser-based, voice-controlled
English learning app for children. This is a university Scrum course project, but the
workflow below is the real one the team uses, and it works the same for an external
contributor.

## Before you start

- Read [README.md](./README.md) for what the product is and how to run it.
- Read [docs/customer-handover.md](./docs/customer-handover.md) for the current handover
  status and known limitations.
- Browse open work in the [issue tracker](https://github.com/scaredofthesix/voice-games/issues)
  and the [Project board](https://github.com/scaredofthesix/voice-games/projects) before
  starting something new, to avoid duplicating in-flight work.
- If you're an AI coding agent, also read [AGENTS.md](./AGENTS.md).

## Local setup

```bash
git clone https://github.com/scaredofthesix/voice-games.git
cd voice-games
npm install
npm run dev   # http://localhost:3000, Google Chrome required (Web Speech API)
```

No API keys, accounts, or secrets are needed - see
[docs/customer-handover.md](./docs/customer-handover.md#configuration-secrets-and-external-services).

## Workflow

1. **Start from an issue.** Every change traces back to a GitHub issue. If one doesn't
   exist for what you want to do, open it first (bug report, enhancement, or a small
   PBI with acceptance criteria).
2. **Branch off `main`**, named after the issue: `issue/<number>-<short-slug>` (or
   `docs/<slug>` for documentation-only changes).
3. **Make the change**, following the conventions below.
4. **Run the verification commands locally** before opening a PR:
   ```bash
   npm run lint            # TypeScript type check
   npm test                # unit + integration tests
   npm run test:coverage   # coverage gate for critical modules
   npm run build            # production build
   ```
5. **Open a pull request into `main`** whose body ends with `Closes #<issue-number>`, so
   the issue auto-closes on merge. Describe what changed and how you tested it.
6. **Request review from a different team member** - the reviewer must not be the
   implementer. No self-approval, no self-merge; `main` is a protected branch (one required
   approval, required CI checks, merge commits, no force-push).
7. **Address review feedback**, then the reviewer merges once CI is green and the review
   is approved.

## What CI checks

Every PR and every push to `main` runs (see
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and
[`.github/workflows/links.yml`](./.github/workflows/links.yml)):
- TypeScript type check (`npm run lint`)
- The automated test suite with coverage (`npm run test:coverage`)
- A production build (`npm run build`)
- A Lighthouse accessibility audit (the project's additional QA check beyond
  lint/test/build)
- A documentation link check

All of these must be green before merge. See [docs/testing.md](./docs/testing.md) for how
the test suite and quality gates are structured.

## Definition of Done

A change is not "done" until it satisfies the team's full
[Definition of Done](./docs/definition-of-done.md): acceptance criteria met and manually
verified in Chrome, tests added for new logic, quality requirement tests passing where
relevant, critical-module coverage kept above the floor, `CHANGELOG.md` updated for
user-facing changes, and (if the change touches a component boundary, a runtime flow, or
the deployment shape) the architecture docs or an ADR updated.

## Code conventions

- **TypeScript** throughout; keep new code typed, avoid `any` where a real type is
  available.
- **React 19** functional components and hooks; game state lives in React/`gameLogic.ts`
  (pure functions), canvas rendering is decorative and must not be the source of truth
  (see [docs/architecture/README.md](./docs/architecture/README.md)).
- **Tailwind CSS v4** for styling; no separate CSS files for new components unless there's
  a concrete reason.
- Keep the bilingual UI (English/Russian) working - new user-facing strings need both an
  English and a Russian value (see `uiLanguage.tsx` and the `translationRu` fields in
  `data.ts`).
- No secrets, API keys, or credentials in code or commits - there should never be a need
  for any (the app is fully client-side).

## Testing conventions

- Unit tests for new pure logic (`gameLogic.ts`, `src/voice/`, `src/progress.ts`, etc.).
- Integration tests (React Testing Library + a mocked `SpeechRecognition`) for new game
  components, at minimum covering: the start screen renders and is accessible, and a
  spoken/typed target word produces the expected in-game outcome.
- Keep critical modules at or above the coverage floor enforced in `vitest.config.ts`.
- See [docs/testing.md](./docs/testing.md) for the full strategy and
  [docs/quality-requirement-tests.md](./docs/quality-requirement-tests.md) for
  quality-requirement-specific tests.

## Documentation conventions

- Plain hyphens only in prose - no em dashes or en dashes.
- Update `docs/roadmap.md` and `docs/user-stories.md` when a PBI's status changes.
- Update `CHANGELOG.md` (`[Unreleased]` section) for any user-facing change, following
  [Keep a Changelog](https://keepachangelog.com/) and SemVer.
- Architecture-affecting changes update the relevant view under `docs/architecture/`, and
  significant or reversed design decisions get an ADR in `docs/architecture/adr/`.

## Questions

Open an issue, or see [docs/customer-handover.md](./docs/customer-handover.md) for who
currently maintains this repository.
