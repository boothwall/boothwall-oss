import type { RemoteMessage, WallConnection, WallSnapshotDTO, WallTarget } from "@boothwall/shared";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { appConfig } from "#app/config";
import { type CachedWall, useWallCache } from "#features/offline";
import type { KeyValueStore } from "#platform/storage";

import { connectLive } from "../data/connectLive";
import { DEMO_PHOTO_COUNT } from "../data/demoPhotos";
import { simulatedSnapshot, startSimulatedEvents } from "../data/simulatedFeed";
import { connectionPhase, type FeedStatus, isShowingStale } from "../state/connectionPhase";
import { initialWallState, wallReducer } from "../state/wallState";
import type { WallDisplaySource } from "../types";

type WallFeedOptions = {
  onRemote: (command: RemoteMessage) => void;
  /** Which wall to show. */
  target: WallTarget;
  displayConnection?: WallConnection;
  onAccessRevoked?: () => void;
  source?: WallDisplaySource;
  /** Where the last live wall is kept for offline starts; none means no cache. */
  store?: KeyValueStore;
  /** Forces demo mode on or off; defaults to boothwall.config.ts. */
  demo?: boolean;
};

export function useWallFeed({
  onRemote,
  target,
  store,
  demo,
  displayConnection,
  onAccessRevoked,
  source,
}: WallFeedOptions) {
  const [state, dispatch] = useReducer(wallReducer, {
    ...initialWallState,
    settings: displayConnection?.initialSettings ?? initialWallState.settings,
  });
  const simulation = useMemo(
    () => ({ ...appConfig.simulation, enabled: demo ?? appConfig.simulation.enabled }),
    [demo],
  );
  const [status, setStatus] = useState<FeedStatus>(simulation.enabled ? "simulated" : "connecting");
  // Something is on the wall (live or saved), and whether any of it came from the API yet.
  const [revoked, setRevoked] = useState(false);
  const initialSettings = useRef(displayConnection?.initialSettings ?? initialWallState.settings);
  const [loaded, setLoaded] = useState(false);
  const [liveLoaded, setLiveLoaded] = useState(false);
  const [attempts, setAttempts] = useState(0);
  // Latest handler without reconnecting the socket when it changes.
  const remoteRef = useRef(onRemote);
  remoteRef.current = onRemote;

  const { wallId, screenToken } = target;
  const apiBaseUrl = displayConnection?.apiBaseUrl ?? appConfig.apiBaseUrl;
  const revokedRef = useRef(onAccessRevoked);
  revokedRef.current = onAccessRevoked;
  useEffect(() => {
    if (source) {
      let active = true;
      const revoke = () => {
        if (!active) return;
        setRevoked(true);
        setStatus("offline");
        revokedRef.current?.();
      };
      setRevoked(false);
      const stop = source.connect({
        snapshot: (snapshot) => {
          if (!active) return;
          dispatch({ type: "snapshot", snapshot });
          setLoaded(true);
          setLiveLoaded(true);
        },
        event: (event) => {
          if (!active) return;
          if (event.type === "remote.command") remoteRef.current(event.command);
          else if (event.type === "wall.access-changed") revoke();
          else if (event.type === "settings.updated")
            dispatch({ type: "settings", settings: event.settings });
          else if (event.type === "photo.reactions")
            dispatch({ type: "reactions", photoId: event.photoId, counts: event.counts });
          else dispatch({ type: "event", event });
        },
        status: (next) => {
          if (active) setStatus(next);
        },
        failure: () => {
          if (active) setAttempts((n) => n + 1);
        },
        revoked: revoke,
      });
      return () => {
        active = false;
        stop();
      };
    }
    const disconnect = connectLive({
      target: { wallId, screenToken },
      apiBaseUrl,
      onAccessRevoked: () => {
        setRevoked(true);
        revokedRef.current?.();
      },
      photos: !simulation.enabled,
      dispatch,
      setStatus,
      onLoaded: () => {
        setLoaded(true);
        setLiveLoaded(true);
      },
      onFailure: () => setAttempts((n) => n + 1),
      onRemote: (command) => remoteRef.current(command),
    });
    if (!simulation.enabled) return disconnect;

    const snapshot = { ...simulatedSnapshot(DEMO_PHOTO_COUNT), settings: initialSettings.current };
    dispatch({ type: "snapshot", snapshot });
    const stopSimulation = startSimulatedEvents(
      snapshot.photos,
      simulation.newPhotoEveryMs,
      (event) => dispatch({ type: "event", event }),
    );
    return () => {
      stopSimulation();
      disconnect();
    };
  }, [simulation, wallId, screenToken, apiBaseUrl, source]);

  const live = useMemo<WallSnapshotDTO | null>(
    () =>
      liveLoaded && !simulation.enabled
        ? { photos: state.pool, stats: state.stats, settings: state.settings }
        : null,
    [liveLoaded, simulation.enabled, state.pool, state.stats, state.settings],
  );
  const restore = useCallback(({ snapshot }: CachedWall) => {
    dispatch({ type: "snapshot", snapshot });
    setLoaded(true);
  }, []);
  useWallCache({
    store: simulation.enabled || revoked ? undefined : store,
    wallId:
      displayConnection?.storageNamespace ??
      JSON.stringify([apiBaseUrl.replace(/\/+$/, ""), wallId]),
    live,
    onRestore: restore,
  });

  const settle = useCallback((photoId: string) => dispatch({ type: "settled", photoId }), []);
  const turnPage = useCallback((slots: (string | null)[]) => dispatch({ type: "page", slots }), []);
  const pin = useCallback((ids: string[]) => dispatch({ type: "pin", ids }), []);

  const connection = {
    phase: connectionPhase(status, loaded),
    attempts,
    stale: isShowingStale(status, loaded, liveLoaded),
  };

  return { state, status, connection, settle, turnPage, pin, revoked };
}
