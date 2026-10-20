import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { api, loadOriginals, photo, state, withFakeApi } from "./ControlPage.fixtures";

withFakeApi();
function mount() {
  sessionStorage.setItem("boothwall:passcode", "123456");
  render(<ControlPage />);
  return userEvent.setup();
}
const tile = (label: string) =>
  screen.getByText(label).parentElement?.querySelector("dd")?.textContent;

it("shows the API's numbers for today and follows a decision without waiting for the poll", async () => {
  const user = mount();
  await waitFor(() => expect(tile("on the wall")).toBe("2"));
  expect(tile("waiting")).toBe("1");
  expect(tile("sent today")).toBe("3");
  const since = new URL(String(api.mock.calls.find(([u]) => String(u).includes("/stats"))?.[0]));
  expect(new Date(since.searchParams.get("since")!).getHours()).toBe(0);
  loadOriginals();
  await user.click(screen.getByRole("button", { name: "Approve" }));
  await waitFor(() => expect(tile("on the wall")).toBe("3"));
  expect(tile("waiting")).toBe("0");
});

it("labels a waiting photo with its category and how long it has waited", async () => {
  const twoMinutesAgo = new Date(Date.now() - 125_000).toISOString();
  state.pending = [photo(1, { status: "pending", tribe: "team", createdAt: twoMinutesAgo })];
  mount();
  const card = (await screen.findByText("Photo 1")).closest("article")!;
  expect(within(card).getByText("On the team")).toBeTruthy();
  expect(within(card).getAllByText("2 min ago").length).toBeGreaterThan(0);
  expect(card.getAttribute("aria-label")).toBe("Waiting · 1 of 1");
});

it("approves from the queue only once that photo's original loaded, and brings any up to decide on", async () => {
  state.pending.push(photo(4, { status: "pending" }));
  const user = mount();
  const approve = await screen.findByRole<HTMLButtonElement>("button", {
    name: "Approve: Photo 4",
  });
  expect(approve.disabled).toBe(true);
  await user.click(screen.getByRole("button", { name: "Review Photo 4" }));
  const card = screen.getByRole("article", { name: "Waiting · 2 of 2" });
  expect(within(card).getByText("Photo 4")).toBeTruthy();
  loadOriginals();
  await user.click(screen.getByRole("button", { name: "Approve: Photo 1" }));
  await waitFor(() => expect(state.pending.map((p) => p.caption)).toEqual(["Photo 4"]));
});
