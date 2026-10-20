import type { RemoteMessage, WallSettings, WallTarget } from "@boothwall/shared";
import { AppState } from "react-native";

import { appConfig } from "#app/config";

import { EARLY_SNAPSHOT_MS, PING_MS, SILENT_SOCKET_MS } from "../constants/feed";
import { fetchWall, ScreenAccessError } from "../data/fetchWall";
import { parseWallEvent, reconnectDelayMs, wallSocketUrl } from "../data/wallSocket";
import { type FeedStatus } from "../state/connectionPhase";
import { type WallAction } from "../state/wallState";

type LiveOptions = {
  target: WallTarget;
  apiBaseUrl?: string;
  onAccessRevoked?: () => void;
  /** false in simulation: keep the socket for remote commands, ignore photo traffic. */
  photos: boolean;
  dispatch: (action: WallAction) => void;
  setStatus: (status: FeedStatus) => void;
  onLoaded: () => void;
  onFailure: () => void;
  onRemote: (command: RemoteMessage) => void;
};

/** HTTP snapshot, then live events over the socket; the snapshot is refetched on every reconnect. */
export function connectLive({
  target,
  apiBaseUrl = appConfig.apiBaseUrl,
  onAccessRevoked,
  photos,
  dispatch,
  setStatus,
  onLoaded,
  onFailure,
  onRemote,
}: LiveOptions) {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let snapshotTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let snapshotAttempt = 0;
  let lastHeard = 0;
  let disposed = false;
  let snapshotSeq = 0;
  // Settings pushed over the socket while a snapshot is on its way are newer than the
  // snapshot's own: they win when it lands.
  let pushedSettings: WallSettings | null = null;

  const loadSnapshot = () => {
    if (!photos && !target.screenToken) return;
    if (snapshotTimer !== undefined) clearTimeout(snapshotTimer);
    const seq = ++snapshotSeq;
    pushedSettings = null;
    fetchWall(target, apiBaseUrl)
      .then((snapshot) => {
        if (disposed || seq !== snapshotSeq) return;
        snapshotAttempt = 0;
        if (!photos) return;
        const settings = pushedSettings ?? snapshot.settings;
        dispatch({ type: "snapshot", snapshot: { ...snapshot, settings } });
        onLoaded();
      })
      .catch((error: unknown) => {
        if (disposed || seq !== snapshotSeq) return;
        if (error instanceof ScreenAccessError) {
          dispose();
          setStatus("offline");
          onAccessRevoked?.();
          return;
        }
        // On a live socket, dropping it makes the reconnect backoff retry both together.
        // Without one (still connecting, or HTTP-only), retry the snapshot on its own backoff.
        if (socket?.readyState === WebSocket.OPEN) drop();
        else snapshotTimer = setTimeout(loadSnapshot, reconnectDelayMs(snapshotAttempt++));
      });
  };

  const handleClose = () => {
    socket = null;
    if (pingTimer !== undefined) clearInterval(pingTimer);
    if (disposed) return;
    if (photos) {
      setStatus("offline");
      onFailure();
    }
    retryTimer = setTimeout(connect, reconnectDelayMs(attempt++));
  };

  /** Close without waiting for the close handshake, which a dead link may never finish. */
  const drop = () => {
    const dead = socket;
    if (!dead) return;
    dead.onopen = dead.onmessage = dead.onerror = dead.onclose = null;
    try {
      dead.close();
    } catch {
      // Already closed.
    }
    handleClose();
  };

  const connect = () => {
    if (disposed) return;
    if (retryTimer !== undefined) clearTimeout(retryTimer);
    const ws = new WebSocket(wallSocketUrl(apiBaseUrl, target));
    socket = ws;

    ws.onopen = () => {
      if (disposed || socket !== ws) return;
      // The socket beat the early HTTP fallback: the snapshot below covers start-up too.
      clearTimeout(earlyTimer);
      lastHeard = Date.now();
      if (photos) setStatus("live");
      loadSnapshot();
      pingTimer = setInterval(() => {
        // Two missed pongs, or a wake from sleep: the link is gone even if no close arrived.
        if (Date.now() - lastHeard > SILENT_SOCKET_MS) drop();
        else if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, PING_MS);
    };

    ws.onmessage = ({ data }) => {
      if (disposed || socket !== ws) return;
      lastHeard = Date.now();
      // Reset the backoff only once the server actually talks: a socket that opens and drops
      // straight away would otherwise retry every second.
      attempt = 0;
      // Pongs, malformed and unknown events are dropped quietly.
      const event = parseWallEvent(data);
      if (!event) return;
      if (event.type === "wall.access-changed") {
        if (event.permanent) {
          dispose();
          setStatus("offline");
          onAccessRevoked?.();
        } else {
          drop();
          loadSnapshot();
        }
        return;
      }
      if (event.type === "remote.command") onRemote(event.command);
      else if (event.type === "photo.reactions") {
        if (photos) dispatch({ type: "reactions", photoId: event.photoId, counts: event.counts });
      } else if (event.type === "settings.updated") {
        pushedSettings = event.settings;
        dispatch({ type: "settings", settings: event.settings });
      } else if (photos) dispatch({ type: "event", event });
    };

    ws.onclose = handleClose;
    ws.onerror = drop;
  };

  // Back from the background or a sleeping screen: reconnect now and refetch, instead of
  // waiting out a long backoff or a stale socket.
  const appState = AppState.addEventListener("change", (next) => {
    if (next !== "active" || disposed) return;
    if (socket?.readyState === WebSocket.OPEN) {
      if (Date.now() - lastHeard > SILENT_SOCKET_MS) drop();
      else loadSnapshot();
    } else if (!socket) {
      attempt = 0;
      connect();
    }
  });

  // Skip the HTTP snapshot when the socket opens quickly (its onopen fetches one); keep it as
  // the fallback when the socket can't connect at all.
  const earlyTimer = setTimeout(loadSnapshot, EARLY_SNAPSHOT_MS);
  connect();

  const authorizeTimer = target.screenToken ? setInterval(loadSnapshot, 30_000) : undefined;
  function dispose() {
    disposed = true;
    if (authorizeTimer !== undefined) clearInterval(authorizeTimer);
    appState.remove();
    clearTimeout(earlyTimer);
    if (retryTimer !== undefined) clearTimeout(retryTimer);
    if (snapshotTimer !== undefined) clearTimeout(snapshotTimer);
    if (pingTimer !== undefined) clearInterval(pingTimer);
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      socket.close();
    }
  }
  return dispose;
}
