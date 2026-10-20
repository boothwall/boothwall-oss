// The brand's logos from the brand package, so there is one source; the app's bundler serves them.
import horizontalOnDark from "@boothwall/brand/logos/boothwall-on-dark.svg";
import horizontalOnLight from "@boothwall/brand/logos/boothwall-on-light.svg";
import symbolOnDark from "@boothwall/brand/logos/boothwall-symbol-on-dark.svg";
import symbolOnLight from "@boothwall/brand/logos/boothwall-symbol-on-light.svg";

export type LogoTone = "on-dark" | "on-light";

export const LOGO_SOURCES = {
  horizontal: { "on-dark": horizontalOnDark, "on-light": horizontalOnLight },
  symbol: { "on-dark": symbolOnDark, "on-light": symbolOnLight },
} as const satisfies Record<string, Record<LogoTone, string>>;
