import { CONTROL_GUESTS_PATH, CONTROL_LIVE_PATH, CONTROL_PATH } from "@/config";

/** The phone's three tabs, each at its own address; a wide screen shows all three at once. */
export const CONTROL_TABS = ["review", "live", "guests"] as const;
export type ControlTab = (typeof CONTROL_TABS)[number];

export const CONTROL_TAB_PATHS: Record<ControlTab, string> = {
  review: CONTROL_PATH,
  live: CONTROL_LIVE_PATH,
  guests: CONTROL_GUESTS_PATH,
};
