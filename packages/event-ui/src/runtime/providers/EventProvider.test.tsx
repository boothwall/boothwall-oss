// @vitest-environment jsdom
import { DEFAULT_SETTINGS } from "@boothwall/shared";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { afterEach, expect, it } from "vitest";

import { useEventRuntime } from "../hooks";
import { createEventTransport } from "../transport";
import type { EventRuntime } from "../types";
import { EventProvider } from "./EventProvider";

afterEach(cleanup);
const runtime = (id: string): EventRuntime => ({
  scopeKey: `https://api.example.test:${id}:public:live`,
  transport: createEventTransport({ apiBaseUrl: "https://api.example.test", wallId: id }),
  links: {
    wall: "/",
    snap: "/snap",
    recap: "/recap",
    control: "/control",
  },
  wall: { apiBaseUrl: "https://api.example.test", target: { wallId: id } },
  defaults: DEFAULT_SETTINGS,
  presentation: {
    sourceUrl: "https://example.test",
    sourceLabel: "Source",
    showSourceOnWall: true,
    showSourceOnGuest: true,
  },
  retentionDays: 14,
  demo: false,
});

it("drops drafts and ignores a delayed result when the selected wall changes", async () => {
  let resolveA!: (value: string) => void;
  const responseA = new Promise<string>((resolve) => {
    resolveA = resolve;
  });
  function Consumer() {
    const event = useEventRuntime();
    const [draft, setDraft] = useState("");
    const [result, setResult] = useState("");
    useEffect(() => {
      let active = true;
      if (event.wall.target.wallId === "a")
        void responseA.then((value) => {
          if (active) setResult(value);
        });
      return () => {
        active = false;
      };
    }, [event]);
    return (
      <>
        <input aria-label="draft" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <output>{result}</output>
      </>
    );
  }
  const view = render(
    <EventProvider runtime={runtime("a")}>
      <Consumer />
    </EventProvider>,
  );
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "A secret draft" } });
  view.rerender(
    <EventProvider runtime={runtime("b")}>
      <Consumer />
    </EventProvider>,
  );
  await act(async () => {
    resolveA("A protected result");
    await responseA;
  });
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
  expect(screen.getByRole("status").textContent).toBe("");
});
