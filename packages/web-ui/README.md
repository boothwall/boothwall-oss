# @boothwall/web-ui

The shared web kit for `apps/web` and any app built on the core: tokens, a Tailwind theme and a small set of domain-free React components. Data, links and copy come in as props.

```css
@import "tailwindcss";
@import "@boothwall/web-ui/styles.css";
```

The app supplies the brand colours (`--u-paper`, `--u-primary`, `--u-on-primary`, …; see `src/theme/themes/boothwall.css`) and the surface themes (`surfaceThemeCss()` from `@boothwall/shared`, inlined in the page head). Everything else is in the kit.

## Surface themes

Two themes, one source (`packages/shared/src/brand/surfaces/surfaces.constants.ts`): **public = navy, host tools = graphite.**

| Theme    | Where                                                                                   | Canvas    | Surfaces                                | Top glow                 |
| -------- | --------------------------------------------------------------------------------------- | --------- | --------------------------------------- | ------------------------ |
| `public` | Everything guests and visitors see: the wall, /snap and any public page a host app adds | `#0B1020` | info blue at 10% / 18%, solid `#1B2539` | amber left, violet right |
| `host`   | The tools a host works in: the Control panel and any host-side page an app adds         | `#111214` | white at 5% / 9%, solid `#1C1D21`       | none                     |

