import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PhotoImage } from "./PhotoImage";

describe("PhotoImage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("stays hidden until the photo loads", () => {
    render(<PhotoImage src="photo.jpg" alt="Cheers" />);
    expect(screen.getByAltText("Cheers").className).toContain("opacity-0");
  });

  it("shows a photo that finished loading before it mounted, as after server rendering", () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(640);
    render(<PhotoImage src="photo.jpg" alt="Cheers" />);
    expect(screen.getByAltText("Cheers").className).toContain("opacity-100");
  });

  it("reports loading through the quiet retry, then failed, and loaded only on a real load", () => {
    vi.useFakeTimers();
    const phases: string[] = [];
    const { rerender } = render(
      <PhotoImage src="a.jpg" alt="Cheers" onPhaseChange={(p) => phases.push(p)} />,
    );
    fireEvent.error(screen.getByAltText("Cheers"));
    act(() => vi.advanceTimersByTime(2500));
    expect(phases).toEqual(["loading"]);
    fireEvent.error(screen.getByAltText("Cheers"));
    expect(phases).toEqual(["loading", "failed"]);
    rerender(<PhotoImage src="b.jpg" alt="Cheers" onPhaseChange={(p) => phases.push(p)} />);
    fireEvent.load(screen.getByAltText("Cheers"));
    expect(phases).toEqual(["loading", "failed", "loading", "loaded"]);
    vi.useRealTimers();
  });
});
