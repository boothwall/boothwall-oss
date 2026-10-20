import { withAlpha } from "@boothwall/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  type KeyGlyphName,
  remoteHintCopy,
} from "#features/remote-hint/constants/remoteHint.constants";
import { color, fontWeight, radius, remoteHint } from "#theme/tokens";

import { ArrowGlyph } from "./ArrowGlyph";
import { BackGlyph } from "./BackGlyph";
import { MenuGlyph } from "./MenuGlyph";
import { PlayPauseGlyph } from "./PlayPauseGlyph";

/** A remote button, drawn as a key cap in the theme's accent; `mini` sits inside a line of text. */
export function KeyCap({
  glyph,
  tint,
  mini = false,
}: {
  glyph: KeyGlyphName;
  tint: string;
  mini?: boolean;
}) {
  return (
    <View style={[styles.cap, mini ? styles.mini : styles.full]}>
      <Glyph glyph={glyph} tint={tint} mini={mini} />
    </View>
  );
}

function Glyph({ glyph, tint, mini }: { glyph: KeyGlyphName; tint: string; mini: boolean }) {
  switch (glyph) {
    case "ok":
      return <Text style={[styles.ok, { color: tint }]}>{remoteHintCopy.ok}</Text>;
    case "left":
    case "right":
      return <ArrowGlyph tint={tint} direction={glyph} />;
    case "playPause":
      return <PlayPauseGlyph tint={tint} />;
    case "menu":
      return <MenuGlyph tint={tint} mini={mini} />;
    case "back":
      return <BackGlyph tint={tint} mini={mini} />;
  }
}

const styles = StyleSheet.create({
  cap: {
    alignItems: "center",
    backgroundColor: withAlpha(color.paper, remoteHint.keyFillOpacity),
    borderColor: color.border,
    borderRadius: radius.control,
    borderWidth: 1,
    justifyContent: "center",
  },
  full: {
    height: remoteHint.key.height,
    minWidth: remoteHint.key.minWidth,
    paddingHorizontal: remoteHint.key.padX,
  },
  mini: {
    height: remoteHint.miniKey.height,
    minWidth: remoteHint.miniKey.minWidth,
    paddingHorizontal: remoteHint.miniKey.padX,
  },
  ok: { fontSize: remoteHint.label, fontWeight: fontWeight.heavy },
});
