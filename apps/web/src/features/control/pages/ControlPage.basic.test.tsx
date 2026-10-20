import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { withFakeApi } from "./ControlPage.fixtures";

withFakeApi();
it("opens a basic pending view with independent playback and intake controls", async () => {
  sessionStorage.setItem("boothwall:passcode", "123456");
  const user = userEvent.setup();
  render(<ControlPage />);
  await screen.findByText("Photo 1");
  expect(screen.getByRole("tab", { name: /Waiting/ }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("switch", { name: "Slideshow" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  expect(screen.getByRole("switch", { name: "Guest uploads" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  await user.click(screen.getByRole("tab", { name: /On the wall/ }));
  expect(screen.queryByRole("tab", { name: /Settings/ })).toBeNull();
});

it("links to the exact standalone snap destination and explains fullscreen", async () => {
  sessionStorage.setItem("boothwall:passcode", "123456");
  render(<ControlPage />);
  await screen.findByText("Photo 1");
  const snap = `${window.location.origin}/snap`;
  expect(screen.getByRole("link", { name: snap }).getAttribute("href")).toBe(snap);
  expect(screen.getByRole("img", { name: `Guest QR code: ${snap}` })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Open the wall" }).getAttribute("target")).toBe("_blank");
  expect(screen.getByText(/press F for full screen/)).toBeTruthy();
});
it("switches basic photo views with the keyboard and associates their panel", async () => {
  sessionStorage.setItem("boothwall:passcode", "123456");
  const user = userEvent.setup();
  render(<ControlPage />);
  const pending = await screen.findByRole("tab", { name: /Waiting/ });
  await user.click(pending);
  await user.keyboard("{ArrowRight}");
  const approved = screen.getByRole("tab", { name: /On the wall/ });
  expect(document.activeElement).toBe(approved);
  expect(approved.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(approved.id);
});
