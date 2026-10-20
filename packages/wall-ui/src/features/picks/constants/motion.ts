/** The burst of sparks around a pick's badge. */
export const BURST = {
  sparks: 12,
  /** How far the sparks fly, in dp: an oval, as the badge is wide and short. */
  radiusX: 130,
  radiusY: 50,
  durationMs: 1_200,
  /** The badge pops in this long after the photo starts opening. */
  delayMs: 350,
} as const;
