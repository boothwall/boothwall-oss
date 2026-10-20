import burst from "#assets/motion/signal/burst.png";
import cardPing from "#assets/motion/signal/card-ping.png";
import glowBlue from "#assets/motion/signal/glow-blue.png";
import glowOrange from "#assets/motion/signal/glow-orange.png";
import glowWhite from "#assets/motion/signal/glow-white.png";
import particlesFar from "#assets/motion/signal/particles-far.png";
import particlesNear from "#assets/motion/signal/particles-near.png";
import ribbonBlue from "#assets/motion/signal/ribbon-blue.png";
import ribbonOrange from "#assets/motion/signal/ribbon-orange.png";
import ring from "#assets/motion/signal/ring.png";
import sheenBlue from "#assets/motion/signal/sheen-blue.png";
import streakBlue from "#assets/motion/signal/streak-blue.png";
import { imageSource } from "#foundation/assets";

/**
 * The signal look's sprites: small textures with their glow and blur baked in,
 * so the wall only moves and fades them. The largest is 1024 px wide.
 */
export const SIGNAL_ART = {
  burst: imageSource(burst),
  cardPing: imageSource(cardPing),
  glowBlue: imageSource(glowBlue),
  glowOrange: imageSource(glowOrange),
  glowWhite: imageSource(glowWhite),
  particlesFar: imageSource(particlesFar),
  particlesNear: imageSource(particlesNear),
  ribbonBlue: imageSource(ribbonBlue),
  ribbonOrange: imageSource(ribbonOrange),
  ring: imageSource(ring),
  sheenBlue: imageSource(sheenBlue),
  streakBlue: imageSource(streakBlue),
};
