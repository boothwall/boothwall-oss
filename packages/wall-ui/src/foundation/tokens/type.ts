// Type sizes are dp on Vega's 960x540 canvas (1080p at 2x).

export const fontSize = {
  /** Quiet secondary lines on a card that must not compete with the photos, such as the repo card. */
  fine: 12,
  /** The smallest text on the wall: 28 px at 1080p, still readable from three metres. */
  caption: 14,
  body: 15,
  lead: 18,
  /** One line that has to carry across the room: the filled announcement, the repo's name. */
  callout: 22,
  heading: 24,
  /** The split header's event title; a long one steps down 1 dp at a time to the min, then truncates. */
  eventTitle: 25,
  eventTitleMin: 20,
  /** Emoji floating up over a photo when guests react. */
  reaction: 26,
  title: 44,
} as const;

/** Letter spacing: tight for big headings, wide for small caps labels. */
export const tracking = {
  title: -1.5,
  heading: -0.5,
  callout: -0.3,
  label: 1.2,
  mark: 2,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
  black: "900",
} as const;
