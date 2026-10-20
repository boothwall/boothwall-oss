import React from "react";
import { StyleSheet, View } from "react-native";

import { keyGlyph } from "#theme/tokens";

const { back } = keyGlyph;

/** The Back button's arrow: a head pointing left, a stroke out and a half turn back. */
export function BackGlyph({ tint, mini = false }: { tint: string; mini?: boolean }) {
  const shape = mini ? miniShape : fullShape;
  return (
    <View style={shape.box}>
      <View style={[shape.head, { borderColor: tint }]} />
      <View style={[shape.out, { backgroundColor: tint }]} />
      <View style={[shape.turn, { borderColor: tint }]} />
      <View style={[shape.home, { backgroundColor: tint }]} />
    </View>
  );
}

function backShape(box: number) {
  const k = box / back.grid;
  const stroke = back.stroke * k;
  const tipX = back.tipX * k;
  const lineY = back.lineY * k;
  const head = back.head * k;
  const turnX = back.turnX * k;
  const radius = back.radius * k;
  const side = head * Math.SQRT2 + stroke / 2;
  const headX = tipX + head - stroke * (Math.SQRT1_2 / 2);
  return StyleSheet.create({
    box: { height: box, width: box },
    head: {
      borderBottomWidth: stroke,
      borderLeftWidth: stroke,
      height: side,
      left: headX - side / 2,
      position: "absolute",
      top: lineY - side / 2,
      transform: [{ rotate: "45deg" }],
      width: side,
    },
    out: {
      height: stroke,
      left: tipX,
      position: "absolute",
      top: lineY - stroke / 2,
      width: turnX - tipX,
    },
    turn: {
      borderBottomRightRadius: radius + stroke / 2,
      borderBottomWidth: stroke,
      borderRightWidth: stroke,
      borderTopRightRadius: radius + stroke / 2,
      borderTopWidth: stroke,
      height: 2 * radius + stroke,
      left: turnX,
      position: "absolute",
      top: lineY - stroke / 2,
      width: radius + stroke / 2,
    },
    home: {
      height: stroke,
      left: back.endX * k,
      position: "absolute",
      top: lineY + 2 * radius - stroke / 2,
      width: turnX - back.endX * k,
    },
  });
}

const fullShape = backShape(back.box);
const miniShape = backShape(back.miniBox);
