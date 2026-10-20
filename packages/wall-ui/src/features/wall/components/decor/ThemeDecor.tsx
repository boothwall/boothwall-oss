import type { WallTheme } from "@boothwall/shared";
import React, { type ComponentType } from "react";

import { useWallLook } from "#features/wall/hooks/useWallLook";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { useWallTheme } from "#theme/wallTheme";

import { ConferenceDecor } from "./ConferenceDecor";
import { PartyDecor } from "./PartyDecor";
import { SignalDecor, type SignalDecorProps } from "./SignalDecor";
import { WeddingDecor } from "./WeddingDecor";

/** What each theme moves over its backdrop; the universal wall has nothing extra. */
const DECOR: Record<WallTheme, ComponentType | null> = {
  universal: null,
  wedding: WeddingDecor,
  party: PartyDecor,
  conference: ConferenceDecor,
};

/**
 * The live theme's moving layers, between the backdrop and the photos. The signal look brings
 * its own in place of the configured theme's, on the slideshow's beat; another theme picked live
 * shows its own layers.
 */
export function ThemeDecor({ beat, paused }: SignalDecorProps) {
  const { theme } = useWallTheme();
  const { motion } = useWallLook();
  const configured = useWallSettings().theme;
  if (motion === "signal" && theme === configured)
    return <SignalDecor beat={beat} paused={paused} />;
  const Decor = DECOR[theme];
  return Decor ? <Decor /> : null;
}
