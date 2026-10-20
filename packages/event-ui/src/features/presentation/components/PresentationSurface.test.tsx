// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { EventShell } from "#features/guest-shell";
import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

it("uses live artwork, venue, badge and credits, with image fallback and scoped palette", () => {
  const runtime = createRuntimeFixture();
  const presentation = {
    logoUrl: "/host/logo.png",
    backdropUrl: "/host/backdrop.jpg",
    venue: "The garden",
    badge: "Tonight",
    sourceUrl: "https://organizer.example.test",
    sourceLabel: "Our hosts",
    showSourceOnGuest: true,
    theme: { primary: "#00AA88", secondary: "#5566AA", tertiary: "#FF3366" },
  };
  const { container, rerender } = render(
    <EventProvider runtime={runtime}>
      <EventShell eventName="Garden party" presentation={presentation}>
        Hello
      </EventShell>
    </EventProvider>,
  );
  expect(screen.getByText("The garden")).toBeTruthy();
  expect(screen.getByText("Tonight")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Our hosts/ }).getAttribute("href")).toBe(
    presentation.sourceUrl,
  );
  const logo = screen.getByRole("img", { name: "Garden party" });
  expect(logo.getAttribute("src")).toBe("https://api.example.test/host/logo.png");
  fireEvent.error(logo);
  expect(screen.getByRole("link", { name: "Garden party" })).toBeTruthy();
  expect(container.firstElementChild?.getAttribute("style")).toContain("--u-primary: #00AA88");
  expect(container.firstElementChild?.getAttribute("style")).toContain("--u-page-glow: none");
  const backdrop = container.querySelector('img[alt=""]');
  expect(backdrop?.parentElement?.style.opacity).toBe("0.15");
  rerender(
    <EventProvider runtime={runtime}>
      <EventShell presentation={{ logoUrl: null, showSourceOnGuest: false }}>Hello</EventShell>
    </EventProvider>,
  );
  expect(screen.queryByRole("link", { name: /Our hosts/ })).toBeNull();
});
