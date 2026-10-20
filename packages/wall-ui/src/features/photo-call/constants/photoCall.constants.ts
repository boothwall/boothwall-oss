export const PHOTO_CALL_MS = 60_000;
export const FINALE_MS = 4500;
export const FINALE_PHOTOS = 5;

export const photoCallCopy = {
  kicker: "Photo call",
  title: "Everyone,\nsnap a photo!",
  mission: "Mission",
  waiting: "Scan, snap, send",
  waitingNote: "Photos land once they're approved.",
  arrived: (count: number) => (count === 1 ? "1 new photo" : `${count} new photos`),
  arrivedNote: "Already on the wall.",
  scan: "Scan to join",
  noApp: "No app, no account",
  back: "Back returns to the wall",
  /** The browser wall's Back is the keyboard's Escape. */
  escape: "Esc returns to the wall",
  finaleArrived: (count: number) =>
    count === 1 ? "new photo in a minute" : "new photos in a minute",
  finaleThanks: "Thanks, everyone! They're on the wall now.",
  finaleWrap: "That's a wrap",
  finaleOpen: "The QR stays open: scan any time.",
} as const;
