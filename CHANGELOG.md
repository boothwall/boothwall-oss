# Changelog

Notable changes to BoothWall, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [3.1.0] - 2026-10-21

### Added

- `pnpm demo --lan` opens with a live session: each startup step with its measured time, then a ready card with the guest QR beside the guest, host and wall links and the local passcode. While it runs, new uploads and approvals appear in the terminal as they happen, and single keys open the wall (`w`), Control (`c`) or the guest page (`s`), copy the passcode (`p`), show TV setup (`t`), reprint the card (`r`) or stop (`q`).
- `pnpm remote:vega` launches [Vega web remote](https://github.com/boothwall/vega-web-remote) v0.2.2, pinned to its source commit: a full remote in a browser tab for the Virtual Device or a Fire TV in developer mode, with a device picker, media keys, held OK and typing onto the TV. It works with any Vega app. `pnpm try` mentions it once the TV app is open; the README, the development guide and the event guide describe it. The existing `pnpm remote` stays.

### Changed

- The demo's terminal output uses the OSS lockup colours and a smaller guest QR, stacked under the guest link on narrow terminals. Redirected output, CI, `TERM=dumb` and `NO_COLOR` keep plain text with the full links and no QR, shortcuts or live feed.

## [3.0.4] - 2026-10-20

### Fixed

- The guest page keeps checking its photo after approval, including auto-approved uploads, so a later host removal replaces the live message. Token-backed checks retain the existing five-second interval and 15-minute limit.

## [3.0.3] - 2026-10-20

### Changed

- The wall's repo card (`wall.source`) is quieter: the repo's name beside the host's mark, which no longer cuts it off, and a bigger QR beside "Open source", why to scan and the license, in smaller type so it doesn't compete with the photos.
- The social preview image names the repo at github.com/boothwall/boothwall-oss.

## [3.0.2] - 2026-10-20

### Changed

- The logos in `brand/logos/`, the round icon, TV banner and splash sources in `brand/sources/`, and the logo in the wall's classic header use the current BoothWall mark: four tiles with the newest photo lifting off as a card. File names and sizes stay the same.

## [3.0.1] - 2026-10-20

### Fixed

- The badge beside the event title stays on one line on a Fire TV Stick; its last letter used to wrap onto a second line.
- The README's logo follows GitHub's light or dark theme, so it stays readable when your system and GitHub use different themes.

## [3.0.0] - 2026-10-20

One event photo wall you run yourself: a Vega OS app for the Fire TV, a web display, a guest upload page and a Control panel, all driven by one config file. This edition's native TV app is Vega OS only, and you build it yourself: there is no store build and no pairing, because the app you build already knows its wall. The room can work the wall from the remote, a photo call brings a burst of new photos, and `pnpm try` puts a wall on the Vega Virtual Device in one command.

### Added

- A photo call: hold OK on the remote, or press **Photo call** in the Control panel, for a minute with a big join QR, a mission from your categories, a countdown and a count of the photos that reach the wall. It ends with a card showing the photos it brought. Control's button starts one on the browser wall too, where Escape ends it.
- The Fire TV remote's Play/Pause and Next/Previous keys drive the wall through Vega Media Controls, the route Alexa's "pause" and "next" take too. The TV app keeps the Vega screensaver off while the wall is on screen.
- A remote help card on the TV app shows every button and what it does. Menu opens it (in demo mode Menu steps through the themes instead), and so does **Remote help** in the Control panel; the wall itself opens clean. It closes after about 10 seconds or on any key, and that key does nothing else. **Remote help** shows the same card on the browser wall, where a click closes it too.
- Guests hear back after sending: their page says when the photo is live, shows a "Still waiting" notice after 15 seconds, and says "Not this time." with one button to send another photo when the host rejects it. Behind it is a new `GET /photos/:id/status`, answered only with the guest's own delete token.
- Optional looks for the wall, under `wall` in the config: a split header with your lockup on the left and the event's name, year, venue, hashtag and badge on the right in two rows, a filled announcement that catches the eye once a minute, a source card that names the repo, and `wall.motion: "signal"`, faint light ribbons and particles behind the photos with a soft light that carries each new photo to its card. Without them the wall looks as before. See [docs/customising.md](docs/customising.md).
- Two brands in one bar on the phone pages and Control: the optional `event.wordmark` keeps BoothWall's lockup on the left and puts the event's wordmark on the right.
- `theme.primaryOnDark`: an optional second brand colour for accent text on the dark wall and pages, beside `theme.primary` for buttons.
- **Next theme** in the Control panel steps the TV app and the browser wall through the four themes, until the app restarts or the page reloads; `?theme=party` opens the browser wall on a theme. Neither changes the config. In demo mode the remote's Menu button does the same and names the `settings.theme` line for each.
- `pnpm try` runs `pnpm demo --lan`, points the config at it until you stop it, and builds and opens the TV app on a running Vega Virtual Device.
- `pnpm demo --lan` serves the local wall on your network address, so a phone, a Fire TV and the Vega Virtual Device can join it, and prints the `urls` to build the TV app with.
- The web app can be served under a path: give `urls.web` one (for example `https://example.com/wall`) and its pages, assets and QR codes live under it. See [docs/customising.md](docs/customising.md).
- On a phone held upright, the browser wall asks you to turn it sideways and keeps **Add your photo** at hand; turned sideways, the wall appears on its own, with the button in its own strip below it.
- The wall steps through photos a page at a time in reading order, with a sweep and a page number banner on each turn.
- Handwritten polaroid captions that size themselves to fit on one line.
- Desktop layouts for the upload page, with a live preview of the wall.
- Reactions in the API: a client can send heart, fire, laugh or clap on an approved photo (`POST /photos/:id/reactions`); the guest page doesn't offer them. Counts ride along with each photo and reach the screens as `photo.reactions`, batched to one event per photo every 2 seconds.
- `createApp({ resolveWall })` lets the API work out which wall a request is for. Out of the box there is one wall, `default`, so a running wall behaves exactly as before.
- For apps built on the wall package: `UniversalPaletteProvider` draws the universal theme in a host's own colours, and an optional copy object gives the wall its words in another language.
- `packages/web-ui`: the web app's shared UI pieces in their own package.

### Changed

- The Control panel is a booth desk. On a laptop the waiting queue and today's numbers sit on the left; a live preview of the wall, switches for the slideshow and guest uploads, **Photo call**, **Remote help** and **Next theme**, and the guest invite sit on the right. A phone shows it as three tabs, each at its own address: `/control`, `/control/live` and `/control/guests`. It has a new unlock screen.
- This edition looks like itself by default: BoothWall's lockup with a tomato "Wall" and an **OSS** pill, tomato as the brand colour (`#CC4128`, with `#FF6A4D` for text on dark), and its own app icon and favicons. The TV app is called **BoothWall Open**. Remove `wall` from the config for the classic header ([docs/customising.md](docs/customising.md#the-default-look)).
- The "Scan for the source" card is off by default on the TV as well as in the browser: `credits: true` shows it. The phone pages keep their source link, "BoothWall OSS · MIT · source on GitHub", unless `credits: false`.
- The TV app shows the one wall from `tv` in `boothwall.config.ts`. Build it yourself and never publish it: there is no code entry, menu or store build.
- The public demo moved to [oss.boothwall.com/demo](https://oss.boothwall.com/demo/), beside the project's own site with its guides at [oss.boothwall.com](https://oss.boothwall.com).
- The TV's join card shows the address under its QR code only when it fits on one line; a long one is left to the QR.
- The guest's phone shows the whole caption on the posted photo, a step smaller when it's long.
- Picking a category on the upload page is optional when there is a catch-all: the photo goes there until the guest picks one. "Remove my photo" is a quiet text link now.
- The phone pages' header keeps the same space above it as at its sides, plus the phone's safe area.
- Event-neutral defaults: the demo is "BoothWall Live Demo" with `#BoothWall`, its starting categories describe the crowd (first time here, regulars, on the team, friends & family, and a catch-all, just visiting) and the guest and host copy talks about the event and the big screen instead of a booth or a Fire TV.
- The chip beside the logo comes from the new optional `badge` config field, like "Built on Vega OS". The default config has none.
- Presentation, branding and categories come from `boothwall.config.ts`. Settings saved by older versions keep working until you migrate them; see [docs/config-migration.md](docs/config-migration.md).
- The branded example is now [`examples/conference-booth`](examples/conference-booth), a made-up developer conference with photo missions as its categories, the conference theme, and its own logo, colours, icons and backdrop rendered from SVG sources in the example. `pnpm boothwall example` refuses an example with files for folders the repo doesn't have.
- `pnpm demo` spreads its sample photos over your own categories when they differ from the samples'.
- With a local web app, the source card's QR points at the repository.
- Screens fill in settings an older API doesn't send yet with the config's values, so a screen can be updated before its API.
- New README images; development setup moved from CONTRIBUTING into [docs/development.md](docs/development.md); "Running a booth" is now [Running an event](docs/running-an-event.md).

### Fixed

- Guest uploads work from plain-http pages on a local network, where browsers don't provide `crypto.randomUUID`.
- Photos stay visible when the remote returns to a page before its outgoing cards have faded.
- While an announcement is up, the "Opens next" cue steps aside so the announcement keeps the row's full width.
- A held OK no longer sticks after a missed key release, and an open photo call or overlay takes the remote's keys first.

### Removed

- Photos of real people and event signage, from the demo photos, the README images and the examples. The demo photos are all generated images now.

### Upgrading

Five migrations come with this release; `pnpm boothwall deploy` (or `pnpm boothwall migrate`) applies them.

- `0006` adds the `settings` table, where Control's slideshow and guest-upload switches are saved.
- `0007` adds a wall id and reaction counts to photos. Existing photos join the `default` wall.
- `0008` adds the `photo_analysis` table. This edition doesn't write to it.
- `0009` changes how the API identifies clients for abuse limits, to a keyed daily fingerprint. The API needs a new secret, `CLIENT_FINGERPRINT_KEY`; setup and the local demo create one. It renames stored columns, so an existing installation must stop traffic, apply it and switch the code together: follow [docs/client-fingerprint-migration.md](docs/client-fingerprint-migration.md).
- `0010` protects settings that come from the config file. Stored settings are unchanged; see [docs/config-migration.md](docs/config-migration.md).

## [2.0.0] - 2026-10-10 [YANKED]

This release was withdrawn shortly after it went out: use 3.0.0, which includes everything in it. Its tag and GitHub release stay for the record.

### Added

- Renamed to BoothWall, with every app driven by one config file, `packages/shared/src/config/boothwall.config.ts`, checked against a schema on every build.
- The `pnpm boothwall` CLI: `setup` creates the Cloudflare resources, sets the booth passcode and deploys; `deploy`, `migrate` and `example` cover the rest.
- The wall moved into `packages/wall-ui` and runs on the web through React Native for Web as well as on Fire TV.
- The web app serves the wall at `/`, the upload page at `/snap` and the Control panel at `/control`, with an approval queue, photo management in bulk, live numbers and a remote for the TV.
- The default BoothWall artwork in `brand/`, and a fully branded setup in `examples/` to show what a custom wall looks like.
- Docs for running a booth, customising, the architecture and Vega OS.

## [1.0.0] - 2026-10-08

Live Wall, the photo wall I built on my own as a booth demo and first showed at next.app devCon 2026 in Berlin. It lives on the [`devcon-2026`](https://github.com/boothwall/boothwall-oss/tree/devcon-2026) branch.

### Added

- `apps/tv`: a React Native 0.83 app for Fire TV on Vega OS with an animated polaroid collage, a spotlight slideshow, live arrivals and a remote that reaches every photo.
- `apps/web`: the phone upload page and a hidden admin page for approvals.
- `apps/api`: a Hono API on Cloudflare Workers with D1, R2 and a hibernating Durable Object that pushes new photos to every wall.
- `packages/shared`: the contracts all three apps share.

[Unreleased]: https://github.com/boothwall/boothwall-oss/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/boothwall/boothwall-oss/compare/v3.0.4...v3.1.0
[3.0.4]: https://github.com/boothwall/boothwall-oss/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/boothwall/boothwall-oss/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/boothwall/boothwall-oss/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/boothwall/boothwall-oss/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/boothwall/boothwall-oss/releases/tag/v3.0.0
[2.0.0]: https://github.com/boothwall/boothwall-oss/releases/tag/v2.0.0
[1.0.0]: https://github.com/boothwall/boothwall-oss/releases/tag/v1.0.0
