# Deployment view (Team 40)

Voice Games ships as a static single-page application. There is no application
server: after the bundle is downloaded, everything happens on the child's
device, except speech recognition itself, which Chrome may delegate to
Google's speech service.

## Deployment diagram

```mermaid
flowchart TB
    subgraph Dev["Developer machine / CI"]
        Src["GitHub repo<br/>scaredofthesix/voice-games<br/>(protected main)"]
        CI["GitHub Actions CI<br/>type check, tests, build,<br/>Lighthouse a11y"]
        Build["vite build<br/>--base=/voice-games/"]
    end

    subgraph GH["GitHub Pages"]
        Pages["Static hosting (HTTPS)<br/>scaredofthesix.github.io/voice-games/<br/>branch: gh-pages"]
        DocsSite["Docs site (MkDocs)<br/>…/voice-games/docs/"]
    end

    subgraph Client["Child's device (Google Chrome)"]
        SPA["Voice Games SPA<br/>React 19 bundle"]
        WS["Web Speech API"]
        LS["localStorage<br/>progress, high scores,<br/>custom words"]
    end

    GSpeech["Google speech service<br/>(used internally by Chrome<br/>for SpeechRecognition)"]

    Src --> CI
    Src --> Build --> Pages
    Src -.->|mkdocs build| DocsSite
    Pages -->|HTTPS GET| SPA
    SPA --> WS
    SPA --> LS
    WS -.->|audio stream| GSpeech

    VM["Innopolis VM (internal mirror)<br/>https://10.93.26.180:8085/<br/>Docker + python http.server<br/>(internal network only)"]
    Src -.->|manual deploy of tagged builds| VM
```

## Environments

| Environment | URL | Purpose | Updated by |
|---|---|---|---|
| Production | https://scaredofthesix.github.io/voice-games/ | Public deployment used by the customer and for UAT | Manual publish of `dist/` to the `gh-pages` branch |
| Docs site | https://scaredofthesix.github.io/voice-games/docs/ | Hosted project documentation (MkDocs Material) | `mkdocs build` published into the `docs/` folder of `gh-pages` |
| Local dev | http://localhost:3000 | Development (`npm run dev`) | - |
| Innopolis VM (internal mirror) | https://10.93.26.180:8085/ | Internal mirror of released builds (originally the MVP v0 host, now running v0.3.0); reachable only inside the Innopolis network | Manual deploy of tagged builds |

## Why HTTPS matters here

Chrome only grants persistent microphone access to secure origins. GitHub
Pages provides HTTPS for free, which is what makes the public URL usable for
voice control; the old VM deployment used a self-signed certificate and an
internal address, which blocked the customer from testing at home
([ADR-003](./adr/ADR-003-static-spa-github-pages.md)).

## Publish procedure (production app)

```bash
MSYS_NO_PATHCONV=1 npx vite build --base=/voice-games/
cp dist/index.html dist/404.html   # SPA fallback
touch dist/.nojekyll
npx gh-pages -d dist -b gh-pages
```

The `--base` flag is mandatory for a project page. On Git Bash (Windows) the
`MSYS_NO_PATHCONV=1` prefix prevents MSYS from silently rewriting the base
path, which otherwise produces a blank page with 404ing assets.

## Runtime constraints

- **Browser:** Google Chrome only; it is the one browser with a reliable
  `SpeechRecognition` implementation.
- **Network:** recognition needs connectivity because Chrome streams audio to
  its speech service; the rest of the app works offline once cached.
- **Data:** no personal data leaves the device; progress and custom words are
  `localStorage` only, so clearing site data resets them.
