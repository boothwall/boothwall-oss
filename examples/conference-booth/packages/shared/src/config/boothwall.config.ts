// Type-only import: this file must stay plain data, because the cf CLI loads it with Node.
import type { BoothwallConfig } from "./schema/boothwall-config.schemas.ts";

/**
 * A made-up developer conference with a booth on the expo floor. Its categories are photo
 * missions guests pick when they upload; the side panel's bars race as photos come in.
 */
export const boothwallConfig = {
  event: {
    name: "Acme DevDays 2026",
    hashtag: "#AcmeDevDays",
    venue: "Expo Hall 2",
    year: "2026",
  },
  categories: [
    { id: "speaker-selfie", label: "Speaker selfie" },
    { id: "booth-find", label: "Best booth find" },
    { id: "your-team", label: "Your team" },
    { id: "learned", label: "Lesson learned" },
    { id: "visiting", label: "Just visiting", catchAll: true },
  ],
  theme: {
    primary: "#22D3B6",
    secondary: "#FF5C8A",
    tertiary: "#8B5CF6",
  },
  urls: {
    api: "https://wall-api.example.com",
    web: "https://wall.example.com",
    source: "https://github.com/boothwall/boothwall-oss",
  },
  author: { handle: "@ddedic" },
  badge: "Booth 14",
  settings: {
    theme: "conference",
    captionStyle: "kalam",
    secondsPerPhoto: 7,
    announcement: "Keynote at 14:00 in Hall B",
    // Picks need reactions or a review provider, which this edition doesn't have.
    showPicks: false,
  },
  // On the bundled photos until `pnpm boothwall setup` deploys the API and fills in `urls`.
  demo: true,
  retentionDays: 14,
  deploy: {
    name: "acme-devdays",
    d1DatabaseId: "",
    apiDomain: "",
    webDomain: "",
  },
} as const satisfies BoothwallConfig;
