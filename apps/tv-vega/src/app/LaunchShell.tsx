import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { launchShell } from "@/theme/tokens";

import { App } from "./App";

/**
 * Draws one plain frame before the wall. The wall's modules (the shared config and its schemas,
 * wall-ui) load on its first render, so the Stick shows this frame first and builds the wall in
 * the next task instead of holding the launch on all of it.
 */
export const LaunchShell = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? <App /> : <View style={styles.shell} />;
};

const styles = StyleSheet.create({ shell: { flex: 1, backgroundColor: launchShell.background } });
