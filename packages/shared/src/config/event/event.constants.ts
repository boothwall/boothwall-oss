import { boothwallConfig } from "../boothwall.config.ts";
import { sourceCredits } from "../credits/source-credits.utils.ts";
import type { BoothwallConfig } from "../schema/boothwall-config.schemas.ts";

/** Typed by the schema rather than the literal, so optional fields stay optional. */
const config: BoothwallConfig = boothwallConfig;

/** The event this wall runs at, from boothwall.config.ts. The Control panel can rename it live. */
export const EVENT: BoothwallConfig["event"] = config.event;

/** The label beside the logo on the wall's top bar and the phone header; none when unset. */
export const BADGE_LABEL: BoothwallConfig["badge"] = config.badge;

/**
 * Where this build credits the source: under the phone pages unless `credits: false`, and on the
 * wall only with `credits: true`.
 */
export const SOURCE_CREDITS = sourceCredits(config.credits);
