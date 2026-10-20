import { useRemoteHintState } from "@boothwall/wall-ui";
import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * The remote help card, on request only (Menu outside demo mode, or the Control panel), so the
 * wall opens clean. It closes by itself after REMOTE_HINT_MS, or on any key; Back is caught
 * here, the other keys through the wall input routing.
 */
export function useRemoteHint() {
  const hint = useRemoteHintState();
  const { open, hide } = hint;
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      hide();
      return true;
    });
    return () => subscription.remove();
  }, [hide, open]);

  return hint;
}
