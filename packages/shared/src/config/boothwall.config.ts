// Type-only import: this file must stay plain data, because the cf CLI loads it with Node.
import type { BoothwallConfig } from "./schema/boothwall-config.schemas.ts";

/**
 * Make BoothWall yours: this is the one file to edit. The TV app, the web app and the
 * API all read it at build time. Every field is explained in docs/customising.md.
 *
 * Logo, backdrop and icons are images in packages/wall-ui/src/assets/brand, apps/tv-vega/assets/image,
 * apps/web/src/assets/brand and apps/web/public. `pnpm boothwall setup` creates your
 * Cloudflare resources and fills in `urls`, `demo` and `deploy` for you.
 */
export const boothwallConfig = {
  event: {
    name: "BoothWall Live Demo",
    hashtag: "#BoothWall",
    year: "2026",
  },
  categories: [
    { id: "first-timers", label: "First time here" },
    { id: "regulars", label: "Regulars" },
    { id: "team", label: "On the team" },
    { id: "friends", label: "Friends & family" },
    { id: "visiting", label: "Just visiting", catchAll: true },
  ],
  theme: {
    primary: "#CC4128",
    primaryOnDark: "#FF6A4D",
    secondary: "#8FA9E5",
    tertiary: "#6555E8",
  },
  urls: {
    api: "https://wall-api.example.com",
    web: "https://wall.example.com",
    source: "https://github.com/boothwall/boothwall-oss",
  },
  author: { handle: "@ddedic" },
  // Optional: a small label beside the logo, like badge: "Built on Vega OS".
  // Presentation defaults. Basic Control changes only playback and upload intake at runtime.
  settings: { captionStyle: "kalam", secondsPerPhoto: 7 },
  // The open-source look: BoothWall's lockup top left, your event top right, and the repo on the
  // source card when `credits: true` shows it. Remove `wall` for the classic header.
  wall: {
    header: "split",
    source: { repo: "boothwall/boothwall-oss", host: "github.com", license: "MIT" },
  },
  // Runs the TV on the bundled demo photos until you deploy your API (`pnpm boothwall setup`).
  demo: false,
  // Optional: the TV app's one wall, fixed at build time, e.g. tv: { wallId: "default" }.
  // See docs/customising.md before adding a display credential; never publish a build.
  retentionDays: 14,
  deploy: {
    name: "boothwall",
    d1DatabaseId: "",
    apiDomain: "",
    webDomain: "",
    // Older API domains to keep serving, e.g. after a move. TVs built for them keep working.
    extraApiDomains: [],
  },
} as const satisfies BoothwallConfig;
