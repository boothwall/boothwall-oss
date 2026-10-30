// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { captureCopy } from "#features/capture/hooks";
import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { SendBar } from "./SendBar";

const copy = captureCopy("en");

function renderSendBar({ ready, sending = false }: { ready: boolean; sending?: boolean }) {
  const onBlocked = vi.fn();
  const onSubmit = vi.fn();
  const hint = "Choose a category before sending";

  render(
    <EventProvider runtime={createRuntimeFixture()}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <SendBar ready={ready} hint={hint} sending={sending} onBlocked={onBlocked} />
      </form>
    </EventProvider>,
  );

  return { hint, onBlocked, onSubmit };
}

it("explains a blocked send, calls onBlocked, and does not submit", async () => {
  const { hint, onBlocked, onSubmit } = renderSendBar({ ready: false });
  const button = screen.getByRole("button", { name: copy.submit });
  const hintElement = screen.getByText(hint);

  expect(button.getAttribute("aria-disabled")).toBe("true");
  expect(button.getAttribute("aria-describedby")).toBe(hintElement.id);

  await userEvent.click(button);

  expect(onBlocked).toHaveBeenCalledTimes(1);
  expect(onSubmit).not.toHaveBeenCalled();
});

it("submits when the guest is ready", async () => {
  const { onBlocked, onSubmit } = renderSendBar({ ready: true });

  await userEvent.click(screen.getByRole("button", { name: copy.submit }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onBlocked).not.toHaveBeenCalled();
});

it("shows the sending label while sending", () => {
  renderSendBar({ ready: true, sending: true });

  expect(screen.getByRole("button", { name: copy.sending })).toBeTruthy();
});
