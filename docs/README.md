# BoothWall docs

Start with the [root README](../README.md): what BoothWall is, the live demo, and the one-command local run.

| Read                                                            | When                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Customising BoothWall](customising.md)                         | You want your own wall: the config file, the brand images, the themes, the copy.      |
| [Running an event](running-an-event.md)                         | The day itself: the remote, the Control desk, what the hosts do when a photo arrives. |
| [Older review settings](smart-moderation.md)                    | Upgrading saved review settings to standalone manual approval.                        |
| [Migrating saved settings](config-migration.md)                 | Moving settings an older build saved in the database into the config.                 |
| [Updating client fingerprints](client-fingerprint-migration.md) | Upgrading an existing installation through migration `0009`.                          |
| [Development](development.md)                                   | Running it from source: the commands, the local API and database changes.             |
| [Architecture notes](architecture.md)                           | The decisions behind the code and why they were made.                                 |
| [Building for Vega OS](vega-os-notes.md)                        | What I learnt about Vega OS, the Virtual Device and the Fire TV Stick along the way.  |

Most apps and packages have a README beside their `package.json`: [api](../apps/api/README.md), [web](../apps/web/README.md), [tv](../apps/tv-vega/README.md), [shared](../packages/shared/README.md), [wall-ui](../packages/wall-ui/README.md), [web-ui](../packages/web-ui/README.md), [i18n](../packages/i18n/README.md), [brand](../brand/README.md), [scripts](../scripts/README.md). `packages/event-ui`, the browser pages around the wall, is described in [How it's built](architecture.md#frontend-feature-layout).
