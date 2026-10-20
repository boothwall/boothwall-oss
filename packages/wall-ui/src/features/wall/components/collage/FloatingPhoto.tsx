import type { PhotoDTO } from "@boothwall/shared";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

import { useWallCopy } from "#copy";
import { IMAGE_REVEAL_FALLBACK_MS } from "#features/wall/constants/timing";
import { NATIVE_DRIVER } from "#platform/motion";
import { fontSize, radius, space, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { ArrivalSpark } from "../primitives/ArrivalSpark";
import { TiltedSurface } from "../primitives/TiltedSurface";
import type { FloatingSlotProps } from "./FloatingSlot";
import { PolaroidCard } from "./PolaroidCard";

const FRESH_MS = 6000;
const ENTER_MS = 650;
export const EXIT_MS = 450;
/** How far a card slides on a page turn. */
const SWEEP_DP = 90;
/** Hiding is quick (the copy above already covers it); coming back is a gentle fade. */
const HIDE_MS = 120;
const SHOW_MS = 300;

type FloatingPhotoProps = Omit<FloatingSlotProps, "photo" | "swapDelayMs"> & {
  photo: PhotoDTO;
  exiting: boolean;
  delayMs: number;
  /** Part of a page turn: slide out to the left and in from the right. */
  sweep: boolean;
};

export const FloatingPhoto = memo(function FloatingPhoto({
  photo,
  slot,
  drift,
  zIndex,
  isFresh,
  exiting,
  delayMs,
  sweep,
  hidden,
  onSettled,
}: FloatingPhotoProps) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const enter = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const shown = useRef(new Animated.Value(hidden ? 0 : 1)).current;
  const fresh = useRef(new Animated.Value(isFresh ? 1 : 0)).current;
  const arrivedLive = useRef(isFresh).current;
  // Fixed when the card mounts; the exit direction is decided when it leaves.
  const sweptIn = useRef(sweep).current;
  const sweepOut = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(shown, {
      toValue: hidden ? 0 : 1,
      duration: hidden ? HIDE_MS : SHOW_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [hidden, shown]);

  useEffect(() => {
    if (!exiting) {
      // A fast page return can reuse this card before its outgoing copy unmounts.
      exit.setValue(1);
      return;
    }
    sweepOut.setValue(sweep ? 1 : 0);
    const animation = Animated.timing(exit, {
      toValue: 0,
      duration: EXIT_MS,
      delay: delayMs,
      easing: Easing.in(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [delayMs, exit, exiting, sweep, sweepOut]);

  useEffect(() => {
    if (!isFresh) return;
    const timer = setTimeout(() => {
      Animated.timing(fresh, { toValue: 0, duration: 800, useNativeDriver: NATIVE_DRIVER }).start(
        () => onSettled(photo.id),
      );
    }, FRESH_MS);
    return () => clearTimeout(timer);
  }, [fresh, isFresh, onSettled, photo.id]);

  // A stuck image load must never leave an invisible card.
  const revealed = useRef(false);
  const handleLoad = useCallback(() => {
    if (revealed.current) return;
    revealed.current = true;
    Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      delay: delayMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [delayMs, enter]);
  useEffect(() => {
    const timer = setTimeout(handleLoad, IMAGE_REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [handleLoad]);

  // Built once per card: recreating animated nodes on re-render makes native-driven motion jump.
  const style = useMemo(
    () => ({
      opacity: Animated.multiply(Animated.multiply(enter, exit), shown),
      transform: [
        {
          translateX: Animated.add(
            Animated.add(
              enter.interpolate({ inputRange: [0, 1], outputRange: [sweptIn ? SWEEP_DP : 0, 0] }),
              Animated.multiply(
                exit.interpolate({ inputRange: [0, 1], outputRange: [-SWEEP_DP, 0] }),
                sweepOut,
              ),
            ),
            slot.x,
          ),
        },
        {
          translateY: slot.y,
        },
        // A fixed tilt: animating rotation made every card re-rasterise each frame.
        { rotate: `${slot.rotate}deg` },
        {
          scale: Animated.multiply(
            enter.interpolate({ inputRange: [0, 1], outputRange: [arrivedLive ? 1.35 : 0.9, 1] }),
            exit.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          ),
        },
      ],
    }),
    [arrivedLive, enter, exit, shown, slot, sweepOut, sweptIn],
  );

  return (
    <TiltedSurface style={[styles.root, style, { zIndex }]} drift={drift} testID="wall-card">
      <PolaroidCard photo={photo} width={slot.width} onImageLoad={handleLoad} />
      {arrivedLive && <ArrivalSpark delayMs={ENTER_MS / 2} />}
      {isFresh && (
        <Animated.View style={[styles.badge, tint.badge, { opacity: fresh }]}>
          <Text style={[styles.badgeText, tint.badgeText]}>{wallCopy.newBadge}</Text>
        </Animated.View>
      )}
    </TiltedSurface>
  );
});

const styles = StyleSheet.create({
  root: {
    left: 0,
    position: "absolute",
    top: 0,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    position: "absolute",
    right: -space.sm,
    top: -space.sm,
  },
  badgeText: {
    fontSize: fontSize.caption,
    fontWeight: "900",
    letterSpacing: tracking.label,
  },
});

/** The "New" badge's accent fill and its label. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    badge: { backgroundColor: colors.brandPrimary },
    badgeText: { color: colors.onBrandPrimary },
  }),
);
