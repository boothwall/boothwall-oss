import React, { memo } from "react";

import { THEME_LAYERS } from "#theme/themeArt";
import { decor } from "#theme/tokens";

import { SweepingBeam } from "../primitives/SweepingBeam";

const { width, height, swing, halfMs, stagger, fixtures } = decor.beam;

/** Two spotlights swinging slowly over the stage, out of step with each other. */
export const ConferenceDecor = memo(function ConferenceDecor() {
  return (
    <>
      {fixtures.map((fixture, index) => (
        <SweepingBeam
          key={fixture.x}
          source={THEME_LAYERS.conference.beam}
          x={fixture.x}
          y={fixture.y}
          width={width}
          height={height}
          // Opposite directions and slightly different speeds, so they cross now and then.
          swing={index % 2 ? -swing : swing}
          halfMs={halfMs + index * stagger}
        />
      ))}
    </>
  );
});
