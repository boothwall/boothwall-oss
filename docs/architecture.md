# Architecture notes

The decisions behind BoothWall that aren't obvious from the code, and why I made them. The README covers what it does and how to run it.

## The shape of it

```mermaid
flowchart LR
    phone["Guest phone /snap<br/>(apps/web, packages/event-ui)"] -- "POST /photos<br/>GET /photos/:id/status" --> api["API Worker<br/>(apps/api, Hono)"]
    control["Control · Booth desk<br/>/control, /control/live, /control/guests<br/>(apps/web)"] -- "approve · reject · remove<br/>switches · TV requests" --> api
    api --> d1[("D1<br/>photo rows")]
    api --> r2[("R2<br/>images, thumbnails")]
    api -- "RPC broadcast" --> room["WallRoom<br/>Durable Object"]
    room -- "WebSocket /wall/live" --> tv["Screens: Fire TV (apps/tv-vega)<br/>browser wall at / (apps/web)"]
    room -. "while it waits" .-> phone
    tv -- "GET /photos, images" --> api
```

Three apps share one package, `packages/shared`, which holds the zod schemas for everything that crosses the network: photos, wall stats, the upload result, the realtime events and the Control panel's list, edit and stats contracts. The API validates what comes in, and the TV and the web app validate what comes back. If the contract changes, TypeScript and the parsers catch it on all three sides.

1. A visitor scans the QR code and opens `/snap`.
2. They take a photo, add a caption, pick a category and agree to it being shown. The phone shrinks it to 1080 px, makes a 480 px thumbnail and uploads both.
3. The API stores it in R2 with a `pending` row in D1. Nothing reaches a screen yet.
4. A host approves it in `/control`.
5. The API tells the Durable Object, which pushes it to every connected wall over a WebSocket.
6. The TV and every browser showing the wall drop the new polaroid in and give it a moment full screen.

The same flow as a diagram:

```mermaid
sequenceDiagram
    participant Phone as Phone /snap
    participant Control as Control · Booth desk (/control)
    participant API as API Worker
    participant Store as D1 + R2
    participant Room as WallRoom (Durable Object)
    participant TV as Fire TV (Vega OS)

    TV->>API: GET /photos · snapshot
    TV->>Room: WebSocket /wall/live, through the API
    Phone->>API: POST /photos · image, thumb, caption
    API->>Store: clean, save, pending
    API-->>Phone: 201 · delete token
    Control->>API: GET /photos/pending · every 5 s
    alt If the host approves
        Control->>API: POST /photos/:id/approve
        API->>Store: mark approved
        API->>Room: broadcast photo.created
        Room-->>TV: photo.created
        TV->>API: GET /photos/:id/thumb, /image
        Phone->>API: GET /photos/:id/status · token
        API-->>Phone: live
    else If the host rejects it
        Control->>API: DELETE /photos/:id
        API->>Store: removed_at · delete files
        Phone->>API: GET /photos/:id/status · token
        API-->>Phone: declined → “Not this time.”
    end
```

## Repo layout

