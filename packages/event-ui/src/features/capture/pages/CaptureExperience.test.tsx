// @vitest-environment jsdom
import { boothwallConfig, DEFAULT_SETTINGS } from "@boothwall/shared";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { captureCopy as copyIn } from "#features/capture/hooks";
import { guestI18n } from "#i18n";
import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { CaptureExperience } from "./CaptureExperience";

vi.mock("#lib/image", () => ({
  resizeImage: vi.fn(async () => ({
    image: new Blob(["x"], { type: "image/jpeg" }),
    thumb: new Blob(["t"], { type: "image/jpeg" }),
  })),
}));

const settingsResponse = (overrides: Partial<typeof DEFAULT_SETTINGS>) =>
  new Response(JSON.stringify({ settings: { ...DEFAULT_SETTINGS, ...overrides } }), {
    headers: { "content-type": "application/json" },
  });

afterEach(() => vi.unstubAllGlobals());

describe("CapturePage", () => {
  it("closes capture for an ended event even when its saved intake preference is open", async () => {
    vi.stubGlobal("fetch", async () => settingsResponse({ uploadsOpen: true, eventEnded: true }));
    render(
      <EventProvider runtime={createRuntimeFixture()}>
        <CaptureExperience />
      </EventProvider>,
    );
    expect(await screen.findByText(copyIn("en").closedTitle)).toBeTruthy();
    expect(screen.queryByTestId("gallery-input")).toBeNull();
  });

  it("shows the hosts' message instead of the form while uploads are closed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        settingsResponse({ uploadsOpen: false, uploadsClosedMessage: "Back at 3" }),
      ),
    );
    render(
      <EventProvider runtime={createRuntimeFixture()}>
        <CaptureExperience />
      </EventProvider>,
    );
    expect(await screen.findByText(copyIn("en").closedTitle)).toBeTruthy();
    expect(screen.getByText("Back at 3")).toBeTruthy();
    expect(screen.queryByTestId("gallery-input")).toBeNull();
  });

  it("offers the live categories, not the config's", async () => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => settingsResponse({ categories: [{ id: "robots", label: "Robots" }] })),
    );
    const user = userEvent.setup();
    render(
      <EventProvider runtime={createRuntimeFixture()}>
        <CaptureExperience />
      </EventProvider>,
    );
    await screen.findByText(copyIn("en").title);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "me.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByRole("radio", { name: "Robots" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: boothwallConfig.categories[0].label })).toBeNull();
  });

  it("speaks German to a browser set to German", async () => {
    vi.stubGlobal("navigator", { ...navigator, languages: ["de-AT", "en"] });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => settingsResponse({})),
    );
    render(
      <EventProvider runtime={createRuntimeFixture()}>
        <CaptureExperience />
      </EventProvider>,
    );
    expect(await screen.findByText(copyIn("de").title)).toBeTruthy();
    expect(screen.getByText(copyIn("de").takePhoto)).toBeTruthy();
    expect(document.documentElement.lang).toBe("de");
  });

  it("only lets the photo go once a tribe and consent are given", async () => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
    globalThis.URL.revokeObjectURL = vi.fn();
    const user = userEvent.setup();
    render(
      <EventProvider runtime={createRuntimeFixture()}>
        <CaptureExperience />
      </EventProvider>,
    );

    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "me.jpg", { type: "image/jpeg" }),
    );
    const send = await screen.findByRole("button", { name: new RegExp(copyIn("en").submit) });
    expect(send.getAttribute("aria-disabled")).toBe("true");

    await user.click(screen.getByRole("radio", { name: boothwallConfig.categories[0].label }));
    expect(send.getAttribute("aria-disabled")).toBe("true");
    // A press now points at the box instead of sending.
    await user.click(send);
    expect(document.activeElement).toBe(screen.getByRole("checkbox"));

    await user.click(screen.getByRole("checkbox"));
    expect(send.getAttribute("aria-disabled")).toBeNull();
  });
});

it("honours the language query and runtime retention without replacing the URL", async () => {
  window.history.replaceState(null, "", "/snap?lang=de&campaign=party#join");
  vi.stubGlobal("navigator", { ...navigator, languages: ["en"] });
  vi.stubGlobal("fetch", async () => settingsResponse({}));
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  const runtime = { ...createRuntimeFixture(), retentionDays: 7 };
  render(
    <EventProvider runtime={runtime}>
      <CaptureExperience />
    </EventProvider>,
  );
  expect(await screen.findByText(copyIn("de").title)).toBeTruthy();
  await userEvent
    .setup()
    .upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "photo.jpg", { type: "image/jpeg" }),
    );
  expect(await screen.findByText(guestI18n("de")._("capture.consent", { days: "7" }))).toBeTruthy();
  expect(window.location.search).toBe("?lang=de&campaign=party");
  expect(window.location.hash).toBe("#join");
  window.history.replaceState(null, "", "/");
});
