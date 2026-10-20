import { DEFAULT_SETTINGS, type WallConnection, type WallTheme } from "@boothwall/shared";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Text } from "react-native";

import { AmbientBackdrop } from "#components/backdrop";
import { useWallCopy } from "#copy";
import { PICK_TIMING, PickBadge, usePickMoments } from "#features/picks";
import { ReactionLayer } from "#features/reactions";

import { WallCollage } from "../components/collage/WallCollage";
import { ThemeDecor } from "../components/decor/ThemeDecor";
import { ConnectingOverlay } from "../components/overlays/ConnectingOverlay";
import { EventOverScreen } from "../components/overlays/EventOverScreen";
import { ExitHint } from "../components/overlays/ExitHint";
import { HostOverlay } from "../components/overlays/HostOverlay";
import { IncomingToast } from "../components/overlays/IncomingToast";
import { NowShowingBar } from "../components/overlays/NowShowingBar";
import { PageTurnBanner } from "../components/overlays/PageTurnBanner";
import { Spotlight } from "../components/overlays/Spotlight";
import { JoinPanel } from "../components/panels/JoinPanel";
import { TopBar } from "../components/panels/TopBar";
import { SelectCatcher } from "../components/primitives/SelectCatcher";
import { WallPresentationCanvas } from "../components/shell";
import { CENTRE_SLOT } from "../constants/layout";
import { useRemoteRelay } from "../hooks/useRemoteRelay";
import { useSlotDrift } from "../hooks/useSlotDrift";
import { type RemoteCommands, STILL_REMOTE, useWallDirector } from "../hooks/useWallDirector";
import { useWallFeed } from "../hooks/useWallFeed";
import { useWallRemote } from "../hooks/useWallRemote";
import { useWallReports } from "../hooks/useWallReports";
import { SLOT_POSITIONS } from "../utils/collageLayout";
import { reactionTargets } from "../utils/reactionTargets";
import type { WallScreenProps } from "./wall-screen.types";

