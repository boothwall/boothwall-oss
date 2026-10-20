// @vitest-environment jsdom
import { act, renderHook as testingRenderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { useCapture } from "./useCapture";

const runtime = createRuntimeFixture();
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(EventProvider, { runtime, children });
const renderHook: typeof testingRenderHook = (callback, options) =>
  testingRenderHook(callback, { ...options, wrapper });

const withCatchAll = [
  { id: "team", label: "On the team" },
  { id: "visiting", label: "Just visiting", catchAll: true },
];

describe("useCapture", () => {
  it("files the photo under the catch-all until the guest picks a category", () => {
    const { result } = renderHook(() => useCapture(withCatchAll));
    expect(result.current.tribe).toBe("visiting");
    expect(result.current.missing).toBe("consent");

    act(() => result.current.setTribe("team"));
    expect(result.current.tribe).toBe("team");
  });

  it("asks for a category when there is no catch-all", () => {
    const { result } = renderHook(() => useCapture([{ id: "team", label: "On the team" }]));
    expect(result.current.tribe).toBeNull();
    expect(result.current.missing).toBe("both");
    act(() => result.current.setConsent(true));
    expect(result.current.missing).toBe("category");
  });

  it("falls back to the catch-all when the picked category is removed", () => {
    const { result, rerender } = renderHook(({ categories }) => useCapture(categories), {
      initialProps: { categories: withCatchAll },
    });
    act(() => result.current.setTribe("team"));
    rerender({ categories: [withCatchAll[1]!] });
    expect(result.current.tribe).toBe("visiting");
  });
});
