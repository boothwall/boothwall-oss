import { createContext, useContext } from "react";

/** Device pixels per canvas dp on the TV: Vega draws the 960×540 canvas at 1080p. */
export const TV_PIXEL_DENSITY = 2;

const PixelDensityContext = createContext(TV_PIXEL_DENSITY);

/** For a host that draws the canvas at another density (the web scales it to the window). */
export const PixelDensityProvider = PixelDensityContext.Provider;

/** Device pixels per dp where the wall is drawn, so images pick a copy that stays sharp. */
export const usePixelDensity = () => useContext(PixelDensityContext);
