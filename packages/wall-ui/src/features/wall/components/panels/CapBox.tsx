import React, { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";

export type CapBoxProps = {
  /** The title's cap height. */
  height: number;
  onWidth: (width: number) => void;
  children: ReactNode;
};

/**
 * Sets an image or a pill on a title's caps: the box is the caps' height and, holding nothing
 * in flow, its bottom is its baseline, so on a baseline row it spans exactly the caps. Its
 * content is centred on it and may overhang.
 */
export function CapBox({ height, onWidth, children }: CapBoxProps) {
  const [width, setWidth] = useState(0);
  return (
    <View style={{ height, width }}>
      <View
        style={styles.content}
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
          onWidth(event.nativeEvent.layout.width);
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 0,
  },
});
