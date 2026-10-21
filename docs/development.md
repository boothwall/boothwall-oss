# Development

How to run BoothWall from source and work on it.

## Getting started

Follow [Try it](../README.md#try-it) in the README. You don't need a Fire TV or a Cloudflare account: the Vega Virtual Device runs on a Mac, and the web wall runs in any browser. `pnpm demo` runs everything on your machine; set `demo: true` in `packages/shared/src/config/boothwall.config.ts` (or add `?demo` in the browser) to run the wall on the bundled photos with no API at all.

## Commands

| Command                                              | What it does                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm demo`                                          | The API and the web app locally, with demo photos and the passcode printed (see [below](#running-the-api-locally))                            |
| `pnpm demo --lan`                                    | The same on your machine's network address, for a phone, a Fire TV or the Virtual Device                                                      |
| `pnpm try`                                           | `pnpm demo --lan` plus the TV app, built and opened on a running Virtual Device                                                               |
| `pnpm web:dev`                                       | The web app: the wall at `/`, the upload page at `/snap`, the Control panel at `/control`                                                     |
| `pnpm api:dev`                                       | The API on your machine, no Cloudflare account needed (see [below](#running-the-api-locally))                                                 |
| `pnpm tv:build:debug` / `tv:build:release`           | Build the TV app, one `.vpkg` per architecture                                                                                                |
| `pnpm tv:vvd:start:1080` / `tv:vvd:restart:1080`     | Start or restart the Virtual Device at 1080p (restart also relaunches the installed app; it doesn't rebuild)                                  |
| `pnpm tv:run:vvd`                                    | Install and launch the Apple Silicon debug build on the Virtual Device (on an Intel Mac, use `pnpm try`)                                      |
| `pnpm tv:start`                                      | Metro, for a debug build that loads its JavaScript from your machine                                                                          |
| `pnpm remote`                                        | A remote in your browser at http://localhost:4400 for the Virtual Device; `VEGA_DEVICE=<serial>` sends to a Fire TV Stick                     |
| `pnpm remote:vega`                                   | Run the latest [Vega web remote](https://github.com/boothwall/vega-web-remote) from GitHub: device picker, media keys, held OK and text entry |
| `pnpm boothwall setup`                               | One-time Cloudflare setup and first deploy                                                                                                    |
| `pnpm boothwall deploy`                              | Apply migrations, then redeploy the API and the web app                                                                                       |
| `pnpm boothwall example [name]`                      | List the examples, or apply one's config and artwork                                                                                          |
| `pnpm boothwall settings-preview` / `settings-apply` | Move settings saved by an older version into the config ([guide](config-migration.md))                                                        |

## Running the API locally

No Cloudflare account needed. `cf dev` simulates D1, R2 and the Durable Object, and keeps their data in `apps/api/.cloudflare/state`.

The quick way is `pnpm demo`. It writes a passcode to `apps/api/.dev.vars` if there isn't one, applies the migrations, starts the API and the web app (each on the first free port from 8787 and 5173), points the web app and the wall at the local API with `VITE_API_URL`, and on a fresh database adds twelve approved demo photos (it refuses if an older saved setting still turns on automated review). Then it prints the addresses and the passcode. Locally the API accepts any `localhost` port, so a second dev server on another port works too.

By hand:

```sh
cp apps/api/.dev.vars.example apps/api/.dev.vars   # then fill in the two secrets below
pnpm --filter @boothwall/api db:migrate:local      # create the local database
pnpm api:dev                                       # serves the API on the URL it prints
```

`.dev.vars.example` leaves `ADMIN_TOKEN`, the Control passcode, empty on purpose, so nobody deploys a passcode that's printed in a public repo. For `pnpm api:dev` on its own, set it yourself, and add a separate random `CLIENT_FINGERPRINT_KEY` of 32 or more characters (never the passcode): without that key, uploads and Control sign-ins fail. `pnpm demo` and `pnpm boothwall setup` fill in both for you when they're missing. With `ADMIN_TOKEN` empty, `pnpm demo` writes an 8-digit passcode and setup asks for one of 12 or more characters (Enter makes one). Setup refuses the placeholder passcode that older copies of the example carried.

Control panel routes take the token as `Authorization: Bearer <ADMIN_TOKEN>`. To use the upload page and the Control panel against it, run `VITE_API_URL=<the printed URL> pnpm --filter @boothwall/web exec vite` and open `/` for the display, `/snap` for guests or `/control` for hosts. The wall in the browser follows `VITE_API_URL` too. The TV app has no environment variables, so to point it at your local API, change `urls.api` in the config for the session and don't commit it. Run the migrate step again after pulling new migrations. The standalone API has no automated review provider; see [older review settings](smart-moderation.md) when upgrading saved local data.

## Changing the database

Edit `apps/api/src/db/schema.ts`, run `pnpm --filter @boothwall/api db:generate`, then apply the new migration with `pnpm --filter @boothwall/api db:migrate:local` (and `pnpm boothwall deploy` for your Cloudflare account).
