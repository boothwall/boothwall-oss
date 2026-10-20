import { readableOn, TEXT_CONTRAST, textOn, withAlpha } from "@boothwall/shared/brand";
import { SURFACES, surfaceThemeCss, webManifest } from "@boothwall/shared/brand";
import { type BoothwallConfig, boothwallConfig } from "@boothwall/shared/config";
import type { Plugin } from "vite";

const { canvas: CANVAS, paper: PAPER } = SURFACES;

/**
 * Brand CSS variables from shared code, then the two surface themes (public on the root, host
 * under data-surface="host"); the theme CSS only references them.
 */
function brandVariables(): string {
  const {
    primary,
    primaryOnDark = primary,
    secondary,
    tertiary,
  } = (boothwallConfig as BoothwallConfig).theme;
  const variables = {
    "--u-paper": PAPER,
    "--u-primary": primary,
    // The accent as text on the dark pages: the brand's on-dark colour when it has one.
    "--u-primary-text": readableOn(primaryOnDark, CANVAS),
    // Text on paper (the printables' "Scan to join"), so the body-text minimum.
    "--u-primary-on-paper": readableOn(primary, PAPER, TEXT_CONTRAST.body),
    "--u-on-primary": textOn(primary),
    "--u-primary-glow": withAlpha(primary, 0.55),
    "--u-secondary": secondary,
    // Small text on paper (hashtags, the card's eyebrow), so the body-text minimum.
    "--u-secondary-on-paper": readableOn(secondary, PAPER, TEXT_CONTRAST.body),
    "--u-tertiary": tertiary,
  };
  const body = Object.entries(variables)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return `:root{${body}}${surfaceThemeCss()}`;
}

/**
 * The `/gh` short link the TV's "Scan for the source" QR points to (upper case keeps the QR
 * coarse), and the old /admin (Control panel) and /wall (now the home page) addresses. Every
 * path sits under the app's base path.
 */
function redirects(base: string): string {
  const { source } = boothwallConfig.urls;
  return (
    [
      ...["gh", "GH"].map((path) => `${base}${path} ${source} 302`),
      `${base}admin ${base}control 301`,
      `${base}admin/* ${base}control 301`,
      `${base}wall ${base} 301`,
      // The TV's join QR is upper case; the app copes either way, this just tidies the address.
      `${base}SNAP ${base}snap 301`,
      `${base}wall/* ${base} 301`,
    ].join("\n") + "\n"
  );
}

const MANIFEST_FILE = "site.webmanifest";

/** The install manifest, named after the event. */
function manifest(base: string): string {
  const { name } = boothwallConfig.event;
  return webManifest({
    name,
    shortName: name,
    base,
    description: `Snap a photo and put it on the ${name} live wall.`,
  });
}

/**
 * Applies boothwall.config.ts to the web app: the event name in the title and meta tags, the
 * canvas as the browser's theme colour, the brand colours as CSS variables (inlined, so the
 * first paint is already on-brand), the install manifest and the `/gh`, `/admin` and `/wall`
 * redirects.
 */
export function boothwall(): Plugin {
  let base = "/";
  return {
    name: "boothwall",
    configResolved(config) {
      base = config.base;
    },
    generateBundle() {
      if (this.environment.name !== "client") return;
      this.emitFile({ type: "asset", fileName: "_redirects", source: redirects(base) });
      this.emitFile({ type: "asset", fileName: MANIFEST_FILE, source: manifest(base) });
    },
    configureServer(server) {
      server.middlewares.use(`${base}${MANIFEST_FILE}`, (_request, response) => {
        response.setHeader("Content-Type", "application/manifest+json");
        response.end(manifest(base));
      });
    },
    transformIndexHtml: {
      order: "pre",
      handler: (html) => ({
        html: html
          .replaceAll("%EVENT_NAME%", boothwallConfig.event.name)
          .replaceAll("%CANVAS_COLOR%", CANVAS)
          .replaceAll("%BASE%", base),
        tags: [{ tag: "style", children: brandVariables(), injectTo: "head-prepend" }],
      }),
    },
  };
}