```
apps/
  tv-vega/    Vega OS TV app (React Native for Vega): a thin shell around packages/wall-ui
    src/app/               App root: the build's one wall
    src/features/          keep-awake, media-controls, photo-call, remote-hint, showcase, wall-input
    src/platform/          Vega adapters: remote input, motion, performance, storage, wall status
  web/        the wall at / (a display on every screen), the upload page at /snap and /control
    src/app/               routes.ts (pathname → screen, old addresses)
    src/features/          capture, control, photo-approval, wall (pages/, components/, hooks/, data/)
    src/platform/event/    the standalone runtime the pages in packages/event-ui run on
    vite/plugins/          applies the config to index.html, CSS variables and _redirects
  api/        Hono API, D1 schema and migrations, WallRoom Durable Object, retention cron
    src/modules/{photo,reaction,auth,settings,wall}/  http/, domain/, data/, realtime/
packages/
  shared/     the BoothWall config, zod contracts and colour helpers used by all three apps
  wall-ui/    the wall itself, for Vega and the web
    src/app/               app.config.ts (derived from the BoothWall config)
    src/assets/brand/      logo, lockup and backdrop (replace to rebrand)
    src/features/wall/     screens/, components/{collage,decor,overlays,panels,primitives,shell},
                           hooks/, data/, state/, constants/, utils/
    src/features/          also photo-call, remote-hint, picks, reactions and offline
    src/foundation/        tokens/ (palette, layout, type, decor), theme/ (wallTheme), assets/, motion/
    src/platform/          ports and twins: remote input, back button, motion, storage
  event-ui/   the browser pages: capture, the wall page and its moments, the wall preview, the guest shell
  web-ui/     brand-neutral web building blocks, shared by apps/web and any host app
    src/foundations/       cn, surface, swipe, field scale
    src/primitives/        button, chip, polaroid, text-field, qr-code, spinner, skeleton, divider
    src/composites/        dialog, disclosure-menu, segmented-control, empty-state
    src/patterns/          settings-section, setting-switch, text-setting
    src/shells/            page-shell, brand-header, source-footer
    src/brand/             logo, github-icon, tv-frame (artwork from @boothwall/brand)
    src/theme/             styles.css (the one import), token contract, default theme, base
  i18n/       the pages' words in English and German, and picking the language
  tsconfig/   shared TypeScript config
brand/        SVG sources of the default artwork
examples/     complete setups that mirror the repo layout (a branded conference booth)
scripts/
  boothwall/  the `pnpm boothwall` CLI: setup, deploy, migrate, demo, example, settings-preview/apply
  brand/      renders the logos and icons from brand/
  themes/     draws the wall themes' art in code
  remote/     laptop remote for the booth (`pnpm remote`)
  postinstall/  workaround for the cf beta (see below)
docs/         these notes, customising and the Vega OS field notes
```

## One config, three apps

`packages/shared/src/config/boothwall.config.ts` is the only file a deployer edits. It has to work in four places, which explains its shape:

- **The TV (Metro) and the web app (Vite)** import it through `@boothwall/shared`. The package's entry point validates it against the zod schema, so a broken config fails every build.
- **The `cf` CLI** loads each app's `cloudflare.config.ts` with plain Node, which strips TypeScript types but can't follow extension-less imports. So every relative import inside `packages/shared` carries its `.ts` extension, the config file is pure data with a type-only import, and the Cloudflare configs import it as `@boothwall/shared/config/boothwall.config`.
- **The `pnpm boothwall` CLI** reads it the same way and writes setup results (D1 id, URLs, `demo`) back into it with small, layout-preserving edits.

The committed config holds example values. A config copied from another deployment would carry that deployment's database id and domains, so setup and deploy check the id against the logged-in account with `d1 list`. They stop when the configured id doesn't match `deploy.name` in the selected account, or when custom domains belong to another account, and never drop or replace the id.

Brand colours become wall tokens in `packages/wall-ui/src/foundation/tokens/palette.ts` and CSS variables injected by the Vite plugin. `readableOn` shades a colour used as text just enough to reach a 3:1 contrast, so any palette stays legible.

## pnpm with a hoisted node_modules

pnpm normally gives every package its own isolated `node_modules` made of symlinks. Metro, React Native autolinking and the Vega build tools don't cope well with that. They expect packages to sit in a flat tree the way npm lays them out. Rather than fight that with resolver hacks, `.npmrc` sets `node-linker=hoisted`.

What you lose is pnpm's strictness about undeclared dependencies. ESLint, TypeScript and keeping each app's `package.json` honest have to cover that instead.

`apps/tv-vega/metro.config.js` adds the workspace `packages/` folder and the root `node_modules` to Metro's watch and resolve paths, so the TV app can import `@boothwall/shared` and `@boothwall/wall-ui` as raw TypeScript without a build step.

