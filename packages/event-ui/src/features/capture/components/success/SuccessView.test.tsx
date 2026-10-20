// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { captureCopy } from "#features/capture/hooks";
import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { SuccessView } from "./SuccessView";

afterEach(() => vi.unstubAllGlobals());

it("tells a declined guest kindly, without the remove link, and offers another photo", async () => {
  vi.stubGlobal("navigator", { ...navigator, languages: ["en"] });
  const copy = captureCopy("en");
  const onAnother = vi.fn();
  render(
    <EventProvider runtime={createRuntimeFixture()}>
      <SuccessView
        previewUrl="blob:sent"
        caption="Our team at the booth"
        captionStyle="kalam"
        hashtag="#BoothWall"
        live={false}
        declined
        removed={false}
        busy={false}
        onAnother={onAnother}
        onRemove={vi.fn()}
      />
    </EventProvider>,
  );
  const status = screen.getByRole("status");
  expect(status.textContent).toContain(copy.declinedTitle);
  expect(status.textContent).toContain(copy.declinedStatus);
  expect(screen.getByText(copy.declinedTag)).toBeTruthy();
  expect(screen.queryByText(copy.successTitle)).toBeNull();
  expect(screen.queryByText(copy.remove)).toBeNull();
  expect(screen.queryByText("#BoothWall")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: copy.sendAnother }));
  expect(onAnother).toHaveBeenCalledTimes(1);
});
