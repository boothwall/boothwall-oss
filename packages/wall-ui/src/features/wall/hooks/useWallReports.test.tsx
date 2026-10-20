import type { PhotoDTO } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { useWallReports } from "./useWallReports";

const photo = (id: string) => ({ id }) as PhotoDTO;

it("reports the photos on mount and whenever they change", () => {
  const onPhotosChange = jest.fn();
  const first = [photo("a")];
  const second = [photo("b"), photo("a")];
  function Probe({ pool }: { pool: PhotoDTO[] }) {
    useWallReports({ onPhotosChange }, false, false, { pool });
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe pool={first} />);
  });
  act(() => renderer.update(<Probe pool={first} />));
  act(() => renderer.update(<Probe pool={second} />));
  expect(onPhotosChange.mock.calls).toEqual([[first], [second]]);
});
