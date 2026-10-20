import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { api, state, withFakeApi } from "./ControlPage.fixtures";

withFakeApi();
const checked = (name: string) => screen.getByRole("switch", { name }).getAttribute("aria-checked");

it("loads persisted playback and changes intake without changing playback or ending the event", async () => {
  state.settings = { ...state.settings, playbackPaused: true, uploadsOpen: true };
  sessionStorage.setItem("boothwall:passcode", "123456");
  const user = userEvent.setup();
  const view = render(<ControlPage />);
  await waitFor(() => expect(checked("Slideshow")).toBe("false"));
  await user.click(screen.getByRole("switch", { name: "Guest uploads" }));
  await waitFor(() => expect(checked("Guest uploads")).toBe("false"));
  expect(state.settings.playbackPaused).toBe(true);
  expect(state.settings.eventEnded).toBe(false);
  expect(screen.getByText("Slideshow paused")).toBeTruthy();
  await user.click(screen.getByRole("switch", { name: "Slideshow" }));
  await waitFor(() => expect(checked("Slideshow")).toBe("true"));
  expect(state.settings.uploadsOpen).toBe(false);
  const patches = api.mock.calls.filter(([, init]) => init?.method === "PATCH");
  expect(
    patches.map(([input, init]) => [
      new URL(String(input)).pathname,
      JSON.parse(String(init?.body)),
    ]),
  ).toEqual([
    ["/settings/runtime", { uploadsOpen: false }],
    ["/settings/runtime", { playbackPaused: false }],
  ]);
  view.unmount();
  render(<ControlPage />);
  await waitFor(() => expect(screen.getByText("Uploads closed")).toBeTruthy());
  expect(screen.getByText("Slideshow playing")).toBeTruthy();
});
