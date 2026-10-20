export const controlCopy = {
  title: "Control",
  passcodeLabel: "Passcode",
  unlock: "Unlock",
  checking: "Checking…",
  badPasscode: "Wrong passcode.",
  locked: "Too many wrong passcodes. Try again in 15 minutes.",
  openWall: "Open the wall",
  unlockScreen: {
    eyebrow: "For the host",
    formTitle: "Unlock Control",
    can: [
      "Approve or reject every photo",
      "Pause the slideshow, close uploads",
      "Start a photo call on the wall",
    ],
    show: "Show passcode",
    hide: "Hide passcode",
    hint: "The operator passcode set for this wall.",
    placeholder: "Enter the passcode",
    empty: "Type the passcode first.",
  },
  /**
   * Deciding on the original. The thumbnail comes from the guest's phone and nothing ties it to
   * the original, so approval waits for the photo the wall will actually show.
   */
  original: {
    waits: "Approve turns on once the full photo has loaded.",
    loaded: "The full photo is loaded, so you see what the wall will show.",
    failed: "The full photo didn't load, so it can't be approved yet. You can still reject it.",
    retry: "Try again",
  },
  bar: {
    lock: "Lock",
    lockName: "Lock the panel",
    playing: "Slideshow playing",
    paused: "Slideshow paused",
    open: "Uploads open",
    closed: "Uploads closed",
  },
  failure: {
    reach: "Couldn't reach the wall. Your photos are kept here; try again.",
    live: "Couldn't load the current playback and upload state.",
    retry: "Retry",
  },
  stats: { onWall: "on the wall", waiting: "waiting", today: "sent today", unknown: "–" },
  tabs: { label: "Control", review: "Review", live: "Live", guests: "Guests" },
} as const;
