/** The two surface themes (see surfaceThemeCss in @boothwall/shared): guests on public, hosts on host. */
export type SurfaceName = "public" | "host";

/**
 * Puts the whole document on one surface theme: sets `data-surface` on <html>, so the page,
 * the overscroll and every portal follow it, and points the browser's theme colour at its canvas.
 */
export function applySurface(surface: SurfaceName, root: HTMLElement = document.documentElement) {
  root.dataset.surface = surface;
  const canvas = getComputedStyle(root).getPropertyValue("--u-canvas").trim();
  const meta = root.ownerDocument.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta && canvas) meta.content = canvas;
}
