import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { GuestLink } from "./GuestLink";

it("preserves exact guest path case in the link, QR and clipboard", async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  const path = "https://example.test/AbC9/snap";
  render(<GuestLink path={path} />);
  expect(screen.getByRole("link", { name: path }).getAttribute("href")).toBe(path);
  expect(
    screen
      .getByRole("img", { name: `Guest QR code: ${path}` })
      .querySelector("path")
      ?.getAttribute("d"),
  ).toMatch(/^M/);
  await user.click(screen.getByRole("button", { name: "Copy guest link" }));
  expect(copy).toHaveBeenCalledWith(path);
  expect(await screen.findByText("Guest link copied.")).toBeTruthy();
  copy.mockRestore();
});
it("keeps the exact guest link readable when clipboard permission is denied", async () => {
  const user = userEvent.setup();
  const copy = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockRejectedValue(new DOMException("denied"));
  render(<GuestLink path="/snap" />);
  await user.click(screen.getByRole("button", { name: "Copy guest link" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/Select and copy/));
  expect(screen.getByRole("link").getAttribute("href")).toBe(`${window.location.origin}/snap`);
  copy.mockRestore();
});
it.each([
  "javascript:alert(1)",
  "data:text/plain,secret",
  "https://user:pass@example.test/snap",
  `https://example.test/${"x".repeat(3000)}`,
])("fails safely without publishing an unsafe or unencodable QR: %s", (path) => {
  render(<GuestLink path={path} />);
  expect(screen.getByRole("alert").textContent).toMatch(/guest link is unavailable/);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});
