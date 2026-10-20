// Renders the brand files the apps ship from the SVGs in brand/, with the canvas colour taken
// from packages/shared/src/brand/surfaces/surfaces.constants.ts (the one place it is set). Each source marks its
// background with class="canvas"; the colour written there is only a preview.
//
//   node scripts/brand/render.mjs
//
// Needs rsvg-convert and ImageMagick (brew install librsvg imagemagick). Run it after changing
// the canvas colour or any source in brand/.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { SURFACES } from "../../packages/shared/src/brand/surfaces/surfaces.constants.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const at = (path) => join(ROOT, path);
const work = mkdtempSync(join(tmpdir(), "boothwall-brand-"));

/** A source with its canvas set to the shared colour, written to a temp file. */
function source(name) {
  const svg = readFileSync(at(`brand/sources/${name}.svg`), "utf8").replace(
    /class="canvas" fill="#[0-9A-Fa-f]{6}"/g,
    `class="canvas" fill="${SURFACES.canvas}"`,
  );
  const file = join(work, `${name}.svg`);
  writeFileSync(file, svg);
  return { file, svg };
}

const magick = (...args) => execFileSync("magick", args);
const rsvg = (...args) => execFileSync("rsvg-convert", args);

/** Renders a source to a PNG, metadata stripped. */
function png(name, out, width, height = width) {
  const raster = join(work, `${name}-${width}x${height}.png`);
  rsvg("-w", String(width), "-h", String(height), source(name).file, "-o", raster);
  magick(raster, "-strip", "-define", "png:exclude-chunks=all", at(out));
  return raster;
}

// Web: favicons, home-screen and install icons.
writeFileSync(at("apps/web/public/favicon.svg"), source("favicon").svg);
const favicons = [16, 32, 48].map((size) =>
  png("favicon", `apps/web/public/.favicon-${size}.png`, size),
);
magick(...favicons, at("apps/web/public/favicon.ico"));
for (const size of [16, 32, 48]) execFileSync("rm", [at(`apps/web/public/.favicon-${size}.png`)]);
png("app-icon", "apps/web/public/apple-touch-icon.png", 180);
for (const size of [192, 512]) {
  png("app-icon", `apps/web/public/pwa-${size}.png`, size);
  png("app-icon-maskable", `apps/web/public/pwa-maskable-${size}.png`, size);
}

// Fire TV (Vega OS) app icon: the mark with the name, since the launcher tile is all a viewer sees.
png("app-icon-tv", "apps/tv-vega/assets/image/app_icon.png", 512);

// The wall's backdrop is a photograph (packages/wall-ui/src/assets/brand/backdrop.jpg at 1080p
// for the TV, backdrop-web.jpg at 3 px per dp for the web); its twinkle layer is drawn here, and
// the glow behind the phone pages.
const twinkle = png("backdrop-twinkle", "packages/wall-ui/src/assets/brand/.twinkle.png", 440, 560);
magick(
  twinkle,
  "-strip",
  "-define",
  "png:exclude-chunks=all",
  at("packages/wall-ui/src/assets/brand/backdrop-twinkle.png"),
);
execFileSync("rm", [at("packages/wall-ui/src/assets/brand/.twinkle.png")]);
// The web draws the canvas at up to 3 px per dp (a Retina window), so it gets a sharper copy.
const twinkleWeb = png(
  "backdrop-twinkle",
  "packages/wall-ui/src/assets/brand/.twinkle-web.png",
  660,
  840,
);
magick(
  twinkleWeb,
  "-strip",
  "-define",
  "png:exclude-chunks=all",
  at("packages/wall-ui/src/assets/brand/backdrop-twinkle-web.png"),
);
execFileSync("rm", [at("packages/wall-ui/src/assets/brand/.twinkle-web.png")]);
const glow = png("glow", "apps/web/src/assets/brand/.glow.png", 1600, 1000);
magick(glow, "-strip", "-quality", "85", at("apps/web/src/assets/brand/glow.jpg"));
execFileSync("rm", [at("apps/web/src/assets/brand/.glow.png")]);

// The logos (no canvas): the wall's top bar, and the open-source lockup for the phone headers
// and the light printables. The wall's split-header lockup (lockup.png) is the approved r15
// render of boothwall-open-source-on-dark.svg and is not redrawn here.
for (const [logo, out] of [
  ["boothwall-on-dark", "packages/wall-ui/src/assets/brand/logo.png"],
  ["boothwall-open-source-on-dark", "apps/web/src/assets/brand/logo.png"],
  ["boothwall-open-source-on-light", "apps/web/src/assets/brand/logo-on-light.png"],
]) {
  const raster = join(work, `${logo}.png`);
  rsvg("-h", "168", at(`brand/logos/${logo}.svg`), "-o", raster);
  magick(raster, "-strip", "-define", "png:exclude-chunks=all", at(out));
}

console.info(`Rendered with canvas ${SURFACES.canvas}.`);
