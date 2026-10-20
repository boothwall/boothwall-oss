import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandHeader } from "./BrandHeader";

const base = { logoSrc: "/lockup.png", logoAlt: "Acme, back to the wall", homeHref: "/" };

describe("BrandHeader", () => {
  it("keeps one logo and the action in the bar by default", () => {
    render(<BrandHeader {...base} action={<button>Open the wall</button>} />);
    const bar = screen.getByRole("banner");
    expect(bar.contains(screen.getByRole("button", { name: "Open the wall" }))).toBe(true);
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("sets the event's logo right of the lockup and moves the action under the bar", () => {
    render(
      <BrandHeader
        {...base}
        eventLogo={{ src: "/event.png", alt: "Hack Night" }}
        action={<button>Open the wall</button>}
      />,
    );
    const bar = screen.getByRole("banner");
    expect(bar.contains(screen.getByRole("img", { name: "Hack Night" }))).toBe(true);
    expect(screen.getByRole("link", { name: "Acme, back to the wall" })).toBeTruthy();
    expect(bar.contains(screen.getByRole("button", { name: "Open the wall" }))).toBe(false);
  });
});
