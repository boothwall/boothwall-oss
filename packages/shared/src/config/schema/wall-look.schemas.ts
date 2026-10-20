import { z } from "zod";

/**
 * Optional looks for the wall's chrome. Leave a field out and the wall keeps its classic look.
 * - `header: "split"`: your logo (wall-ui `assets/brand/lockup.png`) on the left, then the event
 *   on two rows: its name or logo, year and badge, large, with the hashtag at the far end; under
 *   them the venue, with the photo count and Live at the far end.
 * - `announcement: "filled"`: the announcement fills its bar with the accent, beside a megaphone,
 *   and catches the eye about once a minute.
 * - `source`: the source card names the repo, with a QR straight to `urls.source`.
 * - `motion: "signal"`: light ribbons and rising particles drift behind the photos, a light
 *   carries each new photo from the join QR to its card, and page turns, the counter and the
 *   join card get small flourishes. Pre-rendered for the conference palette.
 */
export const wallLookSchema = z
  .object({
    header: z.enum(["classic", "split"]).optional(),
    announcement: z.enum(["classic", "filled"]).optional(),
    motion: z.enum(["classic", "signal"]).optional(),
    source: z
      .object({
        /** As the host prints it: owner/name. */
        repo: z
          .string()
          .regex(
            /^[\w.-]+\/[\w.-]+$/,
            "wall.source.repo is owner/name, like boothwall/boothwall-oss",
          ),
        /** The host's name under the repo, like github.com. */
        host: z
          .string()
          .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i, "wall.source.host is a host name, like github.com")
          .optional(),
        /** Printed in bold before the line, like MIT. */
        license: z.string().trim().min(1).max(16).optional(),
        /** Why to scan; the wall's own words when left out. */
        line: z.string().trim().min(1).max(60).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type WallLook = z.infer<typeof wallLookSchema>;
