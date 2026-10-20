# @boothwall/i18n

Languages, translations and regional formatting for every BoothWall surface (web, TV, Workers, static pages). It is plain TypeScript: no DOM, no React Native and no hosting assumptions in the core. Translations use [Lingui](https://lingui.dev) catalogues compiled ahead of time, so no message parser ships to any client.

## Where translations live

There is one home per tree.

- **The words.** This package's `messages/<language>/<area>.json` holds the open-source words: guest pages, the wall and the TV. An app built on this package keeps its own words in its own package, laid out the same way, and depends on this one.
- **What you edit.** `messages/` is the only place to edit text. Each file is a flat object of id → [ICU message](https://lingui.dev/guides/message-format), and ids start with the area (`guest.photos`).
- **What is generated.** `src/messages/` is generated. Never edit it.
- **The source of truth.** English (`en`) is the source of truth.
  - Another language may leave out a whole area; English fills in at runtime.
  - Inside an area, it must have every id with the same `{arguments}`, or compiling fails.

```sh
pnpm messages                                          # this package: compile after editing
pnpm exec boothwall-messages messages src/messages --check   # other packages; this one's test runs the check
```

## Entries

| Import                                       | What it gives                                                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@boothwall/i18n`                            | `LANGUAGES`, `isLanguage` / `parseLanguage`, `pickLanguage`, `formatLocale`, `createFormatters`, `pluralCategory`, time-zone helpers, `createI18n` / `activateLanguage` / `createTranslator` |
| `@boothwall/i18n/web`                        | `?lang=`, the browser's languages, a validated `localStorage` choice, `<html lang dir>`                                                                                                      |
| `@boothwall/i18n/react`                      | `LanguageProvider`, `useLanguage`, `useFormatters`, Lingui's `Trans` and `useLingui`                                                                                                         |
| `@boothwall/i18n/native`                     | `nativeDeviceLocale(getSystemLocale)`: the TV app injects its platform's locale                                                                                                              |
| `@boothwall/i18n/messages/<language>/<area>` | the open-source words, compiled (`messages/index` has the lazy loaders and `MessageValues`)                                                                                                  |
| `@boothwall/i18n/compiler`                   | `compileMessages`, also available as the `boothwall-messages` command                                                                                                                        |

## Rules

- **Pass an explicit locale and time zone to every formatter.** Event times use the event's zone. A calendar day (`"2026-10-24"`) never moves between zones.
- **A device's region only refines how numbers and dates look.** It never picks the language.
- **Validate any language that crosses a boundary with `parseLanguage`** (schemas use `z.enum(LANGUAGES)`). A bad tag never reaches `Intl`.
- **Give each app its own Lingui instance** (`createI18n`), never Lingui's global.
