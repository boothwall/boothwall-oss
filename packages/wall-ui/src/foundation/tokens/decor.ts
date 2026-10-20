/**
 * The wall's ambient layers over the backdrop photo: two soft glows (sizes in dp, drift in dp,
 * one full cycle in ms: slow enough to notice only over minutes) and the twinkle's cycle.
 */
export const ambient = {
  accent: { size: 420, opacity: 0.24, drift: 32, periodMs: 96_000 },
  partner: { size: 380, opacity: 0.16, drift: 24, periodMs: 120_000 },
  /** A small sprite over the backdrop's brightest stars, not a full-screen layer. */
  twinkle: { left: 730, top: 30, width: 220, height: 280, periodMs: 9_000 },
} as const;

/**
 * The themes' moving layers (features/wall/components/decor), in dp and ms. Slow on purpose:
 * mood behind the photos, never motion that competes with them.
 */
export const decor = {
  /** Wedding: the fairy lights' glow breathing, and petals taking half a minute to fall. */
  lights: { height: 80, halfMs: 2_400, low: 0.45 },
  petalsFallMs: 30_000,
  /** Party: confetti falling a little quicker. */
  confettiFallMs: 18_000,
  /** Conference: two spotlights swinging from fixtures above the top edge. */
  beam: {
    width: 260,
    height: 550,
    swing: 9,
    halfMs: 7_000,
    /** The second beam swings this much slower, so the two drift in and out of step. */
    stagger: 1_300,
    fixtures: [
      { x: 300, y: -6 },
      { x: 640, y: -6 },
    ],
  },
} as const;
