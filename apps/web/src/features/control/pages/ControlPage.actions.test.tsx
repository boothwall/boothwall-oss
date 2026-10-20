import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { api, handleApi, loadOriginals, photo, state, withFakeApi } from "./ControlPage.fixtures";

withFakeApi();
function mount() {
  sessionStorage.setItem("boothwall:passcode", "123456");
  render(<ControlPage />);
  return userEvent.setup();
}
it("approves exactly one pending photo and shows it in the approved view", async () => {
  state.pending.push(photo(4, { status: "pending" }));
  const user = mount();
  const row = (await screen.findByText("Photo 1")).closest("article")!;
  loadOriginals();
  await user.click(within(row).getByRole("button", { name: "Approve" }));
  await waitFor(() => expect(screen.queryByText("Photo 1")).toBeNull());
  expect(screen.getByText("Photo 4")).toBeTruthy();
  expect(state.pending.map((p) => p.caption)).toEqual(["Photo 4"]);
  await user.click(screen.getByRole("tab", { name: /On the wall/ }));
  expect(screen.getByText("Photo 1")).toBeTruthy();
});
it("rejects one pending photo only after confirming irreversible removal", async () => {
  state.pending.push(photo(4, { status: "pending" }));
  const user = mount();
  const row = (await screen.findByText("Photo 1")).closest("article")!;
  await user.click(within(row).getByRole("button", { name: "Reject" }));
  expect(state.pending).toHaveLength(2);
  await user.click(within(row).getByRole("button", { name: "Confirm rejection" }));
  await waitFor(() => expect(screen.queryByText("Photo 1")).toBeNull());
  expect(state.pending.map((p) => p.caption)).toEqual(["Photo 4"]);
});
it("removes one approved photo without touching other photos", async () => {
  const user = mount();
  await screen.findByText("Photo 1");
  await user.click(screen.getByRole("tab", { name: /On the wall/ }));
  const row = screen.getByText("Photo 2").closest("li")!;
  await user.click(within(row).getByRole("button", { name: "Remove" }));
  await user.click(within(row).getByRole("button", { name: "Confirm removal" }));
  await waitFor(() => expect(screen.queryByText("Photo 2")).toBeNull());
  expect(state.approved.map((p) => p.caption)).toEqual(["Photo 3"]);
});
it("keeps a failed removal confirmation and photo available for retry", async () => {
  let fail = true;
  api.mockImplementation((input, init) =>
    init?.method === "DELETE" && fail
      ? Promise.resolve(Response.json({ error: { code: "UNAVAILABLE" } }, { status: 503 }))
      : handleApi(input, init),
  );
  const user = mount();
  await screen.findByText("Photo 1");
  await user.click(screen.getByRole("tab", { name: /On the wall/ }));
  const row = screen.getByText("Photo 2").closest("li")!;
  await user.click(within(row).getByRole("button", { name: "Remove" }));
  await user.click(within(row).getByRole("button", { name: "Confirm removal" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(within(row).getByRole("button", { name: "Confirm removal" })).toBeTruthy();
  fail = false;
  await user.click(within(row).getByRole("button", { name: "Confirm removal" }));
  await waitFor(() => expect(screen.queryByText("Photo 2")).toBeNull());
  expect(screen.queryByRole("alert")).toBeNull();
});
