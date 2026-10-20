import type { BoothwallConfig } from "../schema/boothwall-config.schemas.ts";

/** Where a build credits the source: the link under the phone pages and the wall's card. */
export type SourceCredits = { guest: boolean; wall: boolean };

/**
 * `credits` from the config: the phone pages link the source unless it is `false`, and the
 * "Scan for the source" card shows on the wall (TV and browser alike) only when it is `true`.
 */
export function sourceCredits(credits: BoothwallConfig["credits"]): SourceCredits {
  return { guest: credits !== false, wall: credits === true };
}
