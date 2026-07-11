# Voice Games

A browser-based **voice-controlled English learning portal for children** (ages about
6-10). The child speaks the target English word to trigger every in-game action - **the
voice is the only controller**. No login, no install, and no accounts.

## Play now

**Live product (public, HTTPS):** https://scaredofthesix.github.io/voice-games/

Open it in **Google Chrome** (desktop or Android) and allow microphone access when
prompted. That is the only step needed to start playing.

> The GitHub Pages link may not open from some networks or regions without a VPN. This is
> an external GitHub availability restriction outside the team's control; you can always
> run the same build locally instead (see [For developers](#for-developers)).

![Voice Games hub with all ten games](./docs/images/hub.png)

## The ten games

Each game trains pronunciation through a different mechanic:

1. **Voice Lane Racer** - dodge road obstacles by pronouncing words correctly.
2. **Voice Bubble Popper** - pop floating word bubbles before they reach the danger zone.
3. **Boss Fight** - say each word to strike the boss before the per-word timer runs out.
4. **Voice Rocket Climb** - launch a rocket higher with every correct word.
5. **SkateWord** - jump the skateboard over obstacles by saying the approaching words.
6. **AsteWord Destroyer** - shoot down asteroids by pronouncing the words written on them.
7. **Voice Treasure Hunter** - steer a submarine deeper to collect treasure chests.
8. **Sentence Bird** - guide a bird through the clouds by speaking sentence steps.
9. **Echo Microphone** - listen to a growing word chain and repeat it back from memory.
10. **Magic Wizard** - cast elemental spells by pronouncing words to defeat dark forces.

A built-in **Progress** view tracks sessions, high scores, and practised words per game,
and exports everything to CSV for parents and teachers.

| A game: Voice Treasure Hunter | Progress tracking and CSV export |
|---|---|
| ![Voice Treasure Hunter setup](./docs/images/game-treasure-hunter.png) | ![My Progress view](./docs/images/progress.png) |

## Quick start: add your own words

Every game can practise a custom word list. On a game's setup screen:

1. Open **Add my own words**.
2. Type an English word or phrase and its translation.
3. Press **Add to my list**.
4. Choose **My words** as the word set and start playing.

![Adding a custom word and translation](./docs/images/custom-words.png)

## Documentation

- **Hosted documentation site:** https://scaredofthesix.github.io/voice-games/docs/
- **Customer handover** - current transition status, what is transferred vs. retained, and
  setup, recovery, and verification steps: [docs/customer-handover.md](./docs/customer-handover.md)
- **Documentation index** (what each document contains): [docs/README.md](./docs/README.md)
- **Roadmap:** [docs/roadmap.md](./docs/roadmap.md)

## For developers

### Repository layout

```text
.
├── index.html              # Vite entry -> src/main.tsx
├── package.json
├── vite.config.ts
├── vitest.config.ts        # test runner + coverage thresholds
├── lighthouserc.json       # accessibility audit config
├── Dockerfile              # lightweight static-server image
├── src/
│   ├── App.tsx             # app shell, view routing (HUB + 10 games + PROGRESS)
│   ├── data.ts             # built-in word categories
│   ├── types.ts            # shared TypeScript types
│   ├── utils.ts            # speech synthesis, word matching helpers
│   ├── gameLogic.ts        # pure game rules shared across games + tests
│   ├── progress.ts         # per-word practice statistics, localStorage-backed
│   ├── voice/              # shared voice-recognition / anti-feedback engine
│   ├── useSpeechRecognition.ts  # Web Speech API hook
│   └── components/         # one file per game, plus GameCanvas, AudioVisualizer,
│                           # CustomWordsManager, ProgressView
├── docs/                   # documentation, architecture + ADRs, customer-handover.md
└── reports/                # course deliverables
```

### Tech stack

React 19 · Vite 6 · TypeScript 5.8 · Tailwind CSS v4 · Web Speech API · Web Audio API ·
Docker · Python (`http.server`)

### Setup and deployment

No API key is required - the game runs fully client-side. Voice recognition needs a secure
context (`localhost` or HTTPS); allow microphone access when prompted.

**Prerequisites:** Node.js 18+ and Google Chrome.

```bash
# Install dependencies
npm install

# Run the dev server (http://localhost:3000)
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

Continuous integration (type check, tests with coverage, build, and a Lighthouse
accessibility audit) runs on every pull request and on `main` via
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml). See [docs/testing.md](./docs/testing.md).

**Public deployment (GitHub Pages).** The public build is served from the `gh-pages`
branch over HTTPS so the microphone works:

```bash
MSYS_NO_PATHCONV=1 npx vite build --base=/voice-games/
cp dist/index.html dist/404.html   # SPA fallback
touch dist/.nojekyll               # disable Jekyll
npx -y gh-pages -d dist -b gh-pages
```

Every push or merge to `main` is deployed automatically. For self-hosting and internal
deployment details, see [docs/customer-handover.md](./docs/customer-handover.md) and
[docs/development-process.md](./docs/development-process.md).

### Contributing and AI-agent guidance

- [CONTRIBUTING.md](./CONTRIBUTING.md) - how to propose a change (setup, Definition of
  Done, conventions).
- [AGENTS.md](./AGENTS.md) - guidance for AI coding agents working in this repository.

### License

This project is released under the [MIT License](./LICENSE).
