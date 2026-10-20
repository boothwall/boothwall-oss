import { z } from "zod";

/** Reported client support is metadata, never authorization or proof of current availability. */
export const CLIENT_CAPABILITIES = [
  "remote-keys",
  "touch",
  "identify",
  "reload",
  "set-playback",
  "lease-offline-cache",
] as const;

export type ClientCapability = (typeof CLIENT_CAPABILITIES)[number];

export const clientDescriptorSchema = z.object({
  schemaVersion: z.literal(1),
  platform: z.enum(["web", "fire-tv-vega", "fire-tv-android", "unknown"]),
  version: z.string().trim().min(1).max(100),
  build: z.string().trim().min(1).max(100),
  protocolVersion: z.number().int().positive(),
  capabilities: z.array(z.string().min(1).max(100)).max(64),
});

export type ClientDescriptor = z.infer<typeof clientDescriptorSchema>;

/** Unknown future names survive parsing but cannot enable an action in this client version. */
export function supportedClientCapabilities(descriptor: ClientDescriptor): ClientCapability[] {
  return CLIENT_CAPABILITIES.filter((capability) => descriptor.capabilities.includes(capability));
}
