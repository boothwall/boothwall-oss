import React, { Profiler } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { LaunchShell } from "./LaunchShell";

const mockApp = jest.fn(() => null);
jest.mock("./App", () => ({ App: () => mockApp() }));

it("commits the plain shell first and the wall right after", () => {
  const commits: [string, number][] = [];
  act(() => {
    TestRenderer.create(
      <Profiler
        id="launch"
        onRender={(_, phase) => commits.push([phase, mockApp.mock.calls.length])}
      >
        <LaunchShell />
      </Profiler>,
    );
  });
  expect(commits).toEqual([
    ["mount", 0],
    ["update", 1],
  ]);
});
