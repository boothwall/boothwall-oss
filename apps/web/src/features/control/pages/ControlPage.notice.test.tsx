import type * as Shared from "@boothwall/shared";
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { ControlPage } from "./ControlPage";
import { withFakeApi } from "./ControlPage.fixtures";

const { NOTICE } = vi.hoisted(() => ({ NOTICE: "A shared demo: photos are deleted after a day." }));
vi.mock("@boothwall/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof Shared>();
  return { ...actual, boothwallConfig: { ...actual.boothwallConfig, notice: NOTICE } };
});

withFakeApi();

it("shows the configured notice on the unlock card", () => {
  render(<ControlPage />);
  expect(screen.getByText(NOTICE)).toBeTruthy();
});

it("shows the configured notice under the unlocked desk", async () => {
  sessionStorage.setItem("boothwall:passcode", "123456");
  render(<ControlPage />);
  expect(await screen.findByText(NOTICE)).toBeTruthy();
});
