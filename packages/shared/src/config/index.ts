import { boothwallConfig } from "./boothwall.config.ts";
import { boothwallConfigSchema } from "./schema/boothwall-config.schemas.ts";

// Fail the build, not the booth: every app imports this package, so a broken config throws.
boothwallConfigSchema.parse(boothwallConfig);

export { boothwallConfig };
export * from "./credits/source-credits.utils.ts";
export * from "./defaults/settings.defaults.ts";
export * from "./event/event.constants.ts";
export * from "./migration/index.ts";
export * from "./schema/boothwall-config.schemas.ts";
export * from "./schema/wall-look.schemas.ts";
export * from "./urls/web-address.utils.ts";