The shared package uses zod v4, which needs one extra Babel plugin on React Native; see the [Vega OS notes](vega-os-notes.md#rendering-and-animation).

## A 960×540 layout canvas on the TV

Vega lays out a 1080p screen at 2x, so the app works in a 960×540 dp coordinate space. The wall is a fixed composition rather than a responsive layout. Twelve polaroid slots, three rows of four with hand-picked positions and tilts, a side panel with the QR code and the category counts, and a "now showing" bar along the bottom. All of it is defined in `packages/wall-ui/src/features/wall/constants/layout.ts`, the spacing in `packages/wall-ui/src/foundation/tokens/layout.ts` and the colours in `packages/wall-ui/src/foundation/tokens/palette.ts`.

A TV is a known, fixed screen, so absolute positions read better than a flex layout trying to be clever. It also keeps the number of animated views small enough for a Fire TV Stick.

## Tests on the wall: logic, not rendering

The interesting wall logic lives in two plain reducers, and that's what the Jest tests in `packages/wall-ui` cover. They run on React Native's own Jest preset, so nothing Vega-specific is needed to test the package:

- `state/wallState.ts` decides which photo goes into which slot, what the next page of photos is, how a full wall makes room for a new arrival, and how a removed photo's slot gets refilled.
- `state/wallDirector.ts` decides what the wall does next: which card is selected, when the spotlight opens and closes, and how a live arrival gets its turn. It takes explicit events (`advance`, `autoOpen`, `arrival`, `move`, `pageTurned`, `toggleSpotlight`, `closeSpotlight`, `togglePause`, `selectionEmptied`) and never touches a timer.

The selection walks the twelve cards in reading order, one at a time. After the last card the whole page turns to the next photos: the old cards slide out to the left and the new ones in from the right, one after another in reading order, under a small "Page 2 of 3" label, and the selection starts again at the top left. Nothing on screen changes while the selection is still on its way to it, so viewers can always tell where the wall goes next.

`hooks/useWallDirector.ts` owns the timers (time on each photo from the live settings, 1.5 s hurry when an arrival is waiting) and turns them into events. Every fourth timed step opens its photo full screen unless `autoOpen` is off; a guest's new photo opens either way. Timer callbacks read the latest slots from a ref, so an arrival doesn't restart the countdown that the progress line is showing.

I didn't add render tests for the TV screen. Vega's Jest preset has a broken `Dimensions` mock ([notes](vega-os-notes.md#debugging)), and with a fixed 960×540 canvas, testing the reducers gives more confidence per line than snapshotting styled views.

On the web, `packages/event-ui/src/features/wall/pages/BrowserWallExperience.test.tsx` (Vitest and jsdom) renders the whole wall through react-native-web in demo mode, which catches a platform API the browser lacks, and checks that a phone held upright keeps the same display, with an "Add your photo" button. The feed's event handling and the routes have small unit tests of their own.

## Realtime with a hibernating Durable Object

Every screen, TV or browser, opens a WebSocket to `/wall/live`. The Worker forwards it to a single Durable Object, `WallRoom`, which accepts it with the hibernation API (`ctx.acceptWebSocket`). When the API approves or removes a photo, it calls `broadcast()` on the room over RPC, and the room sends the event to every socket.

Hibernation matters because the wall is idle most of the time. A connected TV costs nothing while nothing happens. The TV sends `ping` every 25 seconds to keep the connection alive through proxies, and the room answers with `setWebSocketAutoResponse("ping" → "pong")`. That reply comes from the runtime without waking the object up.

The TV treats the socket as a hint, not the source of truth. On every (re)connect it fetches a fresh snapshot over HTTP, so a missed event during a reconnect can't leave the wall out of date. Reconnects back off exponentially up to 15 seconds.

## Approve first, then broadcast

With default manual approval, uploads land as `pending` and are not broadcast until a host approves them. Explicitly configured `autoApprove` instead publishes new photos immediately. The standalone app has no automated review provider.

Other privacy choices follow the same idea of keeping as little as possible:

- The phone downsizes images to about 1080 px JPEG before upload, plus a 480 px thumbnail for the wall cards. That's plenty for a TV, kind to conference Wi-Fi, and drops most of the original EXIF data.
- Clients (an IPv4 address, or an IPv6 /64) become a daily pseudonym: an HMAC keyed with the server secret `CLIENT_FINGERPRINT_KEY`, separate per purpose (uploads, passcode attempts, reactions), so a copy of the database can't be turned back into addresses. It's used only to rate-limit uploads and reactions and to lock out wrong passcodes; see [Updating client fingerprints](client-fingerprint-migration.md). The limits and the other abuse protections are under [Abuse protection](#abuse-protection).
- Uploaders get a random delete token. Only its SHA-256 hash is stored.
- A cron trigger (`17 3 * * *`) hard-deletes rows and images past the retention window, except photos marked `keep`. That flag is for a demo wall's starter photos; it's set through `PATCH /photos/:id` and has no button in the Control panel.

## The Control panel

`/control` is the passcode-protected host desk at three addresses: Review at `/control`, Live at `/control/live` and Guests at `/control/guests`; a wide screen shows all three. Review has today's numbers and the waiting queue to approve or reject, with the photos on the wall to remove; Live has the wall preview, the slideshow and guest-upload switches and the TV requests (Photo call, Remote help, Next theme); Guests has the guest QR and link. It has no rich Settings, print or bulk-edit UI. Authenticated API compatibility still includes the photo-management endpoints below; their presence does not imply a standalone product screen.

| Endpoint             | What it does                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /photos/manage` | Every kept photo. Filters `status`, `tribe`, `q` (caption search); `sort`; `cursor`; `limit` ≤ 50 |
| `PATCH /photos/:id`  | Edits `caption`, `tribe`, `hidden` and `keep`; any subset, at least one                           |
| `GET /photos/stats`  | On the wall, pending, hidden, uploads since `since`, and the same per category                    |

A note on names: what the config and the UI call a category is stored and sent as `tribe` (the column and the API field). That's the name from the first version, and renaming it would break the API that installed TV builds already use.

A photo has three statuses: `pending`, `approved` and `hidden`. Hiding keeps the row and the image but treats them like a pending photo: off the public wall endpoint, and the image only through a signed link. Showing a hidden photo approves it. Every photo the Control panel lists that isn't on the wall comes with signed image and thumbnail links (the same HMAC as pending photos).

The wall follows every change live:

| Change                        | Event              |
| ----------------------------- | ------------------ |
| Approve, or show a hidden one | `photo.created`    |
| Hide or delete                | `photo.removed`    |
| New caption or category       | `photo.updated`    |
| Settings saved                | `settings.updated` |
| Guests reacted (batched)      | `photo.reactions`  |

`photo.updated` carries the whole photo and fresh stats. The wall reducer swaps it into the pool in place, so the card keeps its slot and doesn't get the new-arrival treatment. Edits to photos that aren't on the wall send nothing.

The list pages with keyset cursors, not offsets, so photos arriving during the event don't shift pages under someone scrolling. A cursor is the last row's sort keys (category position, `created_at`, `id`) encoded with the sort it belongs to; one from another sort is refused. Sorting by category follows the order of the live category list, through a `CASE` expression, and a `(tribe, created_at)` index backs the category filter.

The basic page updates scoped lists after individual mutations and polls for subsequent changes and preserves loaded data on transient errors. The richer API contracts remain for compatibility, while the standalone UI uses only its supported operations.

## Live settings

Basic Control sends a strict, nonempty `PATCH /settings/runtime` containing only `playbackPaused` and/or `uploadsOpen`. A bounded compare-and-put retry preserves all unrelated settings, and broadcasts `settings.updated`. Display snapshots also include the persisted state so reconnect restores it. The self-hosted API takes presentation from the config: `PUT /settings` and `POST /event/end|reopen` are mounted only for a host that builds `createApp({ settingsAuthority: "stored" })`. `GET /settings` is public and names the authority that answered in `X-BoothWall-Settings-Authority`. There is no standalone Settings tab. File defaults apply where older stored values do not override them; upgrading configuration authority must preserve that data.

The API checks uploads and edits against the live settings: closed uploads are refused before the body is read, a category has to be in the live list, and auto-approve sends a new photo straight to the wall. Categories are stored by id, so renaming one keeps its photos; a photo whose category was removed stays on the wall without a label.

## Reactions

The shared compatibility API accepts emoji reactions (`heart`, `fire`, `laugh`, `clap`, the `REACTIONS` list in `packages/shared`) with `POST /photos/:id/reactions` and `{ "reaction": "heart" }`. It is public, only counts approved photos and answers with totals. The standalone application does not provide an event feed or reaction controls.

The counts live in a JSON column on the photo (`{"heart":3}`), bumped in a single `UPDATE … json_set(…) WHERE status = 'approved'` so concurrent taps never lose one and a pending photo can't be reacted to. Every photo in the snapshot and in events carries `reactions` with all four counts. No extra table, no join, and the counts go when the photo goes.

A busy booth taps far faster than a wall should redraw, so pushes are batched in the `WallRoom`. The Worker hands each new total to the room over RPC; the first change in a batch sets a Durable Object alarm 2 seconds out, and the alarm sends one `photo.reactions` (`{ photoId, counts }`, the latest totals) per photo that changed. So a photo gets at most one event every 2 seconds however many people tap. Totals can reach the room out of order, so it keeps the highest count per reaction and never sends a lower one. The batch lives in memory: the counts are already in D1, and screens re-read the snapshot on reconnect, so an evicted room only drops a hint.

On the wall, `useWallFeed` folds each `photo.reactions` into the photo in the pool, and `features/reactions` compares a visible card's totals with what it saw last: every new tap floats its emoji up off the card (a few per reaction at most, six on screen at most, the rest dropped). A card's first sighting only records its totals, so a photo coming back on a page turn doesn't burst with taps it got elsewhere. With the system's reduce-motion setting on, the emoji fade in place instead of rising.

Taps are limited per client (the same keyed daily pseudonym as uploads, with its own purpose) to 600 a minute, counted in memory in the room before anything is written. Like the upload limits, that only stops scripts.

## One wall, or many

The open-source API serves a single wall, but every request runs for an explicit wall id. `wallContext` (in `modules/wall/http/`) resolves it once per request into `c.get("wallId")`, and everything downstream is scoped by it:

| What                  | Default wall (`"default"`) | Any other wall   |
| --------------------- | -------------------------- | ---------------- |
| `WallRoom` name       | `main`                     | `wall:<id>`      |
| Settings row          | `wall`                     | `wall:<id>`      |
| Photo queries, writes | `wall_id = 'default'`      | `wall_id = <id>` |

The default wall keeps the names it had before walls had ids, and migration 0007 gives existing photos `wall_id = 'default'`, so an upgraded deployment behaves exactly as before. The resolver is the extension point: `createApp({ resolveWall })` in `app/app.ts` takes any function from the request to a wall id (a subdomain or a header, for example), and `app` is `createApp()` with the default. Two things deliberately span walls: the retention purge, and the per-client upload count (a client is one client wherever it uploads).

Screens have the matching seam. `WallScreen` takes a `wall` (`{ wallId, screenToken? }`, the `WallTarget` in `packages/shared`) and `scopeToWall` adds `?wall=<id>&screen=<token>` to the snapshot request and the socket URL (a browser socket can't send headers). The default wall's URLs stay exactly as they are, so the open API never sees the parameters. The TV app takes its one `wall` from `tv` in `boothwall.config.ts` at build time (`appConfig.wallTarget`, with `displayCredential` as the screen token for a host whose resolver checks one); a different wall means a rebuild.

## Offline

Every screen reconnects on its own with exponential backoff and jitter, and refetches the snapshot when it's back. On top of that, the TV keeps the last live wall (photos, totals and settings) in device storage, written a few seconds after each change. A screen that starts without network shows that wall and keeps cycling through it, with a small "Offline" chip at the top, until the API answers. The cache is per wall and versioned, and it goes through the same contract check as a live snapshot, so a stale or foreign entry is ignored rather than misread. Photos still load from their URLs, so images the device hasn't cached stay blank until the network is back.

## API module layout

Each API module is grouped by layer, and requests flow http → domain → data:

```
modules/photo/
  index.ts      the module's public surface; other code imports only from here
  http/         photo.routes.ts, photo.schemas.ts
  domain/       photo.service.ts (+ test), photo.errors.ts, photo.types.ts, photo.formatters.ts,
                photo.cursor.ts (list cursors)
  data/         photo.repo.ts (D1), photo-storage.repo.ts (R2)
modules/auth/
  index.ts
  http/         admin.middleware.ts (isAdmin / requireAdmin / adminOnly for the routes)
  domain/       admin-guard.service.ts (+ test), auth.errors.ts (passcode lockout)
  data/         auth-failure.repo.ts (D1)
modules/settings/
  index.ts
  http/         settings.routes.ts (public GET, admin PUT) (+ test)
  domain/       settings.service.ts (saved values over the config defaults, broadcast on save)
  data/         settings.repo.ts (D1, one JSON row)
modules/reaction/
  index.ts
  http/         reaction.routes.ts (public POST /photos/:id/reactions) (+ test), reaction.schemas.ts
  domain/       reaction.service.ts (limit, count, queue) (+ test), reaction.counts.ts,
                reaction.errors.ts, reaction.types.ts
  data/         reaction.repo.ts (D1, the photo's reactions column)
modules/wall/
  index.ts
  http/         wall.routes.ts (WebSocket upgrade, the Control panel's remote),
                wall-context.middleware.ts (which wall a request is for)
  domain/       wall.service.ts (the room for a wall: broadcast, reactions)
  realtime/     wall.room.ts (the WallRoom Durable Object), reaction-batch.ts, client-limiter.ts
```

- `http/` parses input with zod and checks admin auth. Nothing else knows about Hono.
- `domain/` holds the rules (rate limits, real-image checks, approval, who may delete).
- `data/` is the only place that talks to D1 and R2; `realtime/` is the only place that holds sockets.

The Hono app itself, with its middleware and error handler, is in `app/app.ts`; `index.ts` only wires it to the Worker and the cron. Shared plumbing lives in `core/`, grouped by role: `runtime/` (Worker bindings), `http/` (context, responses, errors, the client IP) and `security/` (hashing, HMAC, client keys).

Dependencies (`db`, `bucket`, the wall broadcaster, a clock) are passed into the service per request, and so is what the live settings allow (the categories, whether to approve automatically). That's what makes `photo.service.test.ts` possible without a Worker runtime: the repos are spied on and the clock is fixed.

Errors are `ServiceError`s with a stable `code` that the web app maps to friendly messages. Config is read and validated once in `config/env.ts`.

## One wall, two platforms

The wall is `packages/wall-ui`. The TV app renders it through React Native for Vega and the web app renders it at `/` through react-native-web, so the screens, components, hooks, state and tokens are one copy. The package imports only `react-native`; an ESLint `no-restricted-imports` rule fails the build if anything from `@amazon-devices/*` gets in.

| Piece     | Vega (`apps/tv-vega`)                                       | Web (`apps/web`)                                                              |
| --------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Remote    | `useTVEventHandler` (`src/platform/input/useVegaRemote.ts`) | Arrow keys, Enter, Space, Escape (`useKeyboardRemote` in `packages/event-ui`) |
| Back      | `BackHandler`; a second Back on the wall exits              | Escape closes the spotlight; a web page can't exit                            |
| Images    | Metro asset ids                                             | Vite asset URLs                                                               |
| Animation | Native driver                                               | JavaScript driver                                                             |
| Canvas    | 960×540 dp, drawn at 2× on 1080p                            | 960×540, scaled to the window; phones keep the display                        |

What differs per platform goes through one of two seams:

- **Adapters passed in by the app.** `WallScreen` takes `useRemoteInput`, a hook that calls the wall's handlers once per button press. The TV passes `useVegaRemote` (`useTVEventHandler`, key up only); the web passes `useKeyboardRemote` (arrows, Enter, Space, Escape or Backspace for Back). The remote needs a Vega-only API, so it can't live in the package.
- **`.web.ts` twins inside the package.** Where both platforms use plain React Native APIs but need different behaviour, a `foo.web.ts` sits next to `foo.ts`. Vite lists `.web.*` first in `resolve.extensions` and the web `tsconfig` sets `moduleSuffixes`, so the browser build and its typecheck use the twin; Metro and Jest never see it. There are three: `platform/input/useBackButton` (`BackHandler` and `exitApp` on Vega, nothing on the web), `foundation/assets/bundledImage` (Metro asset ids versus Vite asset URLs, and the logo's aspect ratio, which Metro knows at build time and the browser only after loading) and `foundation/motion/nativeDriver` (the native driver on Vega, the JavaScript driver on the web, which has no native one).

Everything else (`AppState`, `Image.prefetch`, `WebSocket`, `ImageBackground`, `Pressable`) works on both as is.

The web side lives in `packages/event-ui/src/features/wall`, which `apps/web/src/features/wall` mounts. The page scales the 960×540 canvas with one CSS transform to fit the window, letterboxed at 16:9, and runs live or in demo mode as the config says, like the TV (`?demo` forces the demo). `vite/plugins/reactNativeWeb.ts` aliases `react-native` to `react-native-web`, prefers `.web.*` files and defines `global`, which React Native's `Animated` still reads. The route is lazy-loaded, so React Native for Web and the demo photos never reach the upload page bundle.

On a phone, `/` stays the same display. A touch-first device gets an "Add your photo" button to `/snap` instead of the full-screen hint; the guest's page is `/snap`.

Around the canvas, two copies of the backdrop fill the window: a blurred one covering it and a sharp one exactly behind the canvas. The canvas edge fades into identical pixels, so a window that isn't 16:9 shows no seam.

Two things I ran into:

- **No `StrictMode` on the wall.** Its dev-only double mount detaches and reattaches every animated view, and react-native-web stops a running animation when its value loses its last view. The spotlight never opened in `pnpm web:dev`. The TV app doesn't use `StrictMode` either, so the web app now wraps only the upload page and the Control panel in it.
- **No `@/` inside the package.** `@/` means each app's own `src/`, and both apps compile the package from source, so an alias there would point into the wrong app. The package imports across its folders through its own `#name` subpath imports (`imports` in its `package.json`).

## Frontend feature layout

The TV, web and wall code use the same rule as the API: every file lives in a named folder, and only a feature's `index.ts` sits at its root.

```
packages/wall-ui/src/features/wall/
  index.ts
  screens/      WallScreen.tsx (composition only)
  components/
    collage/    WallCollage, FloatingSlot, SelectedPhoto, PolaroidCard, LiftedCard, EmptyWall
    overlays/   Spotlight, SpotlightCards, NowShowingBar, IncomingToast, ConnectingOverlay,
                ExitHint, Announcement, PageTurnBanner, WallErrorBoundary
    panels/     TopBar, SplitHeader, JoinPanel, SourceCard, RepoSourceCard, LivePill, WhoIsHere,
                YearMark
    primitives/ QrCode, PopNumber, ProgressLine, SelectCatcher, and the signal look's sprites
    decor/      the moving layers of the themes
    shell/      WallPresentationCanvas
  hooks/        useWallFeed, useWallDirector, useWallRemote, useSpotlightTransition
  data/         fetchWall, connectLive, simulatedFeed, demoPhotos, prefetchImage
  state/        wallState, wallDirector, wallStep, connectionPhase (+ tests)
  constants/    copy, layout, timing, feed, captionStyles
  utils/        formatRelative, collageLayout, fitCaption, qrAddress, reactionTargets (+ tests)

packages/event-ui/src/features/wall/
  pages/        the browser wall page
  components/   canvas/ (the scaled 960×540 frame) and moments/ (photo call, remote help)
  hooks/        useKeyboardRemote, useWallMoments, useMomentInput, useFullscreen
  constants/  data/

apps/web/src/features/{capture,control,wall}/
  index.ts
  pages/        CapturePage / ControlPage (+ tests) / WallPage
  components/   the Control desk's desk/, review/, live/, guests/, unlock/ and primitives/;
                canvas/ for the wall
  hooks/  data/  constants/  utils/
```

Imports that cross folders go through the `@/` alias for `src/` in all three apps (Babel
`module-resolver` on the TV, Vite and Vitest aliases on the web and API). Only files in the same folder import each other with `./`. The packages the apps compile from source (`wall-ui`, `web-ui`, `event-ui`) are the exception: they use their own `#name` subpath imports (see above).

App-wide pieces sit next to `features/`: `app/` (root component and config), `components/` grouped by purpose (`brand/BadgeChip` and `photos/PolaroidCollage` on the web), `assets/{brand,icons}/`, and `platform/` for the TV's Vega adapters.

Generic web UI lives in `packages/web-ui`, so other apps can reuse it. It knows nothing about walls or photos as data: links and copy come in as props, and an ESLint rule rejects `@boothwall/*` and `@/` imports inside it. Its one brand piece is `LogoLockup`, which reads the logo artwork from `brand/logos`. The kit's tokens and components are listed in `packages/web-ui/README.md`.

## Smooth wall motion on Vega

The rules that came out of chasing flicker (fixed z-order, no remounting a card to animate it out, Animated nodes built once) are in the [Vega OS notes](vega-os-notes.md#rendering-and-animation). Two more things the wall does:

- A card never waits forever for its image: it reveals after 2.5 s or shows a placeholder.
- The spotlight is a shared-element style zoom. One `progress` value (0 to 1) drives the backdrop, the details column and the card. At 0 the full-size card is translated, rotated and scaled so it sits exactly on its wall slot; at 1 it is centred. Closing runs the same value back to 0, and the overlay only unmounts when that finishes, so the last photo shrinks back into the wall. When the photo changes while it's open, the outgoing card fades out while the new one fades in, and the backdrop doesn't move.

## The cf CLI beta workaround

Deploys use the new `cf` CLI and a typed `cloudflare.config.ts` per Worker instead of `wrangler.toml`. The beta has one rough edge: it looks for `@cloudflare/vite-plugin` only in the app's own `node_modules`, while the hoisted install puts it at the repo root.

`scripts/postinstall/link-cf-delegates.mjs` runs on `postinstall` and symlinks the plugin into `apps/api/node_modules` and `apps/web/node_modules` for any app that declares it. Once the CLI resolves packages the normal Node way, the script can go.

## The web app

The web app has three screens (the wall at `/`, the upload page at `/snap` and `/control`), so `app/routes.ts` switches on `location.pathname` instead of pulling in a router. Matching ignores case because the source card's QR code is upper case (`/GH`), which keeps the code coarse and easy to scan. The join QR code points to `/snap`; on a phone the wall shows an "Add your photo" button that goes there too. `/control` isn't linked anywhere and is locked with the passcode. Old addresses still work: `/admin` goes to `/control` and `/wall` to `/`, on the server through `_redirects` and in the app for `pnpm web:dev`. The passcode is kept in `sessionStorage` only, so it's gone when the tab closes.

Styling uses Tailwind v4 with a small token layer from `packages/web-ui`: `src/styles.css` imports `tailwindcss` and then `@boothwall/web-ui/styles.css`, which brings the font, the theme and an `@source` line so Tailwind also generates the package's classes. In the package, `theme/themes/boothwall.css` holds the neutral colours, fonts and radii and `theme/theme.css` maps Tailwind's theme onto those variables. The brand colours come from `boothwall.config.ts` and are inlined as CSS variables by `vite/plugins/boothwall.ts` in the app, which also fills in the event name and the `/gh` short link; another app provides the same variables its own way. The Worker serves the built assets with single-page-app fallback and has no server code.

## Abuse protection

A public upload endpoint is an invitation, so the API assumes someone will try:

- **Limits.** Venue Wi-Fi puts hundreds of people behind one IP, so the per-client limits only stop scripts: 60 uploads per 10 minutes and 500 per day, counting an IPv6 client by its /64 so it can't rotate addresses. Globally: at most 300 photos waiting for approval and 5,000 uploads per day. Once those are hit, everyone gets "try again later", so storage and cost stay bounded however many IPs someone has.
- **Real images only.** The request size is checked before the body is read, and the file type comes from the file's first bytes, not from what the browser claims. Images are served with `nosniff`, a `sandbox` content security policy and their checked type, so nothing uploaded can run.
- **Not a free image host.** Pending and hidden photos aren't public: the Control panel gets signed links to them. Approved photos are refused to other sites' pages, judged by `Referer` and `Sec-Fetch-Site`, so they can't be embedded elsewhere. They do carry `Cross-Origin-Resource-Policy: cross-origin`, because Vega's image loader enforces CORP and the TV app has no origin of its own.
- **Admin passcode lockout.** 10 wrong passcodes in 15 minutes lock that client out for the window.
- **Capped sockets.** The wall's Durable Object accepts at most 50 screens.
- **Reactions.** 600 taps a minute per client, only on approved photos, and at most one push per photo every 2 seconds. See [Reactions](#reactions).

## Things I'd change for a real product

- Real admin accounts instead of a shared passcode.
- Push the pending queue to the Control panel over the same WebSocket instead of polling.
- Automated image screening to help, not replace, the human host.
