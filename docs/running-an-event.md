# Running an event

Open `/` on the display, share `/snap` with guests, and keep `/control` on the host's phone or laptop. The display keeps its own connection; closing Control does not stop it.

## The TV remote

| Button          | What it does                                                     |
| --------------- | ---------------------------------------------------------------- |
| OK              | Opens or closes the full-screen spotlight                        |
| OK, held        | Starts a photo call; hold it again or press Back to end it early |
| Left / Right    | Steps through approved photos                                    |
| Back            | Closes the spotlight; press twice on the wall to exit            |
| Play/Pause      | Pauses or resumes the slideshow                                  |
| Next / Previous | Steps to the next or previous photo                              |
| Menu            | Opens the remote help card (in demo mode, the next theme)        |

A **photo call** fills the screen for a minute: the join QR, a mission (your categories in turn) and a countdown. Photos still need your approval; the call counts the ones that reach the wall.

These keys arrive through Vega Media Controls, the route Alexa's "pause" and "next" take too. After a fresh install, they start working from the second launch of the app.

`pnpm remote` opens a remote in your browser at http://localhost:4400. It drives the Virtual Device; set `VEGA_DEVICE=<serial>` for a Fire TV Stick in developer mode.

## The Control desk

Unlock `/control` using the administrator passcode configured during setup. Ten wrong passcodes from one network address within 15 minutes lock that address out for the rest of the window. The old `/admin` address redirects here. On a laptop Control is one desk; on a phone the same desk is three tabs, each at its own address: **Review** (`/control`), **Live** (`/control/live`) and **Guests** (`/control/guests`).

- The numbers at the top count the photos on the wall, the ones waiting and the ones sent today (since midnight on the host's device). They refresh every 5 seconds and after each decision.
- Review waiting photos one at a time, each shown whole with its caption, category and age: approve or reject them. **Approve** turns on once the full photo has loaded, so you judge what the wall will show; rejecting a photo, or removing one from the wall, asks you to confirm. Any photo further down the queue can be brought up first.
- Open **On the wall** (or **See all** under the newest photos) to remove an approved photo.
- **On the wall now** shows the wall live, as the display draws it.
- The **Slideshow** switch pauses and resumes playback. The **Guest uploads** switch opens and closes new guest submissions. These are separate persisted switches; neither deletes photos or ends the event.
- **Photo call** starts a one-minute photo call on the Fire TV app and on any open browser wall, where Escape ends it early.
- **Remote help** opens the remote help card on the Fire TV app and the browser wall: every button and what it does, for about 10 seconds or until any key (or, in a browser, a click) closes it.
- **Next theme** shows the next built-in theme on the Fire TV app and the browser wall, naming it on the TV. It lasts until the app restarts or the page reloads and never changes `settings.theme`.
- **Sent** on these three buttons means the request reached your API. Control can't see whether a TV or a browser wall is on to receive it.
- Open the wall on the display, then press F for full screen.
- Copy the guest link or scan the guest QR, which points to `/snap`.
- **Lock** the panel when finished.

Presentation, branding and categories live in the [configuration](customising.md), not in Control. Older saved presentation overrides are still read until you migrate them; see [Migrating saved settings](config-migration.md) before changing an existing installation.

## What the guest sees

After sending, the guest's page shows their photo as a polaroid and follows it:

| The photo is                               | The page says                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Waiting                                    | "Sent!" and "Waiting for approval"                                                                                               |
| Still waiting after 15 seconds             | "Still waiting · the host reviews each photo", and that a person approves every photo, so it can take a minute                   |
| Approved                                   | "You're live. Look up!"                                                                                                          |
| Rejected or removed by the host            | "Not this time. The host didn't put this one on the wall.", the polaroid greyed as "Not on the wall", and **Send another photo** |
| Removed by the guest (**Remove my photo**) | "Your photo was removed from the wall."                                                                                          |

With `autoApprove` on, the photo is live straight away. The page asks the API about that one photo (`GET /photos/:id/status`, with the delete token only that guest's browser holds) and listens to the wall, for up to 15 minutes; after that the guest can still look at the screen. Reloading or leaving the page ends it. The page follows the phone's language, English or German; `?lang=de` picks German by hand.

## Privacy and safety

Manual approval is the default. A self-hoster may explicitly configure `autoApprove` for a trusted event. The standalone API has no automated photo reviewer; [older review settings](smart-moderation.md) explains how to upgrade saved data safely.

Guests must confirm consent. After sending, they can remove that photo from its confirmation screen while it's waiting or on the wall. Reloading, leaving the page or choosing **Add another photo** loses this browser action; it is not a restored personal photo history. Hosts can still remove photos from Control. Retention cleanup follows configured `retentionDays`, except photos marked `keep` through the API.

Pending photos require signed media access. Administrator requests require the passcode, and repeated wrong attempts are rate-limited. See [abuse protection](architecture.md#abuse-protection) for upload validation and limits.

## Before guests arrive

1. Configure the event and deploy your own stack.
2. Unlock Control and verify playback and upload intake are open as intended.
3. Scan its guest QR with another device, submit a test photo, approve it and observe it on the display.
4. Test pause/resume and upload closure separately.
5. For a long event, perform a representative run on the actual screen and network. See the [Vega OS notes](vega-os-notes.md#performance-on-vega-os) for the recorded platform observations.
