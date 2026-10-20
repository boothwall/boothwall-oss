import type { JOIN_VOICE, offlineCopy, picksCopy, wallCopy } from "./english-copy.constants";
/** The English literal types widened, so another language can fill the same shape. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends object
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T;

/**
 * Every word the wall shows, as one object. Plurals and phrases with values stay functions, so a
 * caller can supply another language without an i18n runtime in this package.
 */
export type WallCopy = Widen<{
  join: typeof JOIN_VOICE;
  wall: Omit<typeof wallCopy, "join">;
  picks: typeof picksCopy;
  offline: typeof offlineCopy;
}>;
