# Customer handover (Team 40)

The maintained, customer-facing record of what has actually been handed over, what the
customer needs to know to use and understand the product, and what is still outstanding.
This describes the **current, actual** state - not an aspirational future state - and is
updated whenever access, deployment, limitations, or transition status change.

## Handover status

| | |
|---|---|
| **Handover level reached** | **Ready for independent use** as the team's technical assessment for the Week 6 trial: the product is reachable by anyone with a link and a Chrome browser, with no account, install, or team involvement required. The customer verified public access and repository read access during the guided Week 6 session, but independent use outside the session and customer-side deployment were not confirmed. Final customer confirmation of the handover level is a Week 7 activity. |
| **Customer-confirmation status** | **Accepted with follow-up items.** At the Week 6 meeting the customer explicitly accepted the team's plan to fix the identified game and documentation issues and present the result in Week 7 ("I explicitly accept that plan in this meeting"). This is an interim status for the Week 6 trial, not the final Assignment 6 Part 8 confirmation; the Week 7 transition-confirmation request will determine the final status recorded in `reports/week7/README.md`. |

This table is authoritative for the three levels defined in Assignment 6 Part 8
(`Ready for independent use`, `Independently used by customer`, `Deployed or operated on
customer side`) and the three confirmation states (`Accepted`, `Accepted with follow-up
items`, `Not yet accepted`). See `reports/week6/README.md` and `reports/week7/README.md`
for the dated record of how this status changed each week.

## What is transferred, delegated, or retained

- **Public product access (transferred to the customer, no action needed):** the live
  build at <https://scaredofthesix.github.io/voice-games/> is a public URL the customer can
  open, bookmark, and share on their own, in any browser session, indefinitely (as long as
  the repository exists). No login, invite, or team involvement is required to use it.
- **Product source code (public, read access already available):** the repository
  <https://github.com/scaredofthesix/voice-games> is public under the MIT license. The
  customer (or anyone) can already read, fork, or self-host the code without asking the
  team for access.
- **Repository ownership, GitHub Pages hosting, and CI/CD (retained by the team):** the
  GitHub repository, its Actions workflows, and the `gh-pages` publishing branch stay under
  the team's account (`scaredofthesix`) for the duration of the course. This is a
  deliberate, currently-retained arrangement, not an oversight - a university-course
  repository is not handed over as an organisation transfer. If the customer wants to run
  their own long-term deployment after the course, see "Recovery and re-deployment" below;
  the code and instructions to do so are already public.
- **Internal Innopolis VM mirror (retained by the team, network-restricted):** a secondary
  copy of the released build runs on `https://10.93.26.180:8085/` via Docker, reachable only
  from inside the Innopolis network/VPN. This is a team-operated convenience mirror, not the
  primary customer access path, and is not part of the handover.
- **Write access to issues/PRs (not currently delegated):** the customer gives feedback
  through the Sprint Review / UAT sessions, which the team turns into tracked GitHub issues
  (see the feedback-response tables in `reports/week5/README.md`, `reports/week6/README.md`,
  `reports/week7/README.md`). The customer does not currently have write access to the
  repository; this has not been requested and has not come up as a blocker.

## Configuration, secrets, and external services

- **No API keys or secrets are required to run or deploy the product.** The app is a fully
  client-side single-page application; there is no backend service, database, or third-party
  API call other than the browser's own Web Speech API (which Chrome may delegate internally
  to Google's speech service - this is a browser behaviour, not something the team
  configures or has access to).
- The only environment variable in the project is an **optional**, non-secret `APP_URL` in
  `.env.example`, used only for self-referential links; the app works with the placeholder
  value and does not require a real `.env` file for local development, CI, or the public
  Pages deployment.
- The internal VM's HTTPS server needs a TLS key pair (`server.crt` + `server.key`).
  `server.crt` (the public certificate) is committed to the repository; `server.key` (the
  private key) is intentionally **not** committed (excluded via `.gitignore`) and must be
  generated or provided directly on the VM if that deployment path is ever reused. This only
  matters for the internal VM mirror, not for the public GitHub Pages deployment the
  customer actually uses.
- No user accounts, payment processing, or personal data collection exist anywhere in the
  product. Game progress (scores, practised/struggled words, sessions) is stored only in the
  browser's own `localStorage` on the child's device and never leaves it.

## Setup, deployment, recovery, and verification

Everything below is also covered in more detail in [README.md](../README.md) and
[docs/development-process.md](./development-process.md); this section is the handover-level
summary of what the customer needs to be able to do.

- **Everyday use (no setup):** open <https://scaredofthesix.github.io/voice-games/> in
  Google Chrome (desktop or Android), allow microphone access when prompted, and play. This
  is the only step most users, including the customer, ever need.
