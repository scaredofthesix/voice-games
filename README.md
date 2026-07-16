# Voice Games

A browser-based **voice-controlled English learning portal for children** (ages about
6-10). The child speaks the target English word to trigger every in-game action - **the
voice is the only controller**. No login, no install, and no accounts.

## Play now

**Live product (public, HTTPS):** https://scaredofthesix.github.io/voice-games/

Open it in **Google Chrome** (desktop or Android) and allow microphone access when
prompted. That is the only step needed to start playing. The hub below lists all ten games;
tap **Play** on any card to start.

> The GitHub Pages link may not open from some networks or regions without a VPN. This is
> an external GitHub availability restriction outside the team's control; you can always
> run the same build locally instead (see [For developers](#for-developers)).

![Voice Games hub with all ten games](./docs/images/hub.png)

## How to play (example: Boss Fight)

Every game works the same way in four steps.

**1. Set up the game.** Press **Play** on a game, then pick a theme, a word set (or your own
words), and difficulty, and press **Start**.

![Boss Fight setup screen: theme, word set, and difficulty](./docs/images/game-boss-fight-menu.png)

**2. Play with your voice.** The target word appears on the card at the bottom (here,
*Peach*). Say it out loud - the microphone listens and your hero acts. Not sure how it
sounds? Press **Listen (EN)** or **Listen (RU)** first.

![Boss Fight in play: say the word on the card to strike the boss](./docs/images/game-boss-fight.png)

**3. Add your own words.** On any game's setup screen, open **Add my own words**, type an
English word or phrase and its translation, and press **Add to my list**. Then choose
**My words** as the word set.

![Add a custom word and its translation](./docs/images/custom-words.png)

**4. Track progress.** The **Progress** screen (top-right of the hub) shows sessions, high
scores, and practised words per game, and exports everything to CSV for parents and teachers.

![My Progress view with per-game stats and CSV export](./docs/images/progress.png)

## The ten games

Each game trains pronunciation through a different mechanic:

1. **Voice Lane Racer** - dodge road obstacles by pronouncing words correctly.
2. **Voice Bubble Popper** - pop floating word bubbles before they reach the danger zone.
3. **Boss Fight** - say each word to strike the boss before the per-word timer runs out.
4. **Voice Rocket Climb** - launch a rocket higher with every correct word.
5. **SkateWord** - jump the skateboard over obstacles by saying the approaching words.
6. **AsteWord Destroyer** - shoot down asteroids by pronouncing the words written on them.
7. **Voice Treasure Hunter** - steer a submarine deeper to collect treasure chests.
8. **Sentence Bird** - guide a bird through the pipes by speaking the words.
9. **Echo Microphone** - listen to a growing word chain and repeat it back from memory.
10. **Magic Wizard** - charge growing rune recipes, cast animated elemental spells, and
    avoid the cursed word before all three magic wards break.

| Voice Lane Racer | Voice Bubble Popper |
|---|---|
| ![Voice Lane Racer](./docs/images/game-voice-racer.png) | ![Voice Bubble Popper](./docs/images/game-bubble-popper.png) |
| **Boss Fight** | **Voice Rocket Climb** |
| ![Boss Fight](./docs/images/game-boss-fight.png) | ![Voice Rocket Climb](./docs/images/game-rocket-climb.png) |
| **SkateWord** | **AsteWord Destroyer** |
| ![SkateWord](./docs/images/game-skateword.png) | ![AsteWord Destroyer](./docs/images/game-asteword.png) |
| **Voice Treasure Hunter** | **Sentence Bird** |
| ![Voice Treasure Hunter](./docs/images/game-treasure-hunter.png) | ![Sentence Bird](./docs/images/game-sentence-bird.png) |
| **Echo Microphone** | **Magic Wizard** |
| ![Echo Microphone](./docs/images/game-echo-microphone.png) | ![Magic Wizard](./docs/images/game-magic-wizard.png) |

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
