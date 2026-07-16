# Administration and maintenance

Voice Games is a client-only application. It has no administrator account, backend,
database, API key, or remote content-management screen. Administration means maintaining
the repository, checking the automated workflows, and helping a player recover local
browser permissions or progress.

## Routine operation

- The public application is hosted on GitHub Pages at
  <https://scaredofthesix.github.io/voice-games/>.
- Every push or merge to `main` starts `.github/workflows/deploy-pages.yml`. The workflow
  installs locked dependencies, type-checks, tests, builds with `/voice-games/` as the base
  path, and publishes the verified `dist` directory to `gh-pages`.
- A maintainer can also start the same workflow with **Run workflow** in GitHub Actions.
  Direct manual publication is a recovery path, not the normal release process.
- TypeScript is pinned to **5.8.3** in both `package.json` and `package-lock.json`.

Before merging or diagnosing a failed deployment, run:

```bash
npm ci
npm run lint
npm test
npm run test:coverage
npm run build
```

See [development-process.md](./development-process.md) for the contribution and release
flow and [customer-handover.md](./customer-handover.md) for recovery instructions.

## Vocabulary and player data

- Built-in learning sets are maintained in `src/data.ts` and released with the application.
- A parent can add personal words inside a game, one pair at a time or by pasting two
  columns from Excel or LibreOffice Calc. Column 1 is the English word or phrase, column 2
  is the translation. A tab or at least four consecutive ordinary spaces separates the
  columns. Runs of one to three spaces are not separators, so English phrases such as
  *Nice to meet you* remain one item. Multiple rows and Unicode translations are supported;
  CSV file upload is not.
- Custom words, scores, per-word adaptation, and combined Progress data stay in that
  browser's `localStorage`. They are not synchronized between devices and are not visible
  to the repository maintainer.
- The CSV action in Progress only exports a report. It is unrelated to custom-word input.
- Clearing site data resets local words and progress. Export Progress first if the data is
  needed for a parent or teacher.

## Player support

Use Google Chrome. On first play the browser asks for microphone access. If permission was
denied, open the site controls next to the address, allow **Microphone**, and reload the
page. Speech recognition also needs a network connection.

Most games listen after the round starts and display the current microphone state.
Sentence Bird is push-to-talk and listens only after its microphone button, active word, or
Space is pressed. Echo Microphone starts listening after it finishes reading the memory
sequence and gives the child a retry window before moving on.

An end-of-game card reports one run. Combined history is under **Progress** in the
top-right of the Hub; the
[README](https://github.com/scaredofthesix/voice-games#how-to-play-example-boss-fight)
includes an annotated image of its location.

## Recovery

If a release fails, inspect the failed GitHub Actions step and do not publish its build.
Fix or revert the source change, rerun the checks above, then push the correction to
`main`; automatic deployment will run again. If GitHub Pages is unavailable, the product
can still be inspected locally with `npm run dev` at <http://localhost:3000>.

For a full deployment recovery or a deployment from a fork, follow the commands in
[customer-handover.md](./customer-handover.md#setup-deployment-recovery-and-verification).
