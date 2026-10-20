import { SURFACE_THEMES, type SurfaceTheme } from "../surfaces/surfaces.constants.ts";

export type WebManifestOptions = {
  name: string;
  shortName: string;
  description: string;
  /** Which surface theme the app opens on; public (navy) unless it is a host tool. */
  surface?: SurfaceTheme;
  /** The path the app is served under, ending in "/". */
  base?: string;
};

const icon = (src: string, size: number, purpose: "any" | "maskable") => ({
  src,
  sizes: `${size}x${size}`,
  type: "image/png",
  purpose,
});

/** The web app manifest, its colours from the app's canvas. Icons are the ones brand/ renders. */
export function webManifest({
  name,
  shortName,
  description,
  surface = "public",
  base = "/",
}: WebManifestOptions): string {
  const { canvas } = SURFACE_THEMES[surface];
  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: base,
    display: "standalone",
    background_color: canvas,
    theme_color: canvas,
    icons: [
      icon(`${base}pwa-192.png`, 192, "any"),
      icon(`${base}pwa-512.png`, 512, "any"),
      icon(`${base}pwa-maskable-192.png`, 192, "maskable"),
      icon(`${base}pwa-maskable-512.png`, 512, "maskable"),
    ],
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
