import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ControlPage } from "./ControlPage";
import { withFakeApi } from "./ControlPage.fixtures";

vi.mock("@/features/wall", () => ({ WallFrame: () => <div data-testid="wall-preview" /> }));

withFakeApi();
beforeEach(() => {
  sessionStorage.setItem("boothwall:passcode", "123456");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => history.replaceState(null, "", "/"));
const current = () => screen.getByRole("link", { current: "page" }).textContent;

it("gives each phone tab its own address, with Back stepping through them", async () => {
  history.replaceState(null, "", "/control");
  const user = userEvent.setup();
  render(<ControlPage />);
  await screen.findByText("Photo 1");
  expect(current()).toMatch(/^Review/);
  expect(screen.queryByTestId("wall-preview")).toBeNull();

  await user.click(screen.getByRole("link", { name: "Live" }));
  expect(window.location.pathname).toBe("/control/live");
  expect(current()).toBe("Live");
  expect(await screen.findByTestId("wall-preview")).toBeTruthy();

  act(() => {
    history.back();
  });
  await vi.waitFor(() => expect(window.location.pathname).toBe("/control"));
  expect(current()).toMatch(/^Review/);
  expect(screen.queryByTestId("wall-preview")).toBeNull();
});

it("opens straight on the tab its address names", async () => {
  history.replaceState(null, "", "/control/guests");
  render(<ControlPage />);
  await screen.findByText("Photo 1");
  expect(current()).toBe("Guests");
  expect(screen.getByRole("link", { name: "Guests" }).getAttribute("href")).toBe("/control/guests");
});
