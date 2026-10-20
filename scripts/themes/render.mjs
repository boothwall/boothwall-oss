// Draws the wall themes' art in code and renders it to the images the wall ships: each theme's
// backdrop, with its still ornaments painted in, and the few layers the wall moves on top of it.
// Seeded, so a re-run gives the same pictures; change a seed or a number and run it again.
//
//   node scripts/themes/render.mjs
//
// Needs rsvg-convert and ImageMagick (brew install librsvg imagemagick). The universal theme has
// no art of its own: it keeps the brand backdrop from scripts/brand.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const OUT = join(ROOT, "packages/wall-ui/src/assets/themes");
const work = mkdtempSync(join(tmpdir(), "boothwall-themes-"));

/** The TV's 1080p frame: two pixels per dp of the wall's 960x540 canvas. */
const W = 1920;
const H = 1080;

/** A small seeded generator, so scattered things land in the same places every run. */
function seeded(seed) {
  let state = seed;
  const next = () => (state = (state * 16807) % 2147483647) / 2147483647;
  return (min, max) => min + next() * (max - min);
}

const svg = (width, height, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${body}</svg>`;
const blur = (id, deviation) =>
  `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${deviation}"/></filter>`;
const fade = (id, color, from, x = 0.5, y = 0.5, r = 0.6) =>
  `<radialGradient id="${id}" cx="${x}" cy="${y}" r="${r}"><stop offset="0" stop-color="${color}" stop-opacity="${from}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const vertical = (id, top, bottom) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;

/** Writes `source` to the theme's folder: a JPEG backdrop or a transparent PNG, metadata stripped. */
function render(theme, name, source) {
  mkdirSync(join(OUT, theme), { recursive: true });
  const file = join(work, `${theme}-${name}.svg`);
  const raster = join(work, `${theme}-${name}.png`);
  writeFileSync(file, source);
  execFileSync("rsvg-convert", [file, "-o", raster]);
  const jpeg = name === "backdrop";
  const target = join(OUT, theme, `${name}.${jpeg ? "jpg" : "png"}`);
  const quality = jpeg ? ["-quality", "86"] : ["-define", "png:exclude-chunks=all"];
  execFileSync("magick", [raster, "-strip", ...quality, target]);
}

/** Points along a hanging string between two hooks: a parabola, close enough to a catenary. */
function swag(x0, x1, y, sag, steps = 60) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [x0 + (x1 - x0) * t, y + sag * 4 * t * (1 - t)];
  });
}

/** A eucalyptus sprig in gold line art: a curved stem with leaves on alternate sides. */
function sprig(x, y, angle, length) {
  let leaves = "";
  for (let i = 1; i <= 9; i++) {
    const t = i / 10;
    const lx = length * t;
    const side = i % 2 ? -1 : 1;
    const size = 26 - i * 1.6;
    const ly = -length * 0.384 * t * (1 - t) + side * size * 0.6;
    leaves += `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${(size * 0.55).toFixed(1)}" ry="${size.toFixed(1)}" transform="rotate(${side * 35} ${lx.toFixed(1)} ${ly.toFixed(1)})" fill="#D9B26F" fill-opacity="0.14" stroke="#E9C47F" stroke-opacity="0.75" stroke-width="1.6"/>`;
  }
  const stem = `<path d="M0,0 Q${length * 0.25},${-length * 0.12} ${length},${-length * 0.05}" fill="none" stroke="#D9B26F" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${angle})">${stem}${leaves}</g>`;
}

/**
 * Wedding: a warm evening. Wine to plum, gold light pooling low on the right, blush up top,
 * bokeh in the edges, fairy lights draped along the top and gold sprigs in two corners. The
 * wall twinkles the lights' glow and lets blush and ivory petals drift down.
 */
