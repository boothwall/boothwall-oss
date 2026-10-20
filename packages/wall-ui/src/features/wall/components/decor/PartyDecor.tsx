import React, { memo } from "react";

import { THEME_LAYERS } from "#theme/themeArt";
import { decor } from "#theme/tokens";

import { FallingLayer } from "../primitives/FallingLayer";

/** Confetti falling over the club lights. */
export const PartyDecor = memo(function PartyDecor() {
  return <FallingLayer source={THEME_LAYERS.party.confetti} periodMs={decor.confettiFallMs} />;
});
