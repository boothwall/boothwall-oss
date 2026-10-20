import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("Button", () => {
  it("draws primary in amber with navy text and never the old white fill", () => {
    render(<Button variant="primary">Send</Button>);
    const button = screen.getByRole("button", { name: "Send" });
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-on-primary");
    expect(button.className).not.toContain("bg-ink");
  });

  it("keeps a disabled primary solid (a neutral fill, muted label), never see-through", () => {
    render(
      <Button variant="primary" disabled>
        Unlock
      </Button>,
    );
    const { className } = screen.getByRole("button", { name: "Unlock" });
    expect(className).toContain("disabled:bg-surface-strong");
    expect(className).toContain("disabled:opacity-100");
    expect(className).not.toContain("disabled:bg-transparent");
  });

  it("stays focusable but swallows presses and reports busy while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toHaveProperty("disabled", false);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("names an icon button by its label, not its icon", () => {
    render(<IconButton icon={<svg data-testid="icon" />} label="Close" />);
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(screen.getByTestId("icon").parentElement?.getAttribute("aria-hidden")).toBe("true");
  });
});
