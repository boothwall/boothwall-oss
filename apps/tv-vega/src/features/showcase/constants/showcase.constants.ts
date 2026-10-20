import type { WallTheme } from "@boothwall/shared";

export const SHOWCASE_LABEL_MS = 2500;

const NAMES: Record<WallTheme, string> = {
  universal: "Universal",
  wedding: "Wedding",
  party: "Party",
  conference: "Conference",
};

export const showcaseCopy = {
  label: "Theme",
  name: (theme: WallTheme) => NAMES[theme],
  config: (theme: WallTheme) => `settings.theme: "${theme}"`,
  hint: "☰ next theme",
} as const;