Public sits on `:root`; host applies under `data-surface="host"`, which an app sets on `<html>` (`applySurface("host")` at runtime, or statically in `index.html`) so the page, overscroll and portals all follow it. Anything that shows the real wall inside a host page (the Control panel's live preview) carries `data-surface="public"`. Logo, amber, fonts and status colours are the same on both.

## Tokens

Literal values live only in `src/theme/themes/boothwall.css`; `src/theme/theme.css` maps Tailwind's theme onto them. The colour, font, radius and shadow namespaces are replaced, so an off-brand class doesn't resolve.

### Colour

| Utility                                                 | Value                                   | Use                                                                  |
| ------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `canvas`                                                | `#0B1020` (from the app)                | Page and wall background                                             |
| `surface`, `surface-strong`                             | info blue at 10% / 18%                  | Cards and controls on the canvas (translucent)                       |
| `surface-solid`                                         | `#1B2539`                               | Menus and sheets that float over content                             |
| `line`                                                  | cream at 12%                            | Borders and dividers                                                 |
| `ink`, `ink-muted`, `ink-subtle`                        | `#FFFCF5`, `#C3CAD9`, `#9AA3B8`         | Text on the canvas                                                   |
| `primary`, `on-primary`, `primary-text`                 | `#CC4128`, white, `#FF6A4D`             | The one main action and the brand accent; the accent as text on dark |
| `success`, `waiting`, `info`, `danger`                  | `#70C39B` `#6685C9` `#8FA9E5` `#FF7A70` | Status on the canvas, always with a word or icon                     |
| `paper`, `paper-ink`                                    | `#FFFCF5`, `#17243A`                    | Polaroid paper and light cards, and their text                       |
| `primary-on-paper`, `info-on-paper`, `success-on-paper` | `#CC4128` `#345394` `#246348`           | Those roles as text on paper (4.7 to 7.3:1)                          |

Never set `primary` as text on the canvas (3.9:1); use `primary-text`. On paper, use `primary-on-paper`.

### Type

Outfit for everything, Kalam (`font-hand`) for handwritten captions. Each step carries its line height. Headings step up from the `lg` breakpoint; body and UI text don't.

| Utility        | Phone | Desktop | Use                                      |
| -------------- | ----- | ------- | ---------------------------------------- |
| `text-display` | 32    | 48      | The page's one headline (Outfit 700–800) |
| `text-title`   | 22    | 28      | Section and card headings                |
| `text-body`    | 17    | 17      | Paragraphs, large buttons                |
| `text-ui`      | 15    | 15      | Controls, list rows                      |
| `text-label`   | 13    | 13      | Meta, hints, small buttons               |
| `text-hand`    | 20    | 22      | Kalam photo captions                     |

Sentence case everywhere; no tracked all-caps eyebrows.

**TV (1080p, from the brand guide; the wall's own tokens are in `packages/wall-ui`):** headline 56–72, section 40–48, controls 30–36, body 28–32, captions 30–36. Check readability from 3 metres.

### Radius

| Utility           | Value | Use                               |
| ----------------- | ----- | --------------------------------- |
| `rounded-card`    | 12    | Containers, cards, inputs         |
| `rounded-control` | 12    | Inputs and grouped controls       |
| `rounded-tile`    | 8     | Tiles, thumbnails, segments       |
| `rounded-paper`   | 4     | The polaroid card (the logo's r4) |
| `rounded-photo`   | 2     | The photo inside a polaroid       |
| `rounded-pill`    | full  | Buttons, chips and status only    |

### Layout

One grid for every web page, here and in apps built on the kit. Tailwind's 4px step scale stays for everything inside a block; these tokens place the blocks:

| Utility                         | Phone (< 384) | Phone | Tablet (≥ 640) | Desktop (≥ 1024) | Use                                                    |
| ------------------------------- | ------------- | ----- | -------------- | ---------------- | ------------------------------------------------------ |
| `px-gutter`                     | 16            | 20    | 32             | 40               | The page's left and right padding, both sides the same |
| `h-header`                      | 56            | 56    | 56             | 64               | The header bar; the logo is centred in it              |
| `pt-header-gap`                 | 24            | 24    | 32             | 40               | From the header's bottom to the first block            |
| `gap-block`, `pb-block`, …      | 24            | 24    | 32             | 32               | Between blocks in a section                            |
| `py-section`, `mb-section`, …   | 48            | 48    | 48             | 80               | Between sections                                       |
| `max-w-page`                    | 1216 (76rem)  |       |                |                  | The page column, gutters included (content 1136 wide)  |
| `max-w-narrow`                  | 480 (30rem)   |       |                |                  | A phone-first page's column on a large screen          |
| `pt-safe-top`, `pb-safe-bottom` |               |       |                |                  | Room for a notch and the home bar                      |
| `bg-page-glow`                  |               |       |                |                  | The guest pages' top light; transparent on host pages  |

`PageShell` is the frame: gutter, `BrandHeader` at `h-header`, `pt-header-gap`, then the page. Pages that draw their own full-width bars (a sticky top bar, a landing hero) use `PageContainer` (`max-w-page` + `px-gutter`), so the logo's left edge and the content's left edge are the same line on every page: 20px on a 390 phone, 152px on a 1440 screen. Pass `BrandHeader` an `eventLogo` for two brands in one bar: the logo left (24px, 34px from lg), a rule and the event's logo right (20px, 30px), and the action in a row under the bar.

**Logo clear space.** The brand asks for at least 24 symbol units, about 15% of the symbol's width, around the mark. In the lockup the symbol is about as wide as the lockup is tall, so that is about 15% of the logo's height: 5px at 32px. The header gives 12px above and below (32 in 56, 40 in 64), the label beside it sits 10px away, and nothing else shares the row closer than the gutter. Tilted polaroids next to a header keep their rotated corners inside the gutter and below the header gap (pad the collage, don't let it bleed).

## Layout

`src/` is the kit's layers, each importing only downwards: `foundations/` (`cn`, `applySurface`, `useSwipeToClose`) → `primitives/` → `composites/` → `patterns/` → `shells/`, with `brand/` beside them for the pieces that carry the logo. One folder per component with its own `index.ts`; the layer barrels add up to the package root. Inside the package, a file reaches another layer through `#foundations`, `#primitives` and so on (`imports` in `package.json`), and a sibling folder through `../name`, so nothing climbs further than one level. `theme/` holds the CSS.

## Components

| Component                                                                                   | What it is                                                                                                                             |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                                    | `variant` primary (the brand colour) · secondary (surface) · ghost · destructive; `size` sm 36 / md 44 / lg 56; `fullWidth`; `loading` |
| `IconButton`                                                                                | Round, one icon; `label` is required and becomes the accessible name                                                                   |
| `buttonVariants`                                                                            | The same classes for a link styled as a button                                                                                         |
| `Polaroid`                                                                                  | Brand geometry (7 : 31 paper), `tilt` in degrees (keep within ±1.5–4), `badge` corner slot, Kalam `caption`                            |
| `LogoLockup`                                                                                | `variant` horizontal · symbol · self-hosted; `tone` on-dark · on-light; `size` sm (web minimum) to tv                                  |
| `TvFrame`                                                                                   | A thin-bezel TV that fills its container; children fill the 16:9 screen                                                                |
| `EmptyState`                                                                                | A blank polaroid or an icon, title, one line, one action                                                                               |
| `PageShell`                                                                                 | The page frame on the layout grid: header, gap, main, and the source credit only when `source` is passed; the top glow on guest pages  |
| `PageContainer`                                                                             | The page column (`max-w-page` + `px-gutter`) for pages with their own full-width bars                                                  |
| `applySurface`                                                                              | Puts the document on the public or host surface theme and updates the browser theme colour                                             |
| `SourceFooter`                                                                              | The GitHub credit (off unless a page opts in)                                                                                          |
| `SegmentedControl`                                                                          | One choice of a few, radio-based; selected is a raised surface with a brand-colour ring                                                |
| `segmentGroupVariants`, `segmentVariants`                                                   | The same look for an app's own tab rows (`role="tab"` buttons), so every selection matches                                             |
| `EmptyPolaroid`                                                                             | The one "nothing here yet" picture: a blank tilted polaroid; `mark` add (a plus, "add yours") or blank                                 |
| `Dialog`, `DisclosureMenu`, `CountButton`, `PhotoImage`, `QrCode`, `Spinner`, settings rows | Supporting primitives                                                                                                                  |

Rules: one primary button per screen; disabled is 40% opacity, and a disabled primary drops its fill for an outline and label in the brand colour at 55% (a faded fill turns muddy on navy and graphite); every focusable element shows the cream focus outline.

## Preview

Every component on one page, for screenshots and review:

```sh
pnpm --filter @boothwall/web-ui preview:kit
```
