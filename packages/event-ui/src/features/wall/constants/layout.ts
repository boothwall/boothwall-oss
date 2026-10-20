/**
 * How much of the canvas edge fades into the same flat tone around it, so cards that reach the
 * edge soften instead of clipping. The wall keeps its content clear of this margin.
 */
export const CANVAS_EDGE_FEATHER = "3%";
/** Touch-first devices get the "Add your photo" button instead of the full screen hint. */
export const COARSE_POINTER_QUERY = "(pointer: coarse)";
/** Portrait touch devices get rotation guidance: the wide canvas would be a thin strip. */
export const PORTRAIT_HANDHELD_QUERY = "(orientation: portrait) and (max-width: 1024px)";
