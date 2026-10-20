# @boothwall/shared

What every app agrees on: the config, the brand's colours and surfaces, and the schemas of everything that crosses the wire between the API, the web app and the TV.

Plain TypeScript with zod, no React. Node loads it as it is (the `cf` CLI reads the config through it), so every relative import inside carries its `.ts` extension.

## Entries

| Import                                      | What it gives                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `@boothwall/shared`                         | the schemas, types and helpers of each concept below                                |
| `@boothwall/shared/config`                  | `boothwallConfig`, validated once, and its defaults                                 |
| `@boothwall/shared/config/boothwall.config` | the config file itself, for tools that must read it before anything else            |
| `@boothwall/shared/brand`                   | the colour maths (`readableOn`, `textOn`, `mix`), the surfaces and the web manifest |

## Layout

```
src/
  brand/        color, surfaces, manifest
  config/       boothwall.config.ts (the one file to edit), schema, defaults, event
  control/      the Control panel's events and photo actions
  moderation/   photo analysis results
  settings/     wall settings, categories, smart moderation
  wall/         photos, reactions, events, identity, wall target, received settings
```

Each folder is one concept with its own `index.ts`; files are named `<concept>.<role>.ts` (`photo.schemas.ts`, `wall-id.utils.ts`) and tests sit next to what they test.
