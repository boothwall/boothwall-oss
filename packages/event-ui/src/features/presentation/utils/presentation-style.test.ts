import { contrast, INK, mix, SURFACES, TEXT_CONTRAST } from "@boothwall/shared";
import { expect, it } from "vitest";

import { PRESENTATION_ART_OPACITY, presentationStyle } from "./presentation-style";

it("keeps small accent and muted text readable over the brightest permitted artwork", () => {
  const background = mix(SURFACES.canvas, "#FFFFFF", PRESENTATION_ART_OPACITY);
  const style = presentationStyle({
    primary: "#707070",
    secondary: "#000000",
    tertiary: "#FFFFFF",
  }) as Record<string, string>;
  expect(contrast(style["--u-primary-text"]!, background)).toBeGreaterThanOrEqual(
    TEXT_CONTRAST.body,
  );
  for (const ink of [INK.onCanvas, INK.onCanvasMuted, INK.onCanvasSubtle])
    expect(contrast(ink, background)).toBeGreaterThanOrEqual(TEXT_CONTRAST.body);
});
