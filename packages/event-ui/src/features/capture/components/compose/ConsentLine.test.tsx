// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";

import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { ConsentLine } from "./ConsentLine";

function ConsentHarness() {
  const [checked, setChecked] = useState(false);

  return (
    <EventProvider runtime={createRuntimeFixture()}>
      <ConsentLine checked={checked} onChange={setChecked} nudged={false} />
    </EventProvider>
  );
}

it("labels the consent checkbox and lets the guest toggle it", async () => {
  render(<ConsentHarness />);

  const checkbox = screen.getByRole("checkbox", { name: /./ }) as HTMLInputElement;

  expect(checkbox.checked).toBe(false);

  await userEvent.click(checkbox);
  expect(checkbox.checked).toBe(true);

  await userEvent.click(checkbox);
  expect(checkbox.checked).toBe(false);
});
