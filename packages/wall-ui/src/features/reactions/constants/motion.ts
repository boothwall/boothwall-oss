/** One float's life, from fade-in at the card to fade-out above it. */
export const FLOAT_MS = 2_200;
/** Floats of one burst leave one after another, not stacked on the same frame. */
export const FLOAT_STAGGER_MS = 180;
/** How far a float rises, in dp. Reduced motion keeps it in place and only fades. */
export const FLOAT_RISE_DP = 84;
/** Sideways spread of the floats over a card, as a share of the card's width. */
export const FLOAT_SPREAD = 0.6;
/** Points in a float's life (0 to 1): faded in, starting to fade out; and when its pop peaks. */
export const FLOAT_KEYFRAMES = { shown: 0.12, fading: 0.7, popped: 0.15 } as const;
