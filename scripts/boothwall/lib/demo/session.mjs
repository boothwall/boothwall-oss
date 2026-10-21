import { log } from "../ui.mjs";
import { copyText, launch, listenForKeys, opener } from "./keys.mjs";
import { feedLine, startLiveFeed } from "./live.mjs";
import { painter } from "./style.mjs";

/** The shortcuts the ready card lists; `t` only when there are TV instructions to show. */
export const sessionKeys = ({ tvHelp }) => [
  ["w", "wall"],
  ["c", "Control"],
  ["s", "guest page"],
  ["p", "copy passcode"],
  ...(tvHelp ? [["t", "TV setup"]] : []),
  ["r", "card"],
  ["q", "quit"],
];

/**
 * After the card: the live feed and the shortcuts. Returns the cleanup, which restores the
 * terminal and stops the feed; call it before the servers stop.
 */
export function startSession({ webUrl, apiUrl, passcode, tvHelp, card, output }) {
  const s = painter(output);
  let wentUp = 0;
  const say = (entry) => {
    if (entry.tone === "good") wentUp++;
    log(feedLine(entry, s));
  };
  const open = (path, what) => async () => {
    const url = `${webUrl}${path}`;
    say({ tone: "quiet", text: `Opening ${what}` });
    if (!(await launch(...opener(url)))) say({ tone: "quiet", text: `Open ${url} in a browser` });
  };
  const actions = {
    w: open("/", "the wall"),
    c: open("/control", "Control"),
    s: open("/snap", "the guest page"),
    p: async () =>
      say({
        tone: "quiet",
        text: (await copyText(passcode)) ? "Passcode copied" : `Passcode: ${passcode}`,
      }),
    r: () => log(card()),
    q: () => process.kill(process.pid, "SIGINT"),
    ...(tvHelp ? { t: () => log(tvHelp) } : {}),
  };

  log(
    `\n${s.pill(" LIVE ")}  ${s.dim("Waiting for guests. Their photos show up here as they arrive.")}`,
  );
  const stopFeed = startLiveFeed({ apiUrl, passcode, print: say });
  const stopKeys = listenForKeys(actions);
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    stopKeys();
    stopFeed();
    const photos = wentUp === 1 ? "1 photo" : `${wentUp} photos`;
    log(`\n${s.accent("✦")} Wall stopped. ${s.dim(`${photos} went up while it ran.`)}`);
  };
}
