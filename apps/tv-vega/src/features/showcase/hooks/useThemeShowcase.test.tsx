import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useThemeShowcase } from "./useThemeShowcase";

function showcase(demo: boolean) {
  let current!: ReturnType<typeof useThemeShowcase>;
  function Probe() {
    current = useThemeShowcase(demo);
    return null;
  }
  act(() => {
    TestRenderer.create(<Probe />);
  });
  return () => current;
}

it("steps from the theme on screen when the host's phone asks, outside demo mode too", () => {
  const live = showcase(false);
  expect(live().next).toBeUndefined();
  act(() => live().request("party"));
  expect(live()).toMatchObject({ theme: "conference", shown: 1 });
  act(() => live().request("conference"));
  expect(live()).toMatchObject({ theme: "universal", shown: 2 });
});
