import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { controlCopy } from "@/features/control/constants";
import { ControlPage } from "@/features/control/pages/ControlPage";
import { api, withFakeApi } from "@/features/control/pages/ControlPage.fixtures";

withFakeApi();

/** Unlocking; the other areas sit beside this file as ControlPage.<area>.test.tsx. */
describe("ControlPage", () => {
  it("unlocks into the queue, with the waiting count on the tab", async () => {
    const user = userEvent.setup();
    render(<ControlPage />);

    await user.type(screen.getByLabelText(controlCopy.passcodeLabel), "123456");
    await user.click(screen.getByRole("button", { name: controlCopy.unlock }));

    const queueTab = screen.getByRole("tab", { name: /Waiting/ });
    expect(queueTab.getAttribute("aria-selected")).toBe("true");
    expect(await within(queueTab).findByText("1")).toBeTruthy();
    expect(await screen.findByText("Photo 1")).toBeTruthy();
    const pending = api.mock.calls.find(([input]) => String(input).includes("/photos/pending"));
    expect(new Headers(pending?.[1]?.headers).get("authorization")).toBe("Bearer 123456");
  });

  it("says what is missing on an empty unlock, without asking the API", async () => {
    const user = userEvent.setup();
    render(<ControlPage />);

    await user.click(screen.getByRole("button", { name: controlCopy.unlock }));

    expect(screen.getByRole("alert").textContent).toBe(controlCopy.unlockScreen.empty);
    expect(api.mock.calls.some(([input]) => String(input).includes("/photos/pending"))).toBe(false);
  });
});
