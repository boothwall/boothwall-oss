# Contributing

Thanks for taking a look. Issues and pull requests are welcome, especially from anyone building for Vega OS. Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).

To run it from source, see [docs/development.md](docs/development.md): getting started, commands, running the API locally and changing the database.

## Before you open a pull request

```sh
pnpm typecheck && pnpm lint && pnpm test && pnpm format:check
```

CI runs the same checks, and the pull request template lists them. If you touch the TV app or `packages/wall-ui`, also make sure `pnpm tv:build:debug` still builds and the wall still runs at `/` in `pnpm web:dev`.

## How the code is organised

- Everything lives in named folders; only `index.ts` sits at a feature or module root.
- API modules are split into `http/`, `domain/` and `data/` (see [docs/architecture.md](docs/architecture.md)).
- Frontend features are split into `screens/` or `pages/`, `components/`, `hooks/`, `data/`, `state/` and `constants/`.
- Import across folders with the `@/` alias, and only through a module's or feature's `index.ts`. The packages apps compile from source (`packages/wall-ui`, `packages/web-ui`, `packages/event-ui`) are the exception: `@/` would point into the app, so they import across folders through their own `#name` subpath imports (`imports` in their `package.json`).
- Generic web UI (buttons, dialogs, page shell, settings rows, theme CSS) goes in `packages/web-ui` and takes its data as props; anything that reads the BoothWall config stays in `apps/web`.
- Keep comments short and only where something isn't obvious.

## Good places to start

Look for issues labelled [`good first issue`](https://github.com/boothwall/boothwall-oss/labels/good%20first%20issue) or [`help wanted`](https://github.com/boothwall/boothwall-oss/labels/help%20wanted). If you hit a Vega OS gotcha that isn't in [docs/vega-os-notes.md](docs/vega-os-notes.md), a pull request adding it is very welcome.