- **Local run (for inspection or if the public link is unreachable, e.g. from certain
  networks without a VPN):**
  ```bash
  npm install
  npm run dev      # http://localhost:3000
  ```
  Node.js 18+ and Google Chrome are the only prerequisites; no accounts or keys.
- **Re-publishing the public site** (only needed if the team disbands and the customer or a
  future maintainer wants to redeploy from the same public source):
  ```bash
  MSYS_NO_PATHCONV=1 npx vite build --base=/voice-games/
  cp dist/index.html dist/404.html
  touch dist/.nojekyll
  npx -y gh-pages -d dist -b gh-pages
  ```
  This publishes to whichever repository the command is run against - a fork gets its own
  independent Pages site, so a full re-deployment does not depend on the team's account.
- **Verification that a build is healthy (before trusting a new release):**
  ```bash
  npm run lint            # TypeScript type check
  npm test                # unit + integration tests
  npm run test:coverage   # coverage gate for critical modules
  npm run build            # production build
  ```
  The same checks (plus a Lighthouse accessibility audit and a documentation link check) run
  automatically in CI on every pull request and on `main`; see
  [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and
  [`.github/workflows/links.yml`](../.github/workflows/links.yml).
- **Recovery if the public site goes down:** GitHub Pages availability is outside the
  team's control (see the VPN note in README.md); the fallback is always the local `npm run
  dev` path above, or a fresh `gh-pages` re-publish per the commands above from any clone of
  the public repository.

## Main documentation entry points

| Document | What it's for |
|---|---|
| [README.md](../README.md) | Product overview, access links, setup/run instructions - start here. |
| **This document** | What was handed over, what the customer needs to know, current handover status. |
| [docs/user-acceptance-tests.md](./user-acceptance-tests.md) | The scenarios the product is expected to pass, and their latest results. |
| [docs/testing.md](./testing.md) | How the automated test suite and quality gates work. |
| [docs/quality-requirements.md](./quality-requirements.md) | The measurable quality goals (accuracy, performance, accessibility) and how they are checked. |
| [docs/architecture/README.md](./architecture/README.md) | How the product is built and deployed, for anyone maintaining or extending it. |
| [docs/roadmap.md](./roadmap.md) | What shipped each sprint and what remains for the current course version. |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to propose a change if the customer or a future maintainer wants to contribute code. |
| [AGENTS.md](../AGENTS.md) | Guidance for AI coding agents working in this repository. |
| Hosted docs site: <https://scaredofthesix.github.io/voice-games/docs/> | The same architecture/process docs, browsable without cloning the repo. |

## Is the current documentation set sufficient, and what support remains

As of Sprint 4 (Week 6), the documentation set above is **sufficient for the "Ready for
independent use" level**: a first-time reader (customer or TA) can reach the product, run it
locally, understand what it does, and see how quality is checked, without asking the team
anything. The customer reviewed `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CHANGELOG.md`,
and this document directly at the Week 6 meeting (2026-07-11) and confirmed the underlying
facts (no secrets required, repository ownership, access model, MIT license) are correct and
sufficient. The customer requested a restructuring of `README.md` (product-facing content
first, developer-facing content in its own section, coursework wording removed) rather than
any factual correction. That restructuring, a new `docs/README.md` directory index, and the
pinned TypeScript version were completed during Week 6 finalization
([issue #146](https://github.com/scaredofthesix/voice-games/issues/146), closed).

This is the team's Week 6 sufficiency assessment, not a claim that the customer used the
product independently outside the guided trial or deployed it on their side. The customer
accepted the Week 7 follow-up plan, and final acceptance against this handover document will
be requested and recorded during Week 7.

**Known remaining gaps, honestly stated:**
- The documentation is written for a developer/TA audience. There is no separate,
  non-technical "how to play with your child" quick-start beyond the README. The customer
  confirmed this is a real gap and requested a short visual Quick Start showing how to add a
  custom word; that Quick Start (with a screenshot) was added to `README.md` during Week 6
  finalization (issue #146, closed).
- Repository ownership and CI/CD stay with the team for the course; a future maintainer who
  is not a current team member would need to fork the repository to gain publish rights (see
  "Setup, deployment, recovery, and verification" above for how that fork would work). The
  customer confirmed at the Week 6 meeting that this arrangement is acceptable and that write
  access is not needed.
- The customer has not yet been asked to deploy or operate a copy of the product themselves;
  until that happens (or is explicitly declined), the handover level above cannot move past
  `Ready for independent use`.

This section, and the status table at the top, were updated after the Week 6
transition-readiness meeting (2026-07-11) and will be updated again after the Week 7
final-transition confirmation.
