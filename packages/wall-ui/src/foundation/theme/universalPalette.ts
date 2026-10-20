import type { BrandPalette } from "@boothwall/shared";
import { createContext, useContext } from "react";

const UniversalPaletteContext = createContext<BrandPalette | undefined>(undefined);

/**
 * For a host with its own brand: the Universal theme draws in these colours instead of
 * boothwall.config.ts's `theme`. An event's own colours still win, and other themes keep theirs.
 */
export const UniversalPaletteProvider = UniversalPaletteContext.Provider;

/** The host's Universal colours, if it set them. */
export const useUniversalPalette = () => useContext(UniversalPaletteContext);
