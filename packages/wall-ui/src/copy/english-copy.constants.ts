import { BADGE_LABEL, boothwallConfig, type WallTheme } from "@boothwall/shared";

/** The join card in a theme's own words: an emoji, what to do and what it gets you. */
type JoinVoice = { icon: string; title: string; hint: string };

/**
 * The join card per theme. The emoji comes before the title so the card reads as "take a photo"
 * at a glance; the hint under the QR says what scanning gets you, in one breath.
 */
export const JOIN_VOICE = {
  universal: { icon: "📸", title: "Scan to join", hint: "Snap a photo, see it here." },
  wedding: { icon: "🥂", title: "Share the love", hint: "Snap a photo for the couple." },
  party: { icon: "🎉", title: "Join the party", hint: "Snap a photo, light up the wall." },
  conference: { icon: "🎤", title: "Scan to share", hint: "Snap a photo, see it on stage." },
} satisfies Record<WallTheme, JoinVoice>;

export const wallCopy = {
  badge: BADGE_LABEL,
  author: {
    handle: boothwallConfig.author.handle,
    title: "Open source",
    body: "Free to run at your own event.",
    /** The repo source card's line under the host, after the license. */
    pitch: "run this wall at your own event",
    label: (handle: string) => `BoothWall is free and open source, on GitHub by ${handle}`,
  },
  /** Read out for the split header's lockup (assets/brand/lockup.png). */
  lockup: "BoothWall",
  moments: (n: number) => (n === 1 ? "moment" : "moments"),
  /** The join card in the live theme's words. */
  join: JOIN_VOICE,
  whoIsHereTitle: "Who's here",
  whoMore: (n: number) => `+${n} more`,
  whoIsHereRow: (label: string, count: number) => `${label}: ${count}`,
  empty: {
    title: "Your photo could be up here.",
    ghost: "You?",
    scanMe: "Scan me",
  },
  openSelected: "Open the selected photo",
  newBadge: "NEW",
  noCaption: "No caption, just vibes",
  incoming: { title: "New photo", upNext: "up next" },
  nextPhoto: "Next photo",
  pageTurn: (page: number, pages: number) => `Page ${page} of ${pages}`,
  paused: "Paused",
  /** Beside the counter while the countdown ends with this photo's next one opening full screen. */
  opensNext: "Opens next",
  announcementLabel: "Announcement",
  /** Read out for the filled announcement, which shows no label. */
  announcementSpoken: (text: string) => `Announcement: ${text}`,
  position: (current: number, total: number) => `${current} of ${total}`,
  /** The now-showing counter: compact, it sits at the end of the progress line. */
  counter: (current: number, total: number) => `${current} / ${total}`,
  connection: {
    connecting: "Connecting to the live wall",
    loading: "Loading photos",
    failedTitle: "Can't reach the wall",
    failedBody: "Check this device's network connection. Retrying automatically.",
    attempt: (n: number) => `Attempt ${n}`,
  },
  /** The wall answered that this screen may no longer show it (gone, or access withdrawn). */
  accessChanged: "This screen no longer has access to the wall.",
  restarting: {
    title: "Restarting the wall…",
    body: "Back in a moment.",
  },
  eventOver: {
    eyebrow: "That's a wrap",
    title: "Thanks for coming!",
    closedBody: (eventName: string) => `Thanks for sharing your moments at ${eventName}.`,
    body: (eventName: string) =>
      `Every photo from ${eventName} is on one page. Scan the code to see them all, the crowd's favourites, and download the lot.`,
    moments: (n: number) => (n === 1 ? "1 moment on the wall" : `${n} moments on the wall`),
    scan: "Scan for the recap",
  },
  exitHint: { before: "Press ", key: "Back", after: " again to exit" },
  status: {
    connecting: "Connecting",
    live: "Live",
    offline: "Reconnecting",
    simulated: "Demo",
  },
} as const;

export const picksCopy = {
  crowd: "Crowd favourite",
  ai: "AI pick",
  reactions: (n: number) => (n === 1 ? "1 reaction" : `${n} reactions`),
  aiReason: "Made for the big screen",
  /** Over the countdown until the wall carries on. */
  backToWall: "Back to the wall",
} as const;

export const offlineCopy = {
  notice: "Offline · showing saved photos",
} as const;
