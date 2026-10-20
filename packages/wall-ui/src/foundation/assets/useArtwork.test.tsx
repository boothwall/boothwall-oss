import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { useArtwork } from "./useArtwork";

it("falls back on failure, retries a replacement URL and distinguishes hiding from reset", () => {
  const fallback = { uri: "bundled" };
  let current!: ReturnType<typeof useArtwork>;
  function Probe({ url }: { url?: string | null }) {
    current = useArtwork(url, fallback);
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe url="https://images.example/a" />);
  });
  expect(current.source).toEqual({ uri: "https://images.example/a" });
  act(() => current.onError());
  expect(current.source).toBe(fallback);
  act(() => renderer.update(<Probe url="https://images.example/b" />));
  expect(current.source).toEqual({ uri: "https://images.example/b" });
  act(() => renderer.update(<Probe url={null} />));
  expect(current.source).toBeNull();
  act(() => renderer.update(<Probe />));
  expect(current.source).toBe(fallback);
  act(() => renderer.unmount());
});
