import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Polaroid } from "./Polaroid";

describe("Polaroid", () => {
  it("shows a read-only caption, the corner badge and the tilt", () => {
    const { container } = render(
      <Polaroid src="photo.jpg" alt="" caption="Cheers!" tilt={-3} badge={<span>New</span>} />,
    );
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Cheers!")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(container.querySelector("figure")?.style.rotate).toBe("-3deg");
  });
});
