# Voice Games - Team 40

A browser-based **voice-controlled English learning portal for children**. The child speaks
the target word to trigger in-game actions - **voice is the only controller**. The product
now has **ten games**: Voice Racer, Voice Bubble Popper, Boss Fight, Voice Rocket Climb,
Skate Word, Aste Word Destroyer, Voice Treasure Hunter, Sentence Bird, Echo Microphone, and
Magic Wizard, plus a Progress view that tracks each child's practice over time.

- **Live product (public, HTTPS):** https://scaredofthesix.github.io/voice-games/ - works in Google Chrome; allow microphone access when prompted.
  > Note: the GitHub Pages link may not open from some networks or regions without a VPN. This is an external GitHub availability restriction outside the team's control; the same build can always be run locally from this repository (see "Local development setup" below).
- **Hosted documentation site:** https://scaredofthesix.github.io/voice-games/docs/
- **Customer handover:** [docs/customer-handover.md](./docs/customer-handover.md) - current transition status, what's transferred vs. retained, setup/recovery steps.
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md) · **AI agent guidance:** [AGENTS.md](./AGENTS.md)
- **Release:** [v0.3.0 - MVP v2 (Sprint 3)](https://github.com/scaredofthesix/voice-games/releases/tag/v0.3.0) · [CHANGELOG](./CHANGELOG.md)
  > A newer batch of four games has already shipped to `main` since v0.3.0; a new tagged release covering them is part of the current sprint (see [docs/roadmap.md](./docs/roadmap.md)).
- **Assignment 6 submission index (in progress):** [reports/week6/README.md](./reports/week6/README.md) · [reports/week7/README.md](./reports/week7/README.md)
- **Assignment 5 submission index:** [reports/week5/README.md](./reports/week5/README.md)
- **Assignment 4 submission index:** [reports/week4/README.md](./reports/week4/README.md)
- **Assignment 3 submission index:** [reports/week3/README.md](./reports/week3/README.md)
- **Assignment 2 submission index:** [reports/week2/README.md](./reports/week2/README.md)
- **License:** [MIT](./LICENSE)
- Internal mirror on the Innopolis VM (network/VPN only, runs a released build): https://10.93.26.180:8085/ - see the [MVP v0 report](./reports/week2/mvp-v0-report.md) for the original setup, and [docs/customer-handover.md](./docs/customer-handover.md) for its current retained-by-the-team status.

> **Browser support:** voice recognition uses the Web Speech API and works only in **Google Chrome**; other browsers are not supported.

## Product backlog and process

- **Product Backlog (issues):** https://github.com/scaredofthesix/voice-games/issues
- **User stories (SP + MVP + status):** [docs/user-stories.md](./docs/user-stories.md)
- **Roadmap:** [docs/roadmap.md](./docs/roadmap.md) · **Definition of Done:** [docs/definition-of-done.md](./docs/definition-of-done.md)
- **Quality:** [quality requirements](./docs/quality-requirements.md) · [quality requirement tests](./docs/quality-requirement-tests.md) · [testing strategy](./docs/testing.md) · [user acceptance tests](./docs/user-acceptance-tests.md)
- **Architecture:** [overview + views](./docs/architecture/README.md) · [decision records (ADRs)](./docs/architecture/adr/README.md)
- **Process:** [development process and configuration management](./docs/development-process.md)
- **Docs site (MkDocs):** https://scaredofthesix.github.io/voice-games/docs/
- **Milestones:** [Sprint 1](https://github.com/scaredofthesix/voice-games/milestone/1) · [Sprint 2](https://github.com/scaredofthesix/voice-games/milestone/2) · [Sprint 3 (MVP v2)](https://github.com/scaredofthesix/voice-games/milestone/3) · [Sprint 4 (Week 6 trial)](https://github.com/scaredofthesix/voice-games/milestone/4) · [Sprint 5 (MVP v3)](https://github.com/scaredofthesix/voice-games/milestone/5)

## Tech stack

React 19 · Vite 6 · TypeScript · Tailwind CSS v4 · Web Speech API · Web Audio API · Docker · Python (http.server)

---

## Setup & Deployment

No API key is required - the game runs fully client-side. Allow microphone access when prompted; voice recognition needs a secure context (`localhost` or HTTPS).

### 1. Local Development Setup
**Prerequisites:** Node.js 18+ and Google Chrome.

```bash
# Install dependencies
npm install

# Run the dev server (opens on http://localhost:3000)
npm run dev

# Type-check / lint
npm run lint

# Run the automated tests (and coverage)
npm test
npm run test:coverage

# Production build / preview
npm run build
npm run preview

```

Continuous integration (type check, tests with coverage, build, and a Lighthouse accessibility audit) runs on every pull request and on `main` via [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). See [docs/testing.md](./docs/testing.md).

### 2. Public deployment (GitHub Pages)

The public MVP is served from the `gh-pages` branch over HTTPS (so the microphone works):

```bash
# Build with the project-pages base path
MSYS_NO_PATHCONV=1 npx vite build --base=/voice-games/

# SPA fallback + disable Jekyll
cp dist/index.html dist/404.html
touch dist/.nojekyll

# Publish to the gh-pages branch
npx -y gh-pages -d dist -b gh-pages

```

### 3. Production Deployment via Docker (internal VM)

To bypass container network package-download bottlenecks on the VM, the project uses a hybrid multistage workflow: static assets are built on the host machine and served via a lightweight internal Python HTTP server container running in host-networking mode.

Execute this sequence in the project root (`~/voice-games`) on your VM:

```bash
# Build production assets on host
npm run build

# Rebuild the lightweight Docker image
docker build -t voice-games .

# Restart the container utilizing host networking
docker rm -f voice-app
docker run -d --name voice-app --network host --restart unless-stopped voice-games

```

* **Container Port:** `8085`
* **Status Check:** `docker ps`
* **Logs:** `docker logs voice-app`

### 4. Microphone Access on Remote VM (SSH Port Forwarding)

Since the Web Speech API requires a secure context, modern browsers **block microphone access** on remote HTTP IP addresses. To test the deployed build on a remote VM, bind the server port to your local computer's `localhost`:

1. Run this command in a terminal on your **local physical machine** (PowerShell / CMD / Terminal):

```bash
   ssh -L 8080:localhost:8085 root@<your_vm_name>

```

2. Keep this terminal window open/minimized.
3. Open Google Chrome and navigate to:
 **`http://localhost:8080`**

---

## Repository layout

```
.
├── LICENSE                 # MIT (repository), see Attribution
├── README.md               # this file
├── CONTRIBUTING.md         # how to propose a change
├── AGENTS.md                # guidance for AI coding agents
├── CHANGELOG.md            # Keep a Changelog / SemVer
├── index.html              # Vite entry -> src/main.tsx
├── package.json
├── vite.config.ts
├── docs/                   # user stories, roadmap, DoD, quality docs, architecture + ADRs,
│                           # dev process, UAT, customer-handover.md
├── vitest.config.ts        # test runner + coverage thresholds
├── lighthouserc.json       # accessibility audit config (additional QA check)
├── src/
│   ├── App.tsx             # app shell, view routing (HUB + 10 games + PROGRESS)
│   ├── data.ts             # built-in word categories
│   ├── types.ts            # shared TypeScript types
│   ├── utils.ts            # speech synthesis, word matching helpers
│   ├── gameLogic.ts        # pure game rules shared across games + tests
│   ├── progress.ts         # per-word practice statistics (Progress view), localStorage-backed
│   ├── voice/              # shared voice-recognition/anti-feedback engine used by all games
│   ├── useSpeechRecognition.ts  # Web Speech API hook
│   └── components/         # one file per game (VoiceRacer/BubblePopper/BossFight/RocketClimb/
│                           # SkateWord/AsteWord/TreasureHunter/SentenceBird/EchoRecorder/
│                           # MagicWizard), GameCanvas, AudioVisualizer, CustomWordsManager,
│                           # ProgressView
└── reports/                # Assignment deliverables (week2 .. week7)

```

## License

This project is released under the [MIT License](./LICENSE).