export function ConnectedWallScreen({
  useRemoteInput,
  demo,
  resolved,
  onAccessRevoked,
  store,
  onStatusChange,
  source,
  ...reports
}: WallScreenProps & { resolved: WallConnection }) {
  const { offline: offlineCopy, picks: picksCopy, wall: wallWords } = useWallCopy();
  // The phone remote arrives over the feed socket, before the director exists.
  const commandsRef = useRef<RemoteCommands | null>(null);
  const shownTheme = useRef<WallTheme>(DEFAULT_SETTINGS.theme);
  const onRemote = useRemoteRelay(commandsRef, reports, shownTheme);
  const feed = useWallFeed({
    onRemote,
    target: resolved.target,
    displayConnection: resolved,
    onAccessRevoked,
    store,
    demo,
    source,
  });
  const { revoked, state: wall, status, connection, settle, turnPage, pin } = feed;
  const { settings } = wall;
  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);
  const ended = settings.eventEnded;
  const notice = connection.stale && status === "offline" ? offlineCopy.notice : undefined;
  // A pick waits while the wall is busy; the director's state is read when one is due.
  const busyRef = useRef(false);
  const isBusy = useCallback(() => busyRef.current, []);
  const { pick, dismiss: dismissPick } = usePickMoments({
    pool: wall.pool,
    enabled: settings.showPicks && !ended,
    isBusy,
  });
  const director = useWallDirector({
    wall,
    turnPage,
    pin,
    selectEveryMs: settings.secondsPerPhoto * 1000,
    autoOpen: settings.autoOpen,
    held: pick !== null || ended,
    paused: reports.paused,
  });
  const { selectedSlot, selectedPhoto, filledSlots, spotlight, commands } = director;
  useEffect(() => {
    busyRef.current = spotlight || director.paused || director.nextUpPhoto !== null;
    if (director.paused) dismissPick();
  }, [director.nextUpPhoto, director.paused, dismissPick, spotlight]);

  // While a pick is up, OK and Back close it. Once the event is over the wall holds still, so
  // the remote only keeps Back (to leave the app).
  const remote = useMemo<RemoteCommands>(() => {
    if (ended) return { ...STILL_REMOTE, back: commands.back };
    return pick ? { ...commands, select: dismissPick, back: dismissPick } : commands;
  }, [commands, dismissPick, ended, pick]);
  useEffect(() => {
    commandsRef.current = remote;
    shownTheme.current = reports.theme ?? settings.theme;
  });
  const { exitArmed } = useWallRemote(
    remote,
    spotlight || pick !== null,
    useRemoteInput,
    reports.hostBack,
  );

  // The collage reflows with the number of photos: a sparse wall gets big, centred cards.
  const positions = SLOT_POSITIONS;
  const drifts = useSlotDrift(positions.length);
  const slot = positions[selectedSlot];
  const drift = drifts[selectedSlot];
  const placed = useMemo(
    () => (selectedPhoto && slot ? { photo: selectedPhoto, slot, drift } : null),
    [drift, selectedPhoto, slot],
  );
  // A pick opens from its card when it's on this page, from the middle of the screen if not.
  const pickSlotIndex = pick ? wall.slots.indexOf(pick.photo.id) : -1;
  const picked = useMemo(
    () =>
      pick
        ? {
            photo: pick.photo,
            slot: positions[pickSlotIndex] ?? CENTRE_SLOT,
            drift: drifts[pickSlotIndex],
          }
        : null,
    [drifts, pick, pickSlotIndex, positions],
  );
  const open = picked ?? (spotlight ? placed : null);
  useWallReports(reports, director.paused, open !== null, wall);
  // The slot whose photo is drawn elsewhere (lifted, or open in the spotlight): its card hides.
  const hiddenSlot = picked
    ? pickSlotIndex >= 0
      ? pickSlotIndex
      : null
    : open || placed
      ? selectedSlot
      : null;
  const floatTargets = useMemo(
    () => reactionTargets(wall.pool, wall.slots, positions, open?.photo ?? null),
    [wall.pool, wall.slots, positions, open],
  );

  if (revoked)
    return (
      <WallPresentationCanvas settings={settings} palette={resolved.presentation?.theme}>
        <Text>{wallWords.accessChanged}</Text>
      </WallPresentationCanvas>
    );

  return (
    <WallPresentationCanvas settings={settings} palette={resolved.presentation?.theme}>
      <AmbientBackdrop>
        <ThemeDecor beat={director.cycleKey} paused={director.paused} />
      </AmbientBackdrop>
      <SelectCatcher onSelect={commands.select} />
      <WallCollage
        wall={wall}
        positions={positions}
        drifts={drifts}
        selection={open ? null : placed}
        hiddenSlot={hiddenSlot}
        spotlightOpen={open !== null}
        onSettled={settle}
      />
      <PageTurnBanner turn={wall.turn} page={director.page} pages={director.pages} />
      <TopBar total={wall.stats.total} status={status} ended={ended} notice={notice} />
      {!ended && (
        <NowShowingBar
          photo={selectedPhoto}
          position={director.position}
          total={director.total}
          durationMs={director.durationMs}
          cycleKey={director.cycleKey}
          paused={director.paused}
          opensNext={director.opensNext}
        />
      )}
      {/* Once the event is over, the upload QR would compete with the recap's. */}
      {!ended && (
        <JoinPanel stats={wall.stats} pool={wall.pool} attention={filledSlots.length === 0} />
      )}
      <Spotlight
        selection={open}
        badge={pick && <PickBadge pick={pick} />}
        nextLabel={pick ? picksCopy.backToWall : undefined}
        position={pick ? null : director.position}
        total={director.total}
        durationMs={pick ? PICK_TIMING.showMs : director.durationMs}
        cycleKey={pick ? `pick-${pick.photo.id}` : director.cycleKey}
        paused={pick ? false : director.paused}
      />
      <ReactionLayer targets={floatTargets} />
      {ended && <EventOverScreen total={wall.stats.total} />}
      <IncomingToast photo={director.nextUpPhoto} spotlightOpen={open !== null} />
      <ConnectingOverlay phase={connection.phase} attempts={connection.attempts} />
      <ExitHint visible={exitArmed} />
      {reports.overlay && <HostOverlay>{reports.overlay}</HostOverlay>}
    </WallPresentationCanvas>
  );
}
