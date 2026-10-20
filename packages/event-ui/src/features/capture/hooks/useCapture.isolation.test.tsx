// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { EventProvider } from "#runtime";
import { createRuntimeFixture, photoFixture } from "#testing/runtime";

import { useCapture } from "./useCapture";
vi.mock("#lib/image", () => ({
  resizeImage: async () => ({ image: new Blob(["image"]), thumb: new Blob(["thumb"]) }),
}));
afterEach(() => vi.unstubAllGlobals());
it("clears a selected image and own-delete token when switching walls during upload", async () => {
  URL.createObjectURL = vi.fn(() => "blob:own-photo");
  URL.revokeObjectURL = vi.fn();
  let finish!: (response: Response) => void;
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  let capture!: ReturnType<typeof useCapture>;
  function Probe() {
    capture = useCapture([{ id: "guests", label: "Guests", catchAll: true }]);
    return <span>{capture.step}</span>;
  }
  const view = render(
    <EventProvider runtime={createRuntimeFixture("a")}>
      <Probe />
    </EventProvider>,
  );
  await act(() => capture.pickFile(new File(["image"], "photo.jpg")));
  act(() => capture.setConsent(true));
  let upload!: Promise<void>;
  await act(async () => {
    upload = capture.submit();
  });
  expect(capture.step).toBe("sending");
  view.rerender(
    <EventProvider runtime={createRuntimeFixture("b")}>
      <Probe />
    </EventProvider>,
  );
  expect(capture.step).toBe("pick");
  expect(capture.draft).toBeNull();
  expect(capture.consent).toBe(false);
  await act(async () => {
    finish(Response.json({ photo: photoFixture, deleteToken: "old-token" }));
    await upload;
  });
  expect(capture.posted).toBeNull();
  expect(capture.step).toBe("pick");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:own-photo");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
