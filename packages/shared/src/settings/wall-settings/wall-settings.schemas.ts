import { z } from "zod";

import { categoriesSchema } from "../categories/categories.schemas.ts";
import { eventPresentationSchema } from "../presentation/index.ts";
import {
  DEFAULT_SMART_MODERATION,
  smartModerationSchema,
} from "../smart-moderation/smart-moderation.schemas.ts";

/** Polaroid caption looks. The TV bundles one font per style (apps/tv-vega/assets/fonts). */
export const CAPTION_STYLES = [
  "kalam",
  "classic",
  "marker",
  "caveat",
  "typewriter",
  "clean",
  "gochi",
] as const;

export const captionStyleSchema = z.enum(CAPTION_STYLES);

export type CaptionStyle = z.infer<typeof captionStyleSchema>;

/**
 * The wall's look and voice: its backdrop, light, colours and the words on its join card.
 * "universal" is the wall as it ships. The palettes and art live with the wall (wall-ui).
 */
export const WALL_THEMES = ["universal", "wedding", "party", "conference"] as const;

export const wallThemeSchema = z.enum(WALL_THEMES);

export type WallTheme = z.infer<typeof wallThemeSchema>;

export const SETTINGS_LIMITS = {
  eventNameMaxLength: 60,
  hashtagMaxLength: 32,
  eventYearLength: 4,
  announcementMaxLength: 70,
  closedMessageMaxLength: 120,
  secondsPerPhoto: { min: 3, max: 30 },
} as const;

/**
 * A hashtag as the wall prints it: `#` and then letters (any language, with their accents and
 * vowel signs), digits or underscores.
 */
export const hashtagSchema = z
  .string()
  .trim()
  .max(SETTINGS_LIMITS.hashtagMaxLength)
  .regex(/^#[\p{L}\p{M}\p{N}_]+$/u, "hashtag must look like #yourevent");

/** Four digits for the stacked year beside the logo, or empty for none. */
export const eventYearSchema = z.union([
  z.string().regex(/^\d{4}$/, "year is four digits, like 2026"),
  z.literal(""),
]);

/**
 * Effective settings consumed by every screen. Standalone presentation comes from configuration;
 * explicitly composed stored-authority hosts may manage these values dynamically.
 */
export const wallSettingsSchema = z.object({
  presentation: eventPresentationSchema.optional(),
  /** On the recap page, the printed cards and the wall's logo label. Starts as `event.name`. */
  eventName: z.string().trim().min(1).max(SETTINGS_LIMITS.eventNameMaxLength),
  /** On the wall and every polaroid. Starts as `event.hashtag`. */
  eventHashtag: hashtagSchema,
  /** The stacked year beside the logo; empty hides it. Starts as `event.year`. */
  eventYear: eventYearSchema,
  /** What visitors pick when they upload. Starts as `categories` in boothwall.config.ts. */
  categories: categoriesSchema,
  captionStyle: captionStyleSchema,
  /** Defaulted, like every field added later, so settings saved before themes still parse. */
  theme: wallThemeSchema.default("universal"),
  /** Off: /snap shows `uploadsClosedMessage` instead of the form, and the API refuses uploads. */
  uploadsOpen: z.boolean(),
  /** Desired slideshow state, independent of guest intake and the event lifecycle. */
  playbackPaused: z.boolean().default(false),
  uploadsClosedMessage: z.string().trim().max(SETTINGS_LIMITS.closedMessageMaxLength),
  /** Skip the approval queue: uploads go straight to the wall. */
  autoApprove: z.boolean(),
  /** A short line on the wall, like "Group photo at 18:00 by the stage". Empty shows nothing. */
  announcement: z.string().trim().max(SETTINGS_LIMITS.announcementMaxLength),
  secondsPerPhoto: z
    .number()
    .int()
    .min(SETTINGS_LIMITS.secondsPerPhoto.min)
    .max(SETTINGS_LIMITS.secondsPerPhoto.max),
  /** Open a photo full screen every now and then without anyone pressing OK. */
  autoOpen: z.boolean(),
  /** Who's here in the side panel. The QR code always shows; the source card follows `credits`. */
  showWhoIsHere: z.boolean(),
  /** The AI check on new photos. Defaulted so settings saved before it existed still parse. */
  smartModeration: smartModerationSchema.default(DEFAULT_SMART_MODERATION),
  /**
   * Every few minutes the wall opens one photo as the "Crowd favourite" (most reactions) or the
   * "AI pick" (the smart check's highlight score). Defaulted, like every field added later.
   */
  showPicks: z.boolean().default(true),
  /**
   * The event is over: new uploads stop and the wall swaps its QR for the recap page. State, not
   * a preference: only `EVENT_PATHS` change it, and `PUT /settings` keeps the stored value.
   * The separate intake preference is retained and applies again after reopening.
   */
  eventEnded: z.boolean().default(false),
});

export type WallSettings = z.infer<typeof wallSettingsSchema>;
export type WallRuntimeState = Pick<WallSettings, "playbackPaused" | "uploadsOpen" | "eventEnded">;
export type WallConfiguredSettings = Omit<WallSettings, keyof WallRuntimeState>;

/** Runtime commands cannot author presentation or change the event lifecycle. */
export const runtimeSettingsPatchSchema = z
  .object({ playbackPaused: z.boolean().optional(), uploadsOpen: z.boolean().optional() })
  .strict()
  .refine((patch) => patch.playbackPaused !== undefined || patch.uploadsOpen !== undefined, {
    message: "Provide a playback or upload-intake change",
  });
export type RuntimeSettingsPatch = z.infer<typeof runtimeSettingsPatchSchema>;
export const RUNTIME_SETTINGS_PATH = "/settings/runtime";

/**
 * Event lifecycle paths for explicitly composed stored-authority hosts (no body).
 * Both answer like `PUT /settings`, with `{ settings }`, and push them to every wall.
 */
export const EVENT_PATHS = { end: "/event/end", reopen: "/event/reopen" } as const;

/** Built-in starting values; the categories and the event fields always come from the config. */
export const BUILT_IN_SETTINGS: Omit<
  WallSettings,
  "categories" | "eventName" | "eventHashtag" | "eventYear"
> = {
  captionStyle: "kalam",
  theme: "universal",
  uploadsOpen: true,
  playbackPaused: false,
  uploadsClosedMessage: "Uploads are closed for now. Thanks for stopping by!",
  autoApprove: false,
  announcement: "",
  secondsPerPhoto: 7,
  autoOpen: true,
  showWhoIsHere: true,
  smartModeration: DEFAULT_SMART_MODERATION,
  showPicks: true,
  eventEnded: false,
};
