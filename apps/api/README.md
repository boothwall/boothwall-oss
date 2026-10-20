# @boothwall/api

The wall's backend: one Cloudflare Worker with a D1 database, an R2 bucket for the photos and a Durable Object per wall for the live feed. Guests' phones upload to it, the Control panel approves through it, and the TV and the web wall follow it over a socket.

## Run it

```sh
pnpm dev                  # cf dev, the API alone at http://localhost:8787
pnpm db:migrate:local     # apply migrations to the local D1
pnpm test                 # vitest; `typecheck` and `lint` as usual
```

`pnpm demo` at the repo root runs the API together with the web app and seeds demo photos. Deploying goes through `pnpm boothwall setup` once and `pnpm boothwall deploy` after that (see the root README); `cf deploy` here does the same for the API alone.

Local secrets live in `.dev.vars` (`ADMIN_TOKEN` is the Control passcode; `pnpm demo` writes one if the file is missing). The bindings and the Worker's name come from `cloudflare.config.ts`, which reads `packages/shared/src/config/boothwall.config.ts`.

## Layout

```
src/
  index.ts        the Worker entry
  app/            the Hono app: routing, middleware order
  config/         environment validation per request
  contracts/      neutral binding and request collaborator types
  core/           http (responses, request ip), runtime (durable objects, scheduling), security (tokens, rate keys)
  db/             drizzle schema and the D1 client
  host/           what an app embedding the API mounts, for more than one wall
  jobs/           scheduled work: purging expired photos
  modules/        one folder per feature, each with http/, domain/, data/ (realtime/ where a wall needs a socket,
                  adapters/ for an outside service)
    auth, photo, reaction, settings, wall
migrations/       D1 migrations, applied by `pnpm boothwall migrate`
```

Inside a module the layers only point down: routes call the service, the service calls the repo. Modules talk to each other through their `index.ts`.
