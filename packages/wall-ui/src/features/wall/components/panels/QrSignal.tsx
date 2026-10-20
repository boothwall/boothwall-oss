import React, { memo, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { SIGNAL_ART } from "#features/wall/constants/signalArt";
import { useShots } from "#features/wall/hooks/useShots";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import { useReducedMotion } from "#foundation/motion";
import { radius, signal } from "#foundation/tokens";

import { PulseSprite } from "../primitives/PulseSprite";
import { SweepBand } from "../primitives/SweepBand";

const { everyMs, sheen, pingInset, arrivalPing, shimmerPings, lifeMs } = signal.qr;

/**
 * The join card's signal: now and then a faint blue sheen crosses it and its outline pings out,
 * and a new photo pings it once as its light leaves. Drawn inside the card, over its content.
 */
export function QrSignal({ total }: { total: number }) {
  const reduced = useReducedMotion();
  return useWallLook().motion === "signal" && !reduced ? <QrSignalLayer total={total} /> : null;
}

const QrSignalLayer = memo(function QrSignalLayer({ total }: { total: number }) {
  const [pings, ping] = useShots<number>(lifeMs);
  const [shimmers, shimmer] = useShots<number>(lifeMs);
  const last = useRef(total);
  useEffect(() => {
    if (total > last.current) ping(total);
    last.current = total;
  }, [ping, total]);
  useEffect(() => {
    const timer = setInterval(() => shimmer(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [shimmer]);
  return (
    <>
      <View style={styles.clip} pointerEvents="none">
        {shimmers.map(({ key }) => (
          <SweepBand key={key} source={SIGNAL_ART.sheenBlue} sweep={sheen} />
        ))}
      </View>
      {pings.map(({ key }) => (
        <PulseSprite
          key={key}
          source={SIGNAL_ART.cardPing}
          pulse={arrivalPing}
          frame={styles.ping}
        />
      ))}
      {shimmers.map(({ key }) =>
        shimmerPings.map((pulse) => (
          <PulseSprite
            key={`${key}-${pulse.delayMs}`}
            source={SIGNAL_ART.cardPing}
            pulse={pulse}
            frame={styles.ping}
          />
        )),
      )}
    </>
  );
});

const styles = StyleSheet.create({
  clip: { ...StyleSheet.absoluteFillObject, borderRadius: radius.card, overflow: "hidden" },
  // The ping image's outline sits on the card's edge at scale 1.
  ping: { bottom: -pingInset, left: -pingInset, right: -pingInset, top: -pingInset },
});
