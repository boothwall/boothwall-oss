// @vitest-environment jsdom
import type { WallConnection } from "@boothwall/shared";
import type * as WallUI from "@boothwall/wall-ui";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { WallFrame } from "./WallFrame";

vi.mock("@boothwall/wall-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof WallUI>()),
  WallScreen: ({ connection, copy }: { connection: WallConnection; copy?: WallUI.WallCopy }) => (
    <output>
      {JSON.stringify({
        joinUrl: connection.joinUrl,
        recapUrl: connection.recapUrl,
        accessChanged: copy?.wall.accessChanged,
      })}
    </output>
  ),
}));
afterEach(cleanup);

it.each([undefined, "/MixedCase/recap"])(
  "passes only configured destinations to the display: %s",
  (recap) => {
    const runtime = createRuntimeFixture();
    runtime.links = { wall: "/", snap: "/snap", control: "/control", recap };
    render(
      <EventProvider runtime={runtime}>
        <WallFrame demo />
      </EventProvider>,
    );
    const connection = JSON.parse(screen.getByRole("status").textContent ?? "{}");
    expect(connection.joinUrl).toBe(new URL("/snap", window.location.href).toString());
    if (recap) expect(connection.recapUrl).toBe(new URL(recap, window.location.href).toString());
    else expect(connection).not.toHaveProperty("recapUrl");
  },
);

it("hands the display a host's own wording, and none without it", () => {
  const runtime = createRuntimeFixture();
  const view = render(
    <EventProvider runtime={runtime}>
      <WallFrame demo />
    </EventProvider>,
  );
  expect(JSON.parse(screen.getByRole("status").textContent ?? "{}")).not.toHaveProperty(
    "accessChanged",
  );
  view.unmount();
  const wallWords = { accessChanged: "Connect this screen again." };
  render(
    <EventProvider runtime={{ ...runtime, presentation: { ...runtime.presentation, wallWords } }}>
      <WallFrame demo />
    </EventProvider>,
  );
  expect(JSON.parse(screen.getByRole("status").textContent ?? "{}").accessChanged).toBe(
    "Connect this screen again.",
  );
});
