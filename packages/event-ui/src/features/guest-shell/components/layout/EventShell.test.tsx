// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";

import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { EventShell } from "./EventShell";

const presentation = { logoUrl: "/event-wordmark.png", venue: "Main hall", badge: "Demo" };

function renderShell(hostLogo?: { src: string; alt: string }) {
  const runtime = { ...createRuntimeFixture(), hostLogo };
  return render(
    <EventProvider runtime={runtime}>
      <EventShell eventName="Hack Night" presentation={presentation}>
        Hello
      </EventShell>
    </EventProvider>,
  );
}

it("leads with the event's logo alone and keeps the badge in the header by default", () => {
  renderShell();
  const header = screen.getByRole("banner");
  expect(within(header).getAllByRole("img")).toHaveLength(1);
  expect(within(header).getByText("Demo")).toBeTruthy();
});

it("sets the host's lockup left and the event's logo right, with the badge by the venue", () => {
  renderShell({ src: "/lockup.png", alt: "BoothWall OSS, back to the wall" });
  const header = screen.getByRole("banner");
  const lockup = within(header).getByRole("link", { name: "BoothWall OSS, back to the wall" });
  expect(lockup.getAttribute("href")).toBe(createRuntimeFixture().links.wall);
  expect(within(header).getByRole("img", { name: "Hack Night" }).getAttribute("src")).toContain(
    "/event-wordmark.png",
  );
  expect(within(header).queryByText("Demo")).toBeNull();
  expect(screen.getByText("Main hall").textContent).toBe("Main hallDemo");
});

it("shows the deployment's notice as one quiet line at the foot of the page, only when set", () => {
  const base = createRuntimeFixture();
  const notice = "A shared demo: photos are deleted after a day.";
  const runtime = { ...base, presentation: { ...base.presentation, notice } };
  const view = render(
    <EventProvider runtime={runtime}>
      <EventShell eventName="Hack Night">Hello</EventShell>
    </EventProvider>,
  );
  expect(within(screen.getByRole("contentinfo")).getByText(notice)).toBeTruthy();
  view.unmount();
  renderShell();
  expect(screen.queryByText(notice)).toBeNull();
});
