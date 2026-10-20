import { wallSnapshotSchema } from "@boothwall/shared";
import { parseWallEvent, PING_MS, reconnectDelayMs } from "@boothwall/wall-ui/tokens";

import { APPROVAL_POLL_LIMIT, APPROVAL_POLL_MS } from "#features/photo-approval/constants";
import { isArrivalOf, showsPhoto } from "#features/photo-approval/utils";
import type { EventTransport } from "#runtime";

import { fetchGuestPhotoState } from "./fetchGuestPhotoState";

export type WatchApprovalOptions = {
  /** The sender's delete token: the poll then asks the photo's own status, which can say no. */
  deleteToken?: string;
  /** The host declined the photo (removed or hid it). Only known with `deleteToken`. */
  onDeclined?: () => void;
};

/**
 * Socket notification plus polling fallback; all work is owned by this event subscription.
 * With the delete token each poll asks the photo's status; a host that can't answer it is
 * watched through the wall snapshot instead.
 */
export function watchApproval(
  transport: EventTransport,
  photoId: string,
  onApproved: () => void,
  { deleteToken, onDeclined }: WatchApprovalOptions = {},
): () => void {
  let statusToken = deleteToken;
  let done = false;
  let checking = false;
  let attempt = 0;
  let socket: WebSocket | undefined;
  let ping: number | undefined;
  let retry: number | undefined;
  const finish = (declined = false) => {
    if (done) return;
    stop();
    if (declined) onDeclined?.();
    else onApproved();
  };
  const checkWall = async () => {
    const response = await transport.request(`/photos?limit=${APPROVAL_POLL_LIMIT}`, {
      access: "public",
    });
    if (!done && showsPhoto(wallSnapshotSchema.parse(await response.json()), photoId)) finish();
  };
  const check = async () => {
    if (done || checking) return;
    checking = true;
    try {
      const state = statusToken
        ? await fetchGuestPhotoState(transport, photoId, statusToken)
        : null;
      if (done) return;
      if (state === "live" || state === "declined") finish(state === "declined");
      else if (state === null) {
        statusToken = undefined;
        await checkWall();
      }
    } catch {
      /* The next poll or socket message can recover. */
    } finally {
      checking = false;
    }
  };
  const connect = () => {
    if (done) return;
    const ws = new WebSocket(transport.socketUrl("public"));
    socket = ws;
    ws.onopen = () => {
      if (done || socket !== ws) {
        ws.close();
        return;
      }
      void check();
      ping = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, PING_MS);
    };
    ws.onmessage = ({ data }) => {
      if (done || socket !== ws) return;
      attempt = 0;
      const event = parseWallEvent(data);
      if (event?.type === "wall.access-changed") {
        if (event.permanent) stop();
        else ws.close();
        return;
      }
      if (isArrivalOf(event, photoId)) finish();
    };
    ws.onclose = () => {
      if (done || socket !== ws) return;
      window.clearInterval(ping);
      retry = window.setTimeout(connect, reconnectDelayMs(attempt++));
    };
  };
  const poll = window.setInterval(() => void check(), APPROVAL_POLL_MS);
  function stop() {
    done = true;
    window.clearInterval(poll);
    window.clearInterval(ping);
    window.clearTimeout(retry);
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.close();
    }
  }
  connect();
  return stop;
}
