import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * The system's "reduce motion" setting. Vega answers the query but sends no change events, so
 * a change there shows on the next launch; browsers report changes live.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => active && setReduced(value))
      .catch(() => undefined);
    // react-native-web returns no subscription where the browser has no matchMedia.
    const subscription: { remove: () => void } | undefined = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);
  return reduced;
}
