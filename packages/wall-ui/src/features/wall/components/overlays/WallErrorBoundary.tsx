import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { RESTART_AFTER_MS } from "#features/wall/constants/timing";
import { color, fontSize, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

type Props = { children: ReactNode };
type State = { crashed: boolean; generation: number };

/**
 * An unattended booth screen must never sit on a red box or a blank frame: a render error
 * shows a calm "restarting" card, then remounts the whole tree from scratch.
 */
export class WallErrorBoundary extends Component<Props, State> {
  override state: State = { crashed: false, generation: 0 };
  private timer: ReturnType<typeof setTimeout> | undefined;

  static getDerivedStateFromError(): Partial<State> {
    return { crashed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Wall crashed, restarting", error, info.componentStack);
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      // A new key throws away every piece of state that led to the crash.
      this.setState(({ generation }) => ({ crashed: false, generation: generation + 1 }));
    }, RESTART_AFTER_MS);
  }

  override componentWillUnmount() {
    if (this.timer !== undefined) clearTimeout(this.timer);
  }

  override render() {
    const { crashed, generation } = this.state;
    if (crashed) {
      return <RestartingCard />;
    }
    return <React.Fragment key={generation}>{this.props.children}</React.Fragment>;
  }
}

/** The "restarting" card; a function component so it can read the theme. */
function RestartingCard() {
  const { wall: wallCopy } = useWallCopy();
  // Mounted outside WallScreen, so always the universal theme.
  const tint = useThemedStyles(themed);
  return (
    <View style={[styles.screen, tint.screen]} testID="wall-restarting">
      <Text style={styles.title}>{wallCopy.restarting.title}</Text>
      <Text style={styles.body}>{wallCopy.restarting.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    flex: 1,
    gap: space.sm,
    justifyContent: "center",
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: "800",
  },
  body: {
    color: color.textSecondary,
    fontSize: fontSize.body,
  },
});

/** The theme's canvas behind the card. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    screen: { backgroundColor: colors.canvas },
  }),
);
