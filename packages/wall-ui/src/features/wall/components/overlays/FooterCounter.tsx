import React, { memo, useEffect, useRef } from "react";
import { type StyleProp, StyleSheet, Text, type TextStyle, View } from "react-native";

import { SIGNAL_ART } from "#features/wall/constants/signalArt";
import { useLateRise } from "#features/wall/hooks/useLateRise";
import { useShots } from "#features/wall/hooks/useShots";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import { useReducedMotion } from "#foundation/motion";
import { signal } from "#foundation/tokens";

import { PopNumber } from "../primitives/PopNumber";
import { PulseSprite } from "../primitives/PulseSprite";

export type FooterCounterProps = {
  /** As the wall words it, like "2 / 13". */
  text: string;
  /** The photo count inside `text`, or null when it doesn't show one (paused). */
  total: number | null;
  style: StyleProp<TextStyle>;
};

const { delayMs, pop, ring, glow, lifeMs } = signal.counter;

/**
 * "n / N" in the bar under the photos. With the signal look the count ticks up once a new
 * photo's light has landed: it pops, with a ring and a glow round it.
 */
export function FooterCounter({ text, total, style }: FooterCounterProps) {
  const signalled = useWallLook().motion === "signal";
  const at = total === null ? -1 : text.lastIndexOf(String(total));
  if (!signalled || total === null || at < 0)
    return (
      <Text style={style} numberOfLines={1}>
        {text}
      </Text>
    );
  const after = at + String(total).length;
  return (
    <SignalCounter
      before={text.slice(0, at)}
      after={text.slice(after)}
      total={total}
      style={style}
    />
  );
}

const SignalCounter = memo(function SignalCounter({
  before,
  after,
  total,
  style,
}: {
  before: string;
  after: string;
  total: number;
  style: StyleProp<TextStyle>;
}) {
  const reduced = useReducedMotion();
  const shown = useLateRise(total, reduced ? 0 : delayMs);
  const [ticks, tick] = useShots<number>(lifeMs);
  const last = useRef(shown);
  useEffect(() => {
    if (shown > last.current) tick(shown);
    last.current = shown;
  }, [shown, tick]);
  const { marginLeft, ...type } = StyleSheet.flatten(style) ?? {};
  return (
    <View style={[styles.row, { marginLeft }]}>
      {before !== "" && <Text style={type}>{before}</Text>}
      <View style={styles.number}>
        <PopNumber value={shown} style={type} peak={pop} />
        {ticks.map(({ key }) => (
          <React.Fragment key={key}>
            <PulseSprite source={SIGNAL_ART.ring} pulse={ring} frame={around(ring.size)} />
            <PulseSprite source={SIGNAL_ART.glowOrange} pulse={glow} frame={around(glow.size)} />
          </React.Fragment>
        ))}
      </View>
      {after !== "" && <Text style={type}>{after}</Text>}
    </View>
  );
});

/** A square of `size` dp centred on the number. */
const around = (size: number) => ({
  height: size,
  left: "50%" as const,
  marginLeft: -size / 2,
  marginTop: -size / 2,
  top: "50%" as const,
  width: size,
});

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row" },
  number: { justifyContent: "center" },
});
