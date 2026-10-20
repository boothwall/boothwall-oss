# @boothwall/wall-ui

The portable wall renderer, shared by the Vega OS TV app (`apps/tv-vega`) and the web wall (`apps/web`, through React Native for Web): the collage, the spotlight, the join panel and the offline cache.

## Canvas

The wall is drawn on a 960 × 540 dp canvas. Vega scales it to 1080p, so every dp is 2 px on a Full HD TV; the web wall scales the same canvas to its box. Literal colours and sizes live only in the tokens (`src/foundation/tokens`). `src/foundation` holds what every part of the wall builds on: the tokens, the theme context, bundled images and motion. It imports nothing else in the package.

## Layout grid

One grid, in `layout` (tokens) and the boxes derived from it in `src/features/wall/constants/layout.ts`. Every element lines up on it.

| Token          | dp  | px at 1080p | What it is                                                          |
| -------------- | --- | ----------- | ------------------------------------------------------------------- |
| `safeX`        | 48  | 96          | Left and right safe margin: 5% of the width, clear of TV overscan   |
| `safeY`        | 28  | 56          | Top and bottom safe margin: about 5% of the height                  |
| `headerHeight` | 40  | 80          | The header zone; the logo is this tall (about 377 px wide at 1080p) |
| `headerGap`    | 14  | 28          | Between the header zone and the content                             |
| `columnGap`    | 24  | 48          | Between the photos and the panel column                             |
| `footerHeight` | 32  | 64          | The now-showing bar under the photos (or the hosts' announcement)   |
| `footerGap`    | 8   | 16          | Between the photos and that bar                                     |
| `panelWidth`   | 216 | 432         | The panel column: the join QR, Who's here under it                  |
| `panelGap`     | 12  | 24          | Between the cards in the panel column                               |

The boxes, top to bottom:

```
SAFE_AREA   48,28 → 912,512
HEADER      48,28, 864 × 40          logo + year left (logo ink on the safe line); hashtag, count, Live right
CONTENT     48,82 → 912,512          one headerGap below the header
  STAGE     48,82 → 672,472          the photos, envelopes included
  FOOTER    48,480, 624 × 32         now showing + progress + "n / N"; bottom on the safe line
  PANEL     696,82 → 912,512         join QR and Who's here; top level with the stage
```

Rules:

- Nothing readable leaves `SAFE_AREA`. Full-screen overlays (spotlight, photo call, connecting) may cover the canvas but keep their text inside it.
- The stage bounds what is **drawn**, not card boxes. `cardEnvelope` measures a card with its tilt, shadow plates, accent ring and drift (and, lifted, its scale and extra lean); the lifted card is nudged back inside the stage (`shiftInside`). `collageLayout.test.ts` checks this for every slot.
- The wall is hand-placed: `SLOTS` in the layout constants holds 12 cards in rows of 4, 4 and 4, each at its own height and gentle tilt, laid out for a `POLAROID.width` card. Rows overlap only by a card's top edge, and each slot's `layer` draws upper rows above lower ones, so every caption stays in view. A page shows up to `SLOT_COUNT` photos; the wall pages through the rest.
- `fitSlots` (utils/collageLayout) fits the whole composition onto `STAGE`: it scales every slot by one factor, never up, so the composition keeps its proportions, then centres it on the stage. The result is `SLOT_POSITIONS`.
- Draw order (`drawOrder`): upper rows above lower ones, so a lower card never hides a caption; within a row the newest photo is on top. The lifted card and the spotlight are layers of their own.
- Motion goes through `useLoop` (foundation/motion): every loop rests with reduced motion.
- Wall cards have one height per width (`polaroidHeight`: the photo, its paper and two caption lines), so the layout knows exactly what it places.

## Backdrop

`AmbientBackdrop` draws the night-sky image (`assets/brand/backdrop.jpg`, 1920×1080 px for the 960×540 dp canvas, made with ChatGPT image generation) and three animated layers over it: a glow in `theme.primary` on the horizon and one in `theme.tertiary` among the stars, drifting over 96 and 120 seconds, and a twinkle on the brightest stars (`backdrop-twinkle.png`, a 220×280 dp sprite from `brand/sources/backdrop-twinkle.svg`, not a full-screen layer). Each is a small still image moved only by opacity and transform on the native driver; with reduced motion they hold still. Timings and sizes are `ambient` in the tokens. A photo that arrives live gets one spark in the primary colour at its corner (`ArrivalSpark`).

## Tests

```sh
pnpm --filter @boothwall/wall-ui test
```
