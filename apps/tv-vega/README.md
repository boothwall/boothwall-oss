# @boothwall/tv

The Fire TV app, built for Amazon's Vega OS with React Native. It is a thin shell: the wall itself lives in `@boothwall/wall-ui`, and this app adds what only a TV needs, the remote, the device store, keeping the screen awake, and the Vega build.

## Run it

You need the [Vega SDK](https://developer.amazon.com/docs/vega/0.24/install-vega-sdk.html) with the Virtual Device, Node 24 and pnpm 10, and `~/vega/bin` on your PATH.

```sh
pnpm vvd:start:1080      # the Virtual Device at 1920×1080
pnpm build:debug         # one .vpkg per architecture under build/
pnpm run:vvd             # install and launch the aarch64 build (Apple Silicon) on the Virtual Device
pnpm vvd:restart:1080    # restart the Virtual Device and relaunch the installed build (build:debug first after a change)
pnpm test                # jest: remote keys, media controls and overlays
pnpm build:release       # for a real Fire TV: install build/armv7-release/tv_armv7.vpkg with `vega run-app`
```

The app reaches the API named in `packages/shared/src/config/boothwall.config.ts`. The committed config holds example values, so either run `pnpm boothwall setup` (or `pnpm try` for a local wall) first or set `demo: true` to run the wall on the bundled photos without a network. On an Intel Mac, `run:vvd` finds no build; use `pnpm try` from the repo root, which picks the `x86_64` one.

The app shows one wall: `tv.wallId` (and `tv.displayCredential`, only if your host checks one) in that config, fixed at build time. To show another wall, change the config and rebuild. There is no code to enter and no menu on the TV. The build is yours: the config inside it can be extracted, so install it on your own TVs and never publish the `.vpkg`. See [Your own TV build](../../docs/customising.md#your-own-tv-build).

## Layout

```
index.js, manifest.toml, app.json      Vega's entry, package manifest and app id
assets/fonts/                           the caption fonts; Vega loads them by file name, so a file is named after its family
assets/image/                           the app icon (Vega maps `@image/` in manifest.toml to this folder)
src/
  app/App.tsx                           the screen tree: the build's one wall
  features/keep-awake/                  silent audio that keeps the Stick from sleeping (data/silence.mp3)
  features/media-controls/              Play/Pause, Next and Previous through Vega Media Controls
  features/photo-call/                  the photo call a held OK or Control starts
  features/remote-hint/                 the remote help card
  features/showcase/                    the label naming the theme Menu or Next theme switched to
  features/wall-input/                  routes the remote's keys to the wall or an open overlay
  platform/input/useVegaRemote.ts       the remote's keys as the wall's RemoteHandlers
  platform/storage/deviceStore.ts       the last wall's photos and settings, in device storage
  platform/{motion,performance,wall-status}/  overlay fades, the fully-drawn report, whether photos show
  theme/tokens/                         sizes for the TV-only overlays
  types/                                image module declarations
```

`metro.config.js` watches the workspace packages so the wall compiles from source; `babel.config.js` maps `@/` to `src/`. [docs/vega-os-notes.md](../../docs/vega-os-notes.md) collects what I learnt about the platform.
