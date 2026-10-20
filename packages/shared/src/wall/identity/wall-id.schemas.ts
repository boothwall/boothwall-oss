import { z } from "zod";

/**
 * Which wall a request, a photo or a realtime room belongs to.
 *
 * The open-source API serves one wall, always `DEFAULT_WALL_ID`. The id is the seam that lets
 * a host run many walls on the same code: the API resolves it once per request and every
 * query, settings row and realtime room is scoped by it. Lowercase letters, digits and
 * dashes, so it is safe in keys, URLs and Durable Object names.
 */
export const wallIdSchema = z
  .string()
  .regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/, "A wall id is 1-64 of a-z, 0-9 and -.");

export type WallId = z.infer<typeof wallIdSchema>;

/** The one wall of a self-hosted BoothWall. Existing rows default to it. */
export const DEFAULT_WALL_ID: WallId = "default";
