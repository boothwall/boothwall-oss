import { z } from "zod";

import { eventYearSchema, hashtagSchema, SETTINGS_LIMITS, wallSettingsSchema } from "#settings";

import { wallLookSchema } from "./wall-look.schemas.ts";

const url = z.url({ protocol: /^https?$/ });
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colours are 6-digit hex, like #FF9F1C");

/** Everything a deployer changes to make BoothWall theirs. Validated at build and test time. */
export const boothwallConfigSchema = z
  .object({
    event: z.object({
      /** Shown in titles and on the upload page. Configured at build time. */
      name: z.string().min(1).max(SETTINGS_LIMITS.eventNameMaxLength),
      /** Printed on the wall and on every photo. Configured at build time. */
      hashtag: hashtagSchema,
      /** Where the booth is, shown on the upload page. Optional. */
      venue: z.string().optional(),
      /** Shown as a stacked "20 / 26" mark next to the logo on the TV. Optional. */
      year: eventYearSchema.optional(),
      /**
       * The event's wordmark on the phone pages, right of your lockup in one bar: an image in the
       * web app's `public` folder, like "event-wordmark.png". Optional; without it the lockup
       * stands alone.
       */
      wordmark: z
        .string()
        .regex(
          /^[\w-]+(?:\/[\w-]+)*\.(?:png|svg|webp|jpe?g)$/,
          "event.wordmark is an image file in the web app's public folder, like event-wordmark.png",
        )
        .optional(),
    }),
    /**
     * What guests pick when they upload ("what brings you here?"). Ids are stored with every
     * photo, so keep them stable once the wall is live. At most one entry can be the
     * catch-all: it isn't printed on cards and sits below the battle bars.
     */
    categories: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/, "category ids are lowercase, digits and dashes"),
          label: z.string().min(1),
          catchAll: z.boolean().optional(),
        }),
      )
      .min(1),
    /**
     * Brand colours for the TV, the web app and the Control panel. Gradients run primary →
     * secondary → tertiary. Text on top of them is picked automatically for contrast.
     * Logo and backdrop images live in each app's assets/brand folder.
     */
    theme: z.object({
      primary: hex,
      /**
       * Optional. The accent as text on the dark wall and pages, for a primary dark enough to
       * carry white labels but too dark to read as text there. Fills keep the primary.
       */
      primaryOnDark: hex.optional(),
      secondary: hex,
      tertiary: hex,
    }),
    urls: z.object({
      /** The API Worker. */
      api: url,
      /** The web app: the wall at `/`, the upload page at `/snap` (the TV's QR code) and `/control`; under its path if it has one. */
      web: url,
      /** Where the code lives, for the "Scan for the source" card. */
      source: url,
    }),
    /** Small "by" credit on the upload page and the TV source card. */
    author: z.object({ handle: z.string().min(1) }),
    /** A small label beside the logo on the wall and the phone pages, like "Built on Vega OS". */
    badge: z.string().trim().min(1).max(32).optional(),
    /**
     * One quiet line under the guest pages and on Control, like a demo's ground rules
     * ("Photos are deleted after 24 hours."). Optional; nothing shows without it.
     */
    notice: z.string().trim().min(1).max(160).optional(),
    /**
     * The source link under the phone pages (on unless false) and the "Scan for the source"
     * card on the wall (off unless true).
     */
    credits: z.boolean().optional(),
    /**
     * Demo mode: the TV shows the bundled demo photos and needs no API, which is handy for trying
     * BoothWall on the Vega Virtual Device. Turn it off once your API is deployed.
     */
    demo: z.boolean(),
    /**
     * File-authoritative presentation and initial runtime flags. Control changes only durable
     * playback/upload-intake state; omitted values use the built-in defaults.
     */
    settings: wallSettingsSchema
      .omit({ categories: true, eventName: true, eventHashtag: true, eventYear: true })
      .partial()
      .optional(),
    /** Optional looks for the wall's header, announcement and source card (wall-look.schemas.ts). */
    wall: wallLookSchema.optional(),
    /**
     * The TV app's one wall, fixed at build time. To show another wall, change it here and
     * rebuild. A built app carries these values and anyone holding it can read them, so keep
     * your build to yourself and never publish it. The open API needs no display credential;
     * set one only when your host's wall resolver checks it (sent as the screen token).
     */
    tv: z
      .object({
        // The wall id rule of wall/identity/wall-id.schemas.ts; the wall module imports config.
        wallId: z
          .string()
          .regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/, "tv.wallId is 1-64 of a-z, 0-9 and -")
          .optional(),
        displayCredential: z.string().min(16).max(512).optional(),
      })
      .strict()
      .optional(),
    /** Photos are deleted this many days after upload. */
    retentionDays: z.number().int().positive(),
    /**
     * Your Cloudflare resources. `name` is the base for everything: the API Worker is
     * `<name>-api`, the web app Worker `<name>`, the D1 database `<name>` and the R2
     * bucket `<name>-photos`. `pnpm boothwall setup` creates them and fills in the rest.
     */
    deploy: z.object({
      name: z
        .string()
        .regex(/^[a-z0-9][a-z0-9-]{1,40}$/, "deploy.name is lowercase, digits and dashes"),
      /** Filled in by `pnpm boothwall setup`. */
      d1DatabaseId: z.union([z.uuid(), z.literal("")]),
      /** Optional custom domains on a zone in your account. Empty means workers.dev. */
      apiDomain: z.string(),
      webDomain: z.string(),
      /**
       * Other domains the API keeps answering on, like the old one after a move: TV apps
       * already installed have the API address built in.
       */
      extraApiDomains: z.array(z.string()).optional(),
    }),
  })
  .superRefine((config, ctx) => {
    const ids = config.categories.map((category) => category.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["categories"],
        message: "category ids must be unique",
      });
    }
    if (config.categories.filter((category) => category.catchAll).length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["categories"],
        message: "only one catch-all category",
      });
    }
  });

export type BoothwallConfig = z.input<typeof boothwallConfigSchema>;
