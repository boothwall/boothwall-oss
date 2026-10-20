/** Narrower than Tailwind's `lg`: phones and tablets held upright get the one-column pages. */
export const WIDE_QUERY = "(min-width: 1024px)";

export const isNarrowViewport = () => !window.matchMedia(WIDE_QUERY).matches;
