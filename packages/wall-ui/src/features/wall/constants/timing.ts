/** A live arrival is waiting: the current photo wraps up this fast. */
export const HURRY_MS = 1_500;
/** The wall's beat: every this many timed steps, the step opens its photo full screen. */
export const OPEN_EVERY_STEPS = 4;
/** On a page turn, each card swaps this long after the one before it, in reading order. */
export const PAGE_STAGGER_MS = 110;
/** How long the "Page 2 of 3" label holds on a page turn. */
export const PAGE_BANNER_MS = 1_600;
/** Its fade in and out. */
export const PAGE_BANNER_FADE_MS = { in: 280, out: 320 } as const;
/** OK can arrive as a key event and as a press on the focus catcher. */
export const SELECT_DEBOUNCE_MS = 300;
/** Overlay fade when the wall becomes ready. */
export const CONNECTION_FADE_MS = 450;
/** A second Back within this window exits the app. */
export const EXIT_CONFIRM_MS = 2_500;
/** One turn of the connecting spinner. */
export const SPINNER_TURN_MS = 1_100;
/** A card never waits longer than this for its image before showing. */
export const IMAGE_REVEAL_FALLBACK_MS = 2_500;
/** Waits before each retry of a failed image load; after the last one the card shows a placeholder. */
export const IMAGE_RETRY_MS = [1_000, 3_000] as const;
/** After a crash, the calm "restarting" screen shows this long before the wall remounts. */
export const RESTART_AFTER_MS = 3_000;
/** The Live pill's dot: one breath out and back in, and how faint it gets. */
export const LIVE_PULSE = { halfMs: 900, low: 0.35 } as const;
/** A new announcement rising into the now-showing bar. */
export const ANNOUNCEMENT_ENTER_MS = 420;
/**
 * The filled announcement's cue, when it rises and every minute after: its rings glow, a sheen
 * crosses it (dp from its left edge), it lifts and its megaphone nods, at these points of the cue.
 */
export const ANNOUNCEMENT_CUE = {
  everyMs: 60_000,
  durationMs: 1_400,
  steps: [0, 0.25, 0.57, 1],
  rings: [0, 1, 1, 0],
  sheenX: [-160, 110, 360, 720],
  lift: [0, -1, -2 / 3, 0],
  nod: ["0deg", "-16deg", "10deg", "0deg"],
  nodScale: [1, 1.1, 1, 1],
};
/** The accent spark at the corner of a photo that just landed. */
export const ARRIVAL_SPARK_MS = 1_100;
/** The empty wall's QR panel pulsing for attention, each way. */
export const ATTENTION_PULSE_MS = 1_100;
/** The join card's glow breathes slowly, about one breath every five seconds, between these opacities. */
export const JOIN_GLOW = { halfMs: 2_600, low: 0.15, high: 1 } as const;
/** A resting card's float, each way, and how much longer each next slot's takes. */
export const CARD_DRIFT_MS = 5_000;
export const CARD_DRIFT_STEP_MS = 370;
/** The empty wall's blank cards drifting, each way, and the step between them. */
export const GHOST_DRIFT_MS = 3_600;
export const GHOST_DRIFT_STEP_MS = 500;

/** The source card takes Who's here's place this often, for this long (time to scan), crossfading. */
export const SOURCE_TURN = { everyMs: 30_000, showMs: 8_000, fadeMs: 450 } as const;
