// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { EventProvider, type EventRuntime } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { useCaptureCopy } from "./useCaptureCopy";

afterEach(() => vi.unstubAllGlobals());

function consentWith(retention: EventRuntime["retention"]) {
  vi.stubGlobal("navigator", { ...navigator, languages: ["en"] });
  const runtime = { ...createRuntimeFixture(), retentionDays: 14, retention };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EventProvider runtime={runtime}>{children}</EventProvider>
  );
  return renderHook(() => useCaptureCopy(), { wrapper }).result.current.consent;
}

const TAIL = "It may be removed sooner. Copies someone already downloaded aren't deleted.";

it("keeps the standalone wording only when the field is absent", () => {
  expect(consentWith(undefined)).toMatch(/deleted automatically after 14 days\.$/);
});

it("invents no deadline when the wall's window isn't known", () => {
  const unknown = consentWith(null);
  expect(unknown).toContain("We can't show when it stops being available yet.");
  expect(unknown).toContain(TAIL);
  expect(unknown).not.toMatch(/\d+ days|deleted automatically/);
});

it("ends access at the window and only queues deletion, counted from upload or by the exact deadline", () => {
  const upload = consentWith({
    observedAt: "2026-10-14T10:00:00Z",
    anchor: "upload",
    days: 90,
    expiresAt: null,
  });
  expect(upload).toContain(
    "It stops being available 90 days after you send it, and is then queued for deletion.",
  );
  expect(upload).toContain(TAIL);

  const pass = consentWith({
    observedAt: "2026-10-14T10:00:00Z",
    anchor: "scheduled-event-end",
    days: 30,
    expiresAt: "2026-12-14T12:00:00Z",
  });
  expect(pass).toContain(
    "It stops being available on December 14, 2026, and is then queued for deletion.",
  );
  expect(pass).not.toMatch(/30 days|deleted automatically/);
});
