# @boothwall/web

The standalone display, guest capture and basic host Control application. A Vite single-page app served by a Worker; rendering and capture use shared packages.

## Run it

```sh
pnpm dev
pnpm test
```

At the repository root, `pnpm demo` starts a local API, web app and approved sample photos. `VITE_API_URL` overrides the configured API for local development.

Routes: `/` displays the wall, `/snap` captures photos, `/control` opens basic host operations. `/wall` and `/admin` are explicit legacy aliases. Unknown paths show not-found. The root remains display on phone and desktop. `?demo` selects bundled photos; `?kiosk` suppresses display hints.

## Layout

Application route composition lives in `src/app`, local configuration in `src/config`, and standalone features under `src/features`. Capture and display wrappers compose `@boothwall/event-ui`; basic Control has its own components, hooks and data layer. The shared renderer is `@boothwall/wall-ui`, through React Native for Web. Pages use hooks, hooks use data clients, and folder barrels are their public import boundary.

Control covers manual approval and removal, the saved slideshow and guest-upload switches, **Photo call**, **Remote help** and **Next theme** for the walls, a live preview and the `/snap` QR. Event configuration stays in files, with compatibility for previously saved settings described in the [configuration guide](../../docs/customising.md#existing-saved-settings).
