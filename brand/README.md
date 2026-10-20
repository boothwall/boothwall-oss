# BoothWall brand

The default look of BoothWall, called "Moments arriving". Two overlapping polaroids are two guests' photos becoming one shared wall; the three amber strokes are the spark when a photo lands on the big screen. The front card keeps its thick paper bottom edge so it reads as a polaroid, not a generic square.

Everything here is MIT, like the rest of the repo. To run a wall under your own brand, see [docs/customising.md](../docs/customising.md); you don't need to change anything in this folder.

## Logos

All logos are SVG with outlined lettering, so they need no font.

| File                                                | Use it for                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `logos/boothwall-on-dark.svg`                       | The default: headers and footers on the navy canvas                                      |
| `logos/boothwall-on-light.svg`                      | The same lockup on white or paper                                                        |
| `logos/boothwall-mono-white.svg`, `-black`          | One-colour print, engraving, or on a photo                                               |
| `logos/boothwall-symbol-on-dark.svg`, `-light`      | Square spaces: avatars, app icons, a corner mark                                         |
| `logos/boothwall-symbol-mono-white.svg`, `-black`   | The symbol in one colour                                                                 |
| `logos/boothwall-wordmark-on-dark.svg`, `-light`    | The name alone, where the symbol already shows nearby                                    |
| `logos/boothwall-self-hosted-on-dark.svg`, `-light` | This edition, labelled "Self-hosted", e.g. in docs and talks                             |
| `logos/boothwall-open-source-on-dark.svg`, `-light` | This edition's own lockup with its OSS pill: the wall's split header and the phone pages |

Booth is cream on dark and navy on light. Wall is amber in every colour version, except in the open-source lockup, where Wall, the sparkle and the pill are tomato (`#D9452B`, the logo's ink; the interface uses `#CC4128`, see [Colours](#colours)) so this edition is easy to tell apart.

- **Clear space:** at least 15% of the mark's width on every side.
- **Smallest size:** the horizontal lockup 170 px wide on the web and 380 px on a 1080p TV (420 to 520 px for a wall header); the symbol 32 px high. Below that, use the favicon, which simplifies the mark to one card.
- The self-hosted label is small by design. Use that lockup at 400 px wide or more, or set the label as text beside the plain logo.
- Don't stretch the mark, recolour the photo, drop the thick bottom edge, add glows or shadows, or squeeze the full lockup into a small square.

## Colours

| Role                           | Hex                           | Where it goes                                            |
| ------------------------------ | ----------------------------- | -------------------------------------------------------- |
| Canvas                         | `#0B1020`                     | The page and wall background                             |
| Surface                        | `#1B2539`                     | Cards and panels on the canvas                           |
| Text, Paper                    | `#FFFCF5`                     | Text on dark; the polaroid paper and light cards         |
| Primary (tomato)               | `#CC4128`                     | The main action and the brand accent; white labels on it |
| Primary on dark                | `#FF6A4D`                     | The accent as text on the canvas and the wall            |
| Photo cyan, blue, violet       | `#35CEEF` `#148CFF` `#6555E8` | Inside the logo only, never for text                     |
| Approved                       | `#70C39B`                     | Approved and success                                     |
| Waiting                        | `#6685C9`                     | In the queue, waiting for a host                         |
| Info                           | `#8FA9E5`                     | Notes and hints                                          |
| Text on light                  | `#17243A`                     | Body text on white and paper                             |
| Tomato, info, success on light | `#CC4128` `#345394` `#246348` | Their roles as text on white and paper                   |

Contrast (WCAG): text on canvas 18.5:1, text on surface 15.0:1, the on-dark accent on canvas 6.7:1, white on tomato 4.8:1, the three on-light colours on paper 4.7 to 7.3:1. **Tomato on the canvas is only 3.9:1**, enough for fills and rings but not for text: set accent text on dark in `#FF6A4D`. Don't show a status by colour alone: approved, waiting and declined always carry a word or an icon too.

## Type

- **Outfit** (700 to 800) for headings, 400 to 600 for the interface.
- **Kalam** for handwritten photo captions.

Both are free Google Fonts under the SIL Open Font License. The web apps load them from npm (`@fontsource-variable/outfit`, `@fontsource/kalam`); the TV app bundles its font files, with their licenses, in `apps/tv-vega/assets/fonts`. On a 1080p TV: headlines 56 to 72 px, controls 30 to 36 px, body and captions 28 to 36 px. On a phone: headings 28 to 36 px, body 16 to 18 px. Check TV text from 3 metres away.

## Words

- Tagline: **Your moment on the big screen.**
- Next to a QR code: **Take a photo. Get approved. See it land here.**

## Files the apps use

The apps don't read this folder; they use rendered copies next to their code, which you can replace with your own artwork under the same names ([docs/customising.md](../docs/customising.md)). `node scripts/brand/render.mjs` renders them all again (it needs `rsvg-convert` and ImageMagick). The canvas colour comes from `packages/shared/src/brand/surfaces/surfaces.constants.ts`, the one place it is set: each source in `sources/` marks its background with `class="canvas"`, and the colour written there is only a preview.

| Source                                             | Rendered to                                                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `logos/boothwall-on-dark.svg`                      | The wall's classic header and its event logo (`packages/wall-ui/src/assets/brand/logo.png`)                          |
| `logos/boothwall-open-source-on-dark.svg`          | The phone pages (`apps/web/src/assets/brand/logo.png`)                                                               |
| `logos/boothwall-open-source-on-light.svg`         | The light printables (`apps/web/src/assets/brand/logo-on-light.png`)                                                 |
| `sources/backdrop-twinkle.svg`, `sources/glow.svg` | The twinkle sprite over the wall's backdrop photo (440×560 PNG) and the glow behind the phone pages (1600×1000 JPEG) |
| `sources/favicon.svg`, `sources/app-icon*.svg`     | Favicons and install icons in `apps/web/public`, the Vega OS app icon                                                |

The split header's lockup (`packages/wall-ui/src/assets/brand/lockup.png`, 1785×288) is the approved render of `logos/boothwall-open-source-on-dark.svg` and is kept as it is; `render.mjs` doesn't redraw it. That SVG is the kit's W1 on-dark lockup with Wall and the sparkle in tomato and the OSS pill set after the name, its letters the TV icon pill's own O and S; the on-light one is built the same way from the kit's on-light lockup.

The web manifest is built from the event name and the canvas colour by the web app's Vite plugin.

The app and install icons are this edition's own: the mark over the logo and an OSS pill, on ink, edge to edge, so the app stands apart on a TV's app row. Fire TV's Home row crops the 512 px app icon to its middle 512×288, so `sources/app-icon-tv.svg` keeps everything inside that band.
