import type { PhotoDTO } from "@boothwall/shared";
import { usePhotoCallState } from "@boothwall/wall-ui";
import { useEffect } from "react";
import { BackHandler } from "react-native";

/** Long-press OK starts or ends a call and the host's phone can start one; Back ends it or its finale. */
export function usePhotoCall(photos: readonly PhotoDTO[]) {
  const photoCall = usePhotoCallState(photos);
  const { close } = photoCall;
  const open = photoCall.call !== null;
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [close, open]);

  return photoCall;
}
