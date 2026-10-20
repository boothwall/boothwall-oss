import type { PhotoDTO } from "@boothwall/shared";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

import {
  CARD_REACH,
  type SlotDrift,
  type SlotPosition,
  STAGE,
} from "#features/wall/constants/layout";
import { IMAGE_REVEAL_FALLBACK_MS } from "#features/wall/constants/timing";
import { cardEnvelope, LIFTED_REACH, shiftInside } from "#features/wall/utils/cardEnvelope";
import { metaLineExtent } from "#features/wall/utils/polaroidGeometry";
import { NATIVE_DRIVER } from "#platform/motion";
import { useReducedMotion } from "#platform/motion";
import { layer, size, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { outsideCard, TiltedSurface } from "../primitives/TiltedSurface";
import { PolaroidCard } from "./PolaroidCard";

export const LIFT_MS = 420;
const SETTLE_MS = 260;

/**
 * The nudge that keeps the lifted card, ring and lean included, on the stage: clear of the
 * header gap, the safe area, the panel and the footer.
 */
function keepOnStage(slot: SlotPosition) {
  return shiftInside(cardEnvelope(slot, LIFTED_REACH), STAGE);
}

export const LiftedCard = memo(function LiftedCard({
  photo,
  slot,
  drift,
  active,
  handedOff,
  onLifted,
}: {
  photo: PhotoDTO;
  slot: SlotPosition;
  drift: SlotDrift | undefined;
  active: boolean;
  handedOff: boolean;
  onLifted: (photoId: string) => void;
}) {
  const tint = useThemedStyles(themed);
  const lift = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const handleLoad = useCallback(() => setLoaded(true), []);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), IMAGE_REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (active && !loaded) return; // wait for the image so the copy never shows an empty frame
    if (!active && handedOff) {
      lift.setValue(0);
      return;
    }
    if (active) onLifted(photo.id);
    Animated.timing(lift, {
      toValue: active ? 1 : 0,
      // With reduced motion the card is simply lifted or not, without the swing.
      duration: reduced ? 0 : active ? LIFT_MS : SETTLE_MS,
      easing: active ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [active, handedOff, lift, loaded, onLifted, photo.id, reduced]);

  const style = useMemo(() => {
    const shift = keepOnStage(slot);
    return {
      // Opaque from the first frame: it covers its identical original (which only hides once
      // this is drawn), so nothing flickers.
      opacity: lift.interpolate({
        inputRange: [0, 0.04],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
      transform: [
        {
          translateX: Animated.add(
            lift.interpolate({ inputRange: [0, 1], outputRange: [0, shift.x] }),
            slot.x,
          ),
        },
        {
          // The shared slot drift is applied by a separate outer view.
          translateY: Animated.add(
            lift.interpolate({ inputRange: [0, 1], outputRange: [0, shift.y] }),
            slot.y,
          ),
        },
        {
          rotate: lift.interpolate({
            inputRange: [0, 1],
            outputRange: [`${slot.rotate}deg`, "0deg"],
          }),
        },
        { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, CARD_REACH.liftScale] }) },
      ],
    };
  }, [lift, slot]);
  // The ring arrives with the lift and wraps the category line the card grows below its caption.
  const ring = useMemo(
    () => ({
      bottom: RING - metaLineExtent(slot.width),
      opacity: lift.interpolate({
        inputRange: [0, 0.5],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    }),
    [lift, slot.width],
  );

  return (
    <TiltedSurface style={[styles.root, style]} drift={drift} pointerEvents="none">
      {active && <Animated.View style={[styles.ring, tint.ring, ring]} testID="wall-card-ring" />}
      {/* The same width as the wall card, so the same, already decoded, image. */}
      <PolaroidCard photo={photo} width={slot.width} onImageLoad={handleLoad} lift={lift} />
    </TiltedSurface>
  );
});

const RING = outsideCard(CARD_REACH.ringOutset);

const styles = StyleSheet.create({
  root: {
    left: 0,
    position: "absolute",
    top: 0,
    zIndex: layer.selectedCard,
  },
  // A flat accent ring: a blurred glow here cost a shadow pass per frame.
  ring: {
    borderRadius: space.sm,
    borderWidth: size.focusRing,
    left: RING,
    position: "absolute",
    right: RING,
    top: RING,
  },
});

/** The selection ring in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    ring: { borderColor: colors.brandPrimary },
  }),
);
