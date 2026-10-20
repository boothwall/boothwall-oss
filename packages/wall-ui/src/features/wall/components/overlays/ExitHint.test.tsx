import React, { type ReactElement } from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { defaultWallCopy, WallCopyProvider } from "#copy";

import { ExitHint } from "./ExitHint";

function text(element: ReactElement) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  const json = JSON.stringify(renderer.toJSON());
  act(() => renderer.unmount());
  return json;
}

it("says today's English without a provider", () => {
  const shown = text(<ExitHint visible />);
  for (const words of ["Press ", "Back", " again to exit"]) expect(shown).toContain(words);
});

it("says the provided words instead", () => {
  const exitHint = { before: "Drücke ", key: "Zurück", after: " erneut zum Beenden" };
  const shown = text(
    <WallCopyProvider copy={{ ...defaultWallCopy, wall: { ...defaultWallCopy.wall, exitHint } }}>
      <ExitHint visible />
    </WallCopyProvider>,
  );
  for (const words of ["Drücke ", "Zurück", " erneut zum Beenden"]) expect(shown).toContain(words);
  expect(shown).not.toContain(" again to exit");
});
