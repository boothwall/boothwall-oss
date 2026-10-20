import {
  type BoothwallConfig,
  boothwallConfig,
  DEFAULT_SETTINGS,
  type PhotoDTO,
} from "@boothwall/shared";
import {
  type FeedStatus,
  missionFor,
  PhotoCallFinale,
  PhotoCallOverlay,
  SignalCallBurst,
  WallErrorBoundary,
  WallScreen,
} from "@boothwall/wall-ui";
import { resolveWallColors } from "@boothwall/wall-ui/tokens";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useKeepAwake } from "@/features/keep-awake";
import { useWallMediaControls } from "@/features/media-controls";
import { usePhotoCall } from "@/features/photo-call";
import { RemoteHintCard, useRemoteHint } from "@/features/remote-hint";
import { ThemeShowcaseLabel, useThemeShowcase } from "@/features/showcase";
import {
  onWallPausedChange,
  useWallRemoteInput,
  WallInputContext,
  wallRouting,
} from "@/features/wall-input";
import { reportFullyDrawnOnce } from "@/platform/performance";
import { deviceStore } from "@/platform/storage/deviceStore";

const { categories, demo, urls, wall } = boothwallConfig as BoothwallConfig;
const JOIN_URL = `${urls.web}/snap`;
const BRAND_PALETTE = DEFAULT_SETTINGS.presentation?.theme;

/** The build's one wall, from `tv` in boothwall.config.ts; change it by editing the config and rebuilding. */
export const App = () => {
  const [photos, setPhotos] = useState<readonly PhotoDTO[]>([]);
  const showcase = useThemeShowcase(demo);
  const photoCall = usePhotoCall(photos);
  const { call } = photoCall;
  const callOpen = call !== null;
  const hint = useRemoteHint();
  const { show: showHint, hide: hideHint } = hint;
  const [paused, setPaused] = useState(false);
  const routing = useMemo(
    () =>
      wallRouting({
        demo,
        callOpen,
        toggleCall: photoCall.toggle,
        hintOpen: hint.open,
        showHint,
        hideHint,
        nextTheme: showcase.next,
      }),
    [callOpen, photoCall.toggle, hint.open, showHint, hideHint, showcase.next],
  );
  useEffect(() => {
    if (callOpen) hideHint();
  }, [callOpen, hideHint]);
  const onPausedChange = useCallback((now: boolean) => {
    onWallPausedChange(now);
    setPaused(now);
  }, []);
  const onStatusChange = useCallback((status: FeedStatus) => reportFullyDrawnOnce(status), []);
  useKeepAwake(useWallMediaControls());
  const theme = showcase.theme ?? DEFAULT_SETTINGS.theme;
  // Another theme picked live shows its own colours, not the event's.
  const palette = theme === DEFAULT_SETTINGS.theme ? BRAND_PALETTE : undefined;
  const colors = useMemo(() => resolveWallColors(theme, palette), [theme, palette]);

  return (
    <WallErrorBoundary>
      <View style={styles.screen}>
        <WallInputContext.Provider value={routing}>
          <WallScreen
            store={deviceStore}
            theme={showcase.theme}
            look={wall}
            hostBack={routing.captured}
            useRemoteInput={useWallRemoteInput}
            onPausedChange={onPausedChange}
            onPhotosChange={setPhotos}
            onPhotoCallRequest={photoCall.start}
            onHintsRequest={callOpen ? undefined : showHint}
            onThemeRequest={showcase.request}
            onStatusChange={onStatusChange}
          />
        </WallInputContext.Provider>
        {hint.open && (
          <RemoteHintCard
            key={hint.opened}
            demo={demo}
            paused={paused}
            colors={colors}
            onClose={hideHint}
          />
        )}
        <ThemeShowcaseLabel theme={showcase.theme} shown={showcase.shown} menu={demo} />
        {call?.finale && (
          <PhotoCallFinale finale={call.finale} colors={colors} onEnd={photoCall.close} />
        )}
        {call && !call.finale && (
          <PhotoCallOverlay
            endsAt={call.endsAt}
            mission={missionFor(categories, call.index)}
            newPhotos={photoCall.newPhotos}
            joinUrl={JOIN_URL}
            colors={colors}
            onEnd={photoCall.finish}
          />
        )}
        {call && !call.finale && wall?.motion === "signal" && <SignalCallBurst key={call.endsAt} />}
      </View>
    </WallErrorBoundary>
  );
};

const styles = StyleSheet.create({ screen: { flex: 1 } });
