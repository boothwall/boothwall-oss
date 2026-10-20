import { z } from "zod";

const safeUrl = (value: string, relative: boolean) => {
  if (
    /[\\\s]/u.test(value) ||
    [...value].some((character) => character.charCodeAt(0) < 32) ||
    value.startsWith("//")
  )
    return false;
  if (relative && value.startsWith("/")) return true;
  try {
    const url = new URL(value) as unknown as {
      protocol: string;
      username: string;
      password: string;
    };
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};
const imageUrl = z
  .string()
  .max(1024)
  .refine((value) => safeUrl(value, true));
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const brandPaletteSchema = z.object({ primary: hex, secondary: hex, tertiary: hex });
export type BrandPalette = z.infer<typeof brandPaletteSchema>;
/** Optional overrides; absent inherits host configuration, null artwork explicitly hides it. */
export const eventPresentationSchema = z.object({
  logoUrl: imageUrl.nullable().optional(),
  backdropUrl: imageUrl.nullable().optional(),
  theme: brandPaletteSchema.optional(),
  badge: z.string().trim().max(32).optional(),
  venue: z.string().trim().max(120).optional(),
  sourceUrl: z
    .string()
    .max(1024)
    .refine((value) => safeUrl(value, false))
    .optional(),
  sourceLabel: z.string().trim().max(80).optional(),
  showSourceOnWall: z.boolean().optional(),
  showSourceOnGuest: z.boolean().optional(),
});
export type EventPresentation = z.infer<typeof eventPresentationSchema>;

export function resolveEventPresentation<T extends EventPresentation>(
  defaults: T,
  overrides?: EventPresentation,
): Omit<T, "logoUrl" | "backdropUrl"> & EventPresentation {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(overrides ?? {}).filter(([, value]) => value !== undefined),
    ),
  };
}
