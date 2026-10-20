import type { Plugin } from "vite";
import { z } from "zod";

function validPrerelease(value: string) {
  const prerelease = value.split("+")[0]!.split("-").slice(1).join("-");
  return !prerelease.split(".").some((part) => /^0\d+$/.test(part));
}

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const identitySchema = z.strictObject({
  schemaVersion: z.literal(1),
  productVersion: z
    .string()
    .regex(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
    )
    .refine(validPrerelease),
  buildId: z.string().regex(/^bw-[a-f0-9]{32}$/),
  sourceExportDigest: digest,
  coreSourceDigest: digest,
  coreDependencyDigest: digest,
  protocol: z
    .strictObject({ min: z.number().int().positive(), max: z.number().int().positive() })
    .refine(({ min, max }) => min <= max),
});

/** Public provenance may be added only by a separately verified publication adapter. */
export function parseBuildIdentity(raw: string) {
  return identitySchema.parse(JSON.parse(raw));
}

export function buildIdentity(raw: string | undefined): Plugin {
  if (raw === undefined) return { name: "boothwall-build-identity" };
  const identity = parseBuildIdentity(raw);
  return {
    name: "boothwall-build-identity",
    generateBundle() {
      if (this.environment.name !== "client") return;
      this.emitFile({
        type: "asset",
        fileName: "release-identity.json",
        source: `${JSON.stringify(identity)}\n`,
      });
    },
  };
}
