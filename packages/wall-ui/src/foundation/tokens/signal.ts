import { CANVAS_HEIGHT, CANVAS_WIDTH, layout } from "./layout";

/**
 * The signal look (`wall.motion: "signal"`), in dp on the canvas and ms. The sprites carry their
 * own colours and glow; these place and time them. A wall is watched all evening, so the look
 * stays in the background: `signalIntensity` holds its loudness in one place, to tune on a TV.
 */

/** One sprite growing and fading once: its size, scale range, peak opacity and timing. */
export type SignalPulse = {
  size: number;
  from: number;
  to: number;
  peak: number;
  durationMs: number;
  delayMs: number;
  /** Share of the run spent fading in. */
  rise?: number;
  /** Degrees it turns over the run. */
  rotate?: number;
};

/** A soft band crossing a box at an angle: from and to are its left edge before the turn. */
export type SignalSweep = {
  width: number;
  height: number;
  top: number;
  from: number;
  to: number;
  angle: number;
  peak: number;
  durationMs: number;
  delayMs: number;
  /** Fully in from, and fading out after, these shares of the run. */
  hold: readonly [number, number];
};

/** Opacities are shares of the full design (1); pace multiplies loop periods (higher is slower). */
export const signalIntensity = {
  ribbons: 0.5,
  pace: 1.4,
  /** Particle layers drawn, each a full-screen tile: add "near" for a second, livelier one. */
  particles: ["far"] as readonly ("far" | "near")[],
  particleOpacity: 0.8,
  /** How much the orange ribbon brightens on each slideshow step. */
  beatSwell: 0.1,
  arrival: 0.6,
  pageTurn: 0.45,
  counter: 0.5,
  /** How far the photo count grows as it ticks (the classic counter pops to 1.45). */
  counterPop: 1.2,
  qr: 0.4,
  qrEveryMs: 45_000,
  /** The photo call opening: the one big moment. */
  call: 1,
};

const { ribbons: R, pace: P, arrival: A, counter: C, qr: Q, call: K } = signalIntensity;
const SWELL_REST = 0.72 * R;

/** The line under the photos (the progress line), from the safe edge to the panel's gap. */
const FOOTER_LINE = {
  left: layout.safeX,
  right: CANVAS_WIDTH - layout.safeX - layout.panelWidth - layout.columnGap,
  y: CANVAS_HEIGHT - layout.safeY - 1,
};
const PAGE_GLOW = { width: 180, height: 26 };

const ribbon = (cy: number, angle: number, height: number, periodMs: number) => ({
  cy,
  angle,
  height,
  periodMs: periodMs * P,
});

export const signal = {
  /** One ribbon tile: three side by side slide one tile per period, so the strip never ends. */
  tile: 960,
  ribbons: {
    blue: { ...ribbon(190, -9, 200, 34_000), opacity: 0.85 * R, phase: 0.2 },
    orange: { ...ribbon(345, -12, 220, 26_000), opacity: SWELL_REST, phase: 0.6 },
    floor: { ...ribbon(500, -4, 150, 41_000), opacity: 0.5 * R, phase: 0.1, flip: true },
  },
  /** Particle tiles rising one canvas height per period. */
  particles: {
    far: { periodMs: 34_000 * P, opacity: signalIntensity.particleOpacity, phase: 0.3 },
    near: { periodMs: 17_000 * P, opacity: signalIntensity.particleOpacity, phase: 0.65 },
  },
  /** The orange ribbon brightens a little on each slideshow step, then settles. */
  swell: {
    durationMs: 7_000,
    steps: [0, 0.05, 0.45, 1],
    opacity: [SWELL_REST, SWELL_REST + signalIntensity.beatSwell, SWELL_REST, SWELL_REST],
  },
  /** A new photo: a faint light rides from the join card to its card, which lands softly. */
  arrival: {
    /** The light leaves from the join card's middle, this far below the panel's top. */
    sourceDrop: 124,
    travel: { delayMs: 100, durationMs: 600, amplitude: 22, waves: 1, points: 24, peak: 0.8 * A },
    head: 36,
    tail: { length: 120, height: 14, overlap: 5 },
    glow: { size: 130, from: 0.3, to: 1.3, peak: A, durationMs: 500, delayMs: 700 },
    rings: [{ size: 110, from: 0.4, to: 1.6, peak: 0.9 * A, durationMs: 600, delayMs: 700 }],
    develop: { peak: 0.92 * A, rise: 0.08, durationMs: 700, delayMs: 700 },
    lifeMs: 1_400,
  },
  /** A page turn: one soft glow running along the line under the photos. */
  pageTurn: {
    sweep: {
      ...PAGE_GLOW,
      top: FOOTER_LINE.y - PAGE_GLOW.height / 2,
      from: FOOTER_LINE.left - PAGE_GLOW.width / 2,
      to: FOOTER_LINE.right - PAGE_GLOW.width / 2,
      angle: 0,
      peak: signalIntensity.pageTurn,
      durationMs: 900,
      delayMs: 0,
      hold: [0.2, 0.7],
    } satisfies SignalSweep,
    lifeMs: 1_000,
  },
  /** The photo count ticks once the light has landed, with a small ring and glow round it. */
  counter: {
    delayMs: 800,
    pop: signalIntensity.counterPop,
    ring: { size: 40, from: 0.4, to: 1.5, peak: 0.8 * C, durationMs: 600, delayMs: 0 },
    glow: { size: 60, from: 0.4, to: 1.1, peak: 0.6 * C, durationMs: 500, delayMs: 100 },
    lifeMs: 700,
  },
  /** The join card: now and then a faint sheen and one ping; a new photo pings it once. */
  qr: {
    everyMs: signalIntensity.qrEveryMs,
    sheen: {
      width: 64,
      height: 350,
      top: -50,
      from: -100,
      to: 270,
      angle: 18,
      peak: Q,
      durationMs: 950,
      delayMs: 0,
      hold: [0.2, 0.8],
    } satisfies SignalSweep,
    /** The ping image's outline sits this far inside its edges. */
    pingInset: 11,
    arrivalPing: { from: 1, to: 1.1, peak: 0.9 * Q, durationMs: 600, delayMs: 0, rise: 0.05 },
    shimmerPings: [{ from: 1, to: 1.1, peak: 0.85 * Q, durationMs: 800, delayMs: 250, rise: 0.05 }],
    lifeMs: 1_200,
  },
  /** A photo call opens: a flash on the stage, rings from the centre and two particle bursts. */
  call: {
    flash: { size: 260, from: 0.2, to: 1.3, peak: 0.9 * K, durationMs: 700, delayMs: 0 },
    rings: [0.85, 0.7, 0.55].map((peak, index) => ({
      size: 220,
      from: 0.2,
      to: 3.4,
      peak: peak * K,
      durationMs: 1_300,
      delayMs: 120 + index * 200,
    })),
    bursts: [
      {
        size: 360,
        from: 0.15,
        to: 2.4,
        peak: K,
        durationMs: 1_800,
        delayMs: 250,
        rise: 0.08,
        rotate: 25,
      },
      {
        size: 300,
        from: 0.15,
        to: 2.9,
        peak: 0.85 * K,
        durationMs: 2_100,
        delayMs: 420,
        rise: 0.08,
        rotate: -30,
      },
    ],
    lifeMs: 2_600,
  },
} as const;
