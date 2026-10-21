const CAPTION_MAX = 60;

const printable = (char) => {
  const code = char.codePointAt(0);
  return code >= 0x20 && (code < 0x7f || code > 0x9f);
};

/** Guest captions are untrusted: no control characters reach the terminal, and long ones are cut. */
export function safeCaption(caption) {
  const text = [...String(caption ?? "")].filter(printable).join("").trim();
  return text.length > CAPTION_MAX ? `${text.slice(0, CAPTION_MAX - 1)}…` : text;
}

/** A wall event as one feed line, or null for events the host needn't see. */
export function describeEvent(event) {
  switch (event?.type) {
    case "photo.created": {
      const caption = safeCaption(event.photo?.caption);
      return { tone: "good", text: `${caption ? `“${caption}”` : "A photo"} is on the wall` };
    }
    case "photo.removed":
      return { tone: "quiet", text: "A photo left the wall" };
    case "remote.command":
      return { tone: "quiet", text: `Phone remote: ${safeCaption(event.command)}` };
    case "settings.updated":
      return { tone: "quiet", text: "Settings saved in Control" };
    default:
      return null;
  }
}

/** New photos waiting for the host since the last count. */
export function describePending(previous, next) {
  const added = (next?.pending ?? 0) - (previous?.pending ?? 0);
  if (!previous || !Number.isSafeInteger(added) || added <= 0) return null;
  const what = added === 1 ? "A new photo is" : `${added} new photos are`;
  return { tone: "wait", text: `${what} waiting for approval  ·  press c` };
}

export function feedLine({ tone, text }, s, at = new Date()) {
  const mark = { good: s.good("✓"), wait: s.accent("●") }[tone] ?? s.dim("·");
  return `  ${s.dim(at.toTimeString().slice(0, 8))}  ${mark} ${tone === "quiet" ? s.dim(text) : text}`;
}

/**
 * What happens on the wall, as it happens: the screens' socket for photos going up, and the
 * host's photo counts for new uploads waiting in Control (pending photos never reach screens).
 * Returns the stop; nothing prints after it.
 */
export function startLiveFeed({
  apiUrl,
  passcode,
  print,
  intervalMs = 1500,
  fetchImpl = fetch,
  Socket = globalThis.WebSocket,
}) {
  let stopped = false;
  let socket;
  let retry;
  let counts;
  let polling = false;
  const say = (line) => line && !stopped && print(line);

  const connect = () => {
    if (stopped || !Socket) return;
    socket = new Socket(`${apiUrl.replace(/^http/, "ws")}/wall/live`);
    socket.addEventListener("message", ({ data }) => {
      try {
        say(describeEvent(JSON.parse(String(data))));
      } catch {
        /* Not an event; screens ignore these too. */
      }
    });
    socket.addEventListener("error", () => {});
    socket.addEventListener("close", () => {
      if (!stopped) retry = setTimeout(connect, 2000);
    });
  };

  const poll = async () => {
    if (polling) return;
    polling = true;
    try {
      const res = await fetchImpl(`${apiUrl}/photos/stats`, {
        headers: { authorization: `Bearer ${passcode}` },
      });
      const next = res.ok ? await res.json() : undefined;
      if (Number.isSafeInteger(next?.pending)) {
        say(describePending(counts, next));
        counts = next;
      }
    } catch {
      /* The API is busy or stopping; the next poll tries again. */
    } finally {
      polling = false;
    }
  };

  connect();
  void poll();
  const timer = setInterval(poll, intervalMs);
  return () => {
    stopped = true;
    clearInterval(timer);
    clearTimeout(retry);
    socket?.close();
  };
}