function wedding() {
  const r = seeded(7);
  const tones = ["#F3D9A4", "#F2B8C6", "#FFF1DC", "#E9C47F"];
  let bokeh = "";
  for (let i = 0; i < 46; i++) {
    const big = r(0, 1) < 0.35;
    const radius = big ? r(40, 95) : r(8, 34);
    // Most of it in the edges, where the photos aren't.
    const edge = r(0, 1) < 0.7;
    const x = edge ? (r(0, 1) < 0.5 ? r(0, 380) : r(1500, W)) : r(0, W);
    const y = edge ? r(0, H) : r(0, 1) < 0.5 ? r(0, 160) : r(900, H);
    const tone = tones[i % tones.length];
    const opacity = big ? r(0.05, 0.12) : r(0.1, 0.28);
    const softness = Math.round(big ? r(6, 14) : r(1.5, 5));
    bokeh += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${radius.toFixed(0)}" fill="${tone}" fill-opacity="${opacity.toFixed(2)}" stroke="${tone}" stroke-opacity="${(opacity * 1.6).toFixed(2)}" stroke-width="2" filter="url(#b${softness})"/>`;
  }
  let dust = "";
  for (let i = 0; i < 140; i++) {
    dust += `<circle cx="${r(0, W).toFixed(0)}" cy="${r(0, H).toFixed(0)}" r="${r(0.8, 2.2).toFixed(1)}" fill="#FFF1DC" fill-opacity="${r(0.15, 0.6).toFixed(2)}"/>`;
  }
  const strings = [swag(-60, 660, 4, 70), swag(620, 1300, 4, 82), swag(1260, 1980, 4, 70)];
  let wires = "";
  let bulbs = "";
  let halos = "";
  for (const points of strings) {
    wires += `<polyline points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#6B5236" stroke-width="2.4" stroke-linecap="round"/>`;
    for (let i = 2; i < points.length - 1; i += 5) {
      const [x, y] = points[i];
      const by = y + 9;
      bulbs += `<line x1="${x}" y1="${y}" x2="${x}" y2="${by - 5}" stroke="#6B5236" stroke-width="2"/><ellipse cx="${x}" cy="${by}" rx="5" ry="7" fill="#FFE7B0"/><ellipse cx="${x - 1.5}" cy="${by - 2}" rx="1.6" ry="2.4" fill="#FFFFFF" fill-opacity="0.85"/>`;
      halos += `<circle cx="${x}" cy="${by}" r="26" fill="url(#halo)"/>`;
    }
  }
  const softs = Array.from({ length: 14 }, (_, i) => blur(`b${i + 1}`, i + 1)).join("");
  render(
    "wedding",
    "backdrop",
    svg(
      W,
      H,
      softs +
        vertical("base", "#2A1724", "#140B12") +
        fade("warm", "#E9C47F", 0.35, 0.85, 1, 0.7) +
        fade("blush", "#F2A7BC", 0.22, 0.1, 0, 0.6),
      `<rect width="${W}" height="${H}" fill="url(#base)"/><rect width="${W}" height="${H}" fill="url(#warm)"/><rect width="${W}" height="${H}" fill="url(#blush)"/>${bokeh}${dust}${sprig(-30, 1095, -22, 300)}${sprig(-20, 1110, -6, 240)}${sprig(1930, 980, 208, 300)}${wires}${bulbs}`,
    ),
  );
  const halo = `<radialGradient id="halo"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.75"/><stop offset="0.35" stop-color="#FFC56B" stop-opacity="0.28"/><stop offset="1" stop-color="#FFC56B" stop-opacity="0"/></radialGradient>`;
  render("wedding", "lights", svg(W, 160, halo, halos));
  let petals = "";
  const colours = ["#F7C6D2", "#FBE3E8", "#F2A7BC", "#FFF4EC"];
  for (let i = 0; i < 16; i++) {
    const at = `translate(${r(30, W - 30).toFixed(0)} ${r(30, H - 30).toFixed(0)}) rotate(${r(0, 360).toFixed(0)}) scale(${r(0.7, 1.3).toFixed(2)})`;
    petals += `<g transform="${at}"><path d="M0,-16 C10,-12 13,4 0,16 C-13,4 -10,-12 0,-16 Z" fill="${colours[i % 4]}" fill-opacity="0.9"/><path d="M0,-12 C3,-4 3,6 0,12" stroke="#E58FA6" stroke-opacity="0.5" stroke-width="1.2" fill="none"/></g>`;
  }
  render("wedding", "petals", svg(W, H, "", petals));
}

/**
 * Party: a club at night. Near-black violet, magenta and violet haze, cyan from below, laser
 * rays from the top corners and neon shapes glowing in the corners. Confetti falls on top.
 */
function party() {
  const r = seeded(11);
  const haze = [
    [200, 160, 420, "#FF4FB0", 0.3],
    [1750, 120, 380, "#8B6CFF", 0.34],
    [1650, 980, 460, "#FF4FB0", 0.22],
    [260, 1000, 420, "#3EE6FF", 0.16],
    [960, 560, 520, "#8B6CFF", 0.1],
  ]
    .map(
      ([x, y, radius, c, o]) =>
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="${c}" fill-opacity="${o}" filter="url(#haze)"/>`,
    )
    .join("");
  const lasers = ["#FF4FB0", "#3EE6FF", "#8B6CFF"];
  let rays = "";
  for (let i = 0; i < 5; i++) {
    rays += `<line x1="0" y1="0" x2="${r(700, 1500).toFixed(0)}" y2="${H}" stroke="${lasers[i % 3]}" stroke-opacity="0.16" stroke-width="3" filter="url(#soft)"/>`;
    rays += `<line x1="${W}" y1="0" x2="${r(400, 1200).toFixed(0)}" y2="${H}" stroke="${lasers[(i + 1) % 3]}" stroke-opacity="0.14" stroke-width="3" filter="url(#soft)"/>`;
  }
  const neon = `<filter id="neon" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const shapes = `<g filter="url(#neon)" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="1070" r="62" stroke="#3EE6FF"/><polyline points="1700,1075 1740,1035 1780,1075 1820,1035 1860,1075 1900,1035" stroke="#FF4FB0"/><polygon points="1830,160 1890,270 1770,270" stroke="#FFD84F"/><path d="M40,170 q30,-40 60,0 t60,0 t60,0" stroke="#8B6CFF"/></g>`;
  render(
    "party",
    "backdrop",
    svg(
      W,
      H,
      blur("haze", 120) + blur("soft", 4) + neon + vertical("base", "#170A2A", "#0C0616"),
      `<rect width="${W}" height="${H}" fill="url(#base)"/>${haze}${rays}${shapes}`,
    ),
  );
  const colours = ["#FF4FB0", "#8B6CFF", "#3EE6FF", "#FFD84F", "#FFFFFF", "#FF8A3D"];
  let confetti = "";
  for (let i = 0; i < 46; i++) {
    const colour = colours[i % colours.length];
    const piece = [
      `<rect x="-4" y="-10" width="8" height="20" rx="1.5" fill="${colour}"/>`,
      `<circle r="5.5" fill="${colour}"/>`,
      `<path d="M-10,0 q5,-8 10,0 t10,0" stroke="${colour}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    ][i % 3];
    confetti += `<g transform="translate(${r(10, W - 10).toFixed(0)} ${r(10, H - 10).toFixed(0)}) rotate(${r(0, 360).toFixed(0)})" opacity="${r(0.65, 1).toFixed(2)}">${piece}</g>`;
  }
  render("party", "confetti", svg(W, H, "", confetti));
}

/**
 * Conference: a main stage. Deep blue, haze, a dot field above and a glowing grid floor running
 * to the horizon. Two spotlight beams sweep slowly over it.
 */
function conference() {
  const horizon = 760;
  let grid = "";
  for (let i = -16; i <= 16; i++) {
    grid += `<line x1="${W / 2}" y1="${horizon}" x2="${W / 2 + i * 150}" y2="${H}" stroke="#4CC8FF" stroke-opacity="0.22" stroke-width="1.6"/>`;
  }
  for (let k = 1; k <= 9; k++) {
    const t = (k / 9) ** 1.9;
    const y = (horizon + (H - horizon) * t).toFixed(0);
    grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#4CC8FF" stroke-opacity="${(0.06 + 0.2 * t).toFixed(2)}" stroke-width="1.6"/>`;
  }
  let dots = "";
  for (let y = 30; y < 700; y += 36) {
    for (let x = 30; x < W; x += 36) {
      dots += `<circle cx="${x}" cy="${y}" r="1.4" fill="#9DB2FF" fill-opacity="${(0.05 + 0.1 * (1 - y / 700)).toFixed(2)}"/>`;
    }
  }
  const floorMask = `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.35" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="floor"><rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#fade)"/></mask>`;
  const base = `<linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050D1C"/><stop offset="0.7" stop-color="#0A1A33"/><stop offset="1" stop-color="#0B2140"/></linearGradient>`;
  render(
    "conference",
    "backdrop",
    svg(
      W,
      H,
      blur("haze", 110) + base + floorMask,
      `<rect width="${W}" height="${H}" fill="url(#base)"/><circle cx="${W / 2}" cy="${horizon}" r="520" fill="#4CC8FF" fill-opacity="0.16" filter="url(#haze)"/><circle cx="1700" cy="80" r="360" fill="#9DB2FF" fill-opacity="0.14" filter="url(#haze)"/>${dots}<rect x="0" y="${horizon}" width="${W}" height="6" fill="#4CC8FF" fill-opacity="0.35" filter="url(#haze)"/><g mask="url(#floor)">${grid}</g>`,
    ),
  );
  const cone = `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDF4FF" stop-opacity="0.55"/><stop offset="0.6" stop-color="#4CC8FF" stop-opacity="0.12"/><stop offset="1" stop-color="#4CC8FF" stop-opacity="0"/></linearGradient><filter id="b" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="14"/></filter>`;
  render(
    "conference",
    "beam",
    svg(
      520,
      1100,
      cone,
      `<polygon points="240,0 280,0 520,1100 0,1100" fill="url(#g)" filter="url(#b)"/><ellipse cx="260" cy="8" rx="34" ry="12" fill="#EAF8FF" fill-opacity="0.9" filter="url(#b)"/>`,
    ),
  );
}

wedding();
party();
conference();
console.info(`Theme art written to ${OUT}`);
