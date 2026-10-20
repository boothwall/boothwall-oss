import {
  type BoothwallConfig,
  boothwallConfig,
  contrast,
  mix,
  readableOn,
  TEXT_CONTRAST,
  WALL_THEMES,
} from "@boothwall/shared";

import { color, CUSTOM_BACKDROP_OPACITY, resolveWallColors, THEME_COLORS } from "./palette";

describe("wall themes", () => {
  it.each(WALL_THEMES)("keeps the %s theme's text readable from across the room", (theme) => {
    const colors = THEME_COLORS[theme];
    expect(contrast(color.textPrimary, colors.canvas)).toBeGreaterThanOrEqual(TEXT_CONTRAST.body);
    expect(contrast(color.textPrimary, colors.surfaceSolid)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.body,
    );
    expect(contrast(colors.brandPrimaryText, colors.canvas)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.large,
    );
    expect(contrast(colors.onBrandPrimary, colors.brandPrimary)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.body,
    );
    expect(contrast(colors.brandPrimaryOnPaper, color.paper)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.body,
    );
    expect(contrast(colors.onBrandSecondary, colors.brandSecondary)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.body,
    );
    expect(contrast(colors.brandSecondaryOnPaper, color.paper)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.body,
    );
  });
});

it.each(WALL_THEMES)(
  "custom accents retain readable %s surfaces and use all three colors",
  (theme) => {
    const colors = resolveWallColors(theme, {
      primary: "#FFFFFF",
      secondary: "#000000",
      tertiary: "#12AB34",
    });
    expect(colors.canvas).toBe(THEME_COLORS[theme].canvas);
    expect(colors.brandTertiary).toBe("#12AB34");
    expect(contrast(colors.brandPrimaryText, colors.canvas)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.large,
    );
    expect(contrast(colors.onBrandPrimary, colors.brandPrimary)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.body,
    );
    expect(contrast(colors.onBrandSecondary, colors.brandSecondary)).toBeGreaterThanOrEqual(
      TEXT_CONTRAST.body,
    );
    expect(resolveWallColors(theme)).toBe(THEME_COLORS[theme]);
  },
);

it("keeps a custom red accent readable in small display labels", () => {
  const colors = resolveWallColors("universal", {
    primary: "#cc0033",
    secondary: "#00aa88",
    tertiary: "#5555cc",
  });
  expect(contrast(colors.brandPrimaryText, colors.canvas)).toBeGreaterThanOrEqual(
    TEXT_CONTRAST.body,
  );
});
it.each(WALL_THEMES)("preserves small-text contrast above white custom artwork in %s", (theme) => {
  const colors = resolveWallColors(theme, {
    primary: "#707070",
    secondary: "#000000",
    tertiary: "#FFFFFF",
  });
  const background = mix(colors.canvas, "#FFFFFF", CUSTOM_BACKDROP_OPACITY);
  for (const ink of [
    colors.brandPrimaryText,
    color.textPrimary,
    color.textSecondary,
    color.textMuted,
  ])
    expect(contrast(ink, background)).toBeGreaterThanOrEqual(TEXT_CONTRAST.body);
});

it("writes the Universal accent in the brand's on-dark colour and keeps the primary for fills", () => {
  const { primary, primaryOnDark = primary } = (boothwallConfig as BoothwallConfig).theme;
  const colors = THEME_COLORS.universal;
  const backdrop = mix(colors.canvas, "#FFFFFF", CUSTOM_BACKDROP_OPACITY);
  expect(colors.brandPrimary).toBe(primary);
  expect(colors.brandPrimaryText).toBe(readableOn(primaryOnDark, backdrop, TEXT_CONTRAST.body));
  expect(contrast(colors.onBrandPrimary, colors.brandPrimary)).toBeGreaterThanOrEqual(
    TEXT_CONTRAST.body,
  );
});

it("leaves the brand's on-dark colour out of a custom palette's text", () => {
  const custom = { primary: "#FFB020", secondary: "#8FA9E5", tertiary: "#6555E8" };
  expect(resolveWallColors("universal", custom).brandPrimaryText).toBe("#FFB020");
});
