// @vitest-environment jsdom
import type { Category, Tribe } from "@boothwall/shared";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";

import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { CategoryPicker } from "./CategoryPicker";

const categories: readonly Category[] = [
  { id: "friends", label: "Friends & family" },
  { id: "team", label: "On the team" },
  { id: "visiting", label: "Just visiting", catchAll: true },
];

function CategoryHarness({ onChange }: { onChange: (tribe: Tribe) => void }) {
  const [value, setValue] = useState<Tribe | null>(null);

  const handleChange = (tribe: Tribe) => {
    setValue(tribe);
    onChange(tribe);
  };

  return (
    <EventProvider runtime={createRuntimeFixture()}>
      <CategoryPicker categories={categories} value={value} onChange={handleChange} />
    </EventProvider>
  );
}

it("reports a picked category and exposes it as checked", async () => {
  const onChange = vi.fn();

  render(<CategoryHarness onChange={onChange} />);

  const friends = screen.getByRole("radio", {
    name: "Friends & family",
  }) as HTMLInputElement;

  expect(friends.checked).toBe(false);

  await userEvent.click(friends);

  expect(onChange).toHaveBeenCalledWith("friends");
  expect(friends.checked).toBe(true);
});
