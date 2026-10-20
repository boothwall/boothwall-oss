import { DEFAULT_SETTINGS, type WallTheme } from "@boothwall/shared";
import { nextTheme } from "@boothwall/wall-ui";
import { useCallback, useState } from "react";

/**
 * Steps the wall through every theme until the app restarts: Menu does in demo mode, and the
 * host's phone ("Next theme" in Control) does in any mode. `shown` counts the steps.
 */
export function useThemeShowcase(demo: boolean) {
  const [state, setState] = useState<{ theme?: WallTheme; shown: number }>({ shown: 0 });
  const next = useCallback(
    () =>
      setState(({ theme, shown }) => ({
        theme: nextTheme(theme ?? DEFAULT_SETTINGS.theme),
        shown: shown + 1,
      })),
    [],
  );
  const request = useCallback(
    (onScreen: WallTheme) =>
      setState(({ shown }) => ({ theme: nextTheme(onScreen), shown: shown + 1 })),
    [],
  );
  return { ...state, next: demo ? next : undefined, request };
}
