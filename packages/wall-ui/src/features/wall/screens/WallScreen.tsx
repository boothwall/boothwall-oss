import React, { useMemo } from "react";

import { WallCopyProvider } from "#copy";
import { defaultWallConnection, WallConnectionContext } from "#platform/connection";

import { ThemeOverrideContext } from "../state/themeOverrideContext";
import { WallLookContext } from "../state/wallLookContext";
import { ConnectedWallScreen } from "./ConnectedWallScreen";
import type { WallScreenProps } from "./wall-screen.types";
export type { WallScreenProps } from "./wall-screen.types";

export function WallScreen(props: WallScreenProps) {
  const resolved = useMemo(
    () => props.connection ?? defaultWallConnection(props.wall),
    [props.connection, props.wall],
  );
  const key = JSON.stringify([
    resolved.apiBaseUrl,
    resolved.target.wallId,
    resolved.target.screenToken,
    resolved.storageNamespace,
    props.demo,
  ]);
  const screen = (
    <WallConnectionContext.Provider value={resolved}>
      <ThemeOverrideContext.Provider value={props.theme}>
        <ConnectedWallScreen
          key={key}
          {...props}
          demo={props.demo ?? (props.connection ? false : undefined)}
          resolved={resolved}
        />
      </ThemeOverrideContext.Provider>
    </WallConnectionContext.Provider>
  );
  const looked = props.look ? (
    <WallLookContext.Provider value={props.look}>{screen}</WallLookContext.Provider>
  ) : (
    screen
  );
  return props.copy ? <WallCopyProvider copy={props.copy}>{looked}</WallCopyProvider> : looked;
}
