import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { api, handleApi, loadOriginals, photo, withFakeApi } from "./ControlPage.fixtures";

withFakeApi();
function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function mount() {
  sessionStorage.setItem("boothwall:passcode", "123456");
  render(<ControlPage />);
  return userEvent.setup();
}
it("does not restore an approved photo from a refresh started before the decision", async () => {
  const user = mount();
  await screen.findByText("Photo 1");
  const refresh = deferredResponse();
  api.mockImplementation((input, init) =>
    new URL(String(input)).pathname === "/photos/pending"
      ? refresh.promise
      : handleApi(input, init),
  );
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  loadOriginals();
  await user.click(screen.getByRole("button", { name: "Approve" }));
  await waitFor(() => expect(screen.queryByText("Photo 1")).toBeNull());
  await act(async () => {
    refresh.resolve(Response.json({ photos: [photo(1, { status: "pending" })] }));
  });
  expect(screen.queryByText("Photo 1")).toBeNull();
});
it("ignores a previous session's delayed denial after locking and unlocking", async () => {
  const user = mount();
  await screen.findByText("Photo 1");
  const oldAction = deferredResponse();
  api.mockImplementation((input, init) =>
    init?.method === "POST" ? oldAction.promise : handleApi(input, init),
  );
  loadOriginals();
  await user.click(screen.getByRole("button", { name: "Approve" }));
  await user.click(screen.getByRole("button", { name: "Lock the panel" }));
  await user.type(screen.getByLabelText("Passcode"), "654321");
  await user.click(screen.getByRole("button", { name: "Unlock" }));
  await screen.findByText("Photo 1");
  await act(async () => {
    oldAction.resolve(Response.json({ error: { code: "DENIED" } }, { status: 403 }));
  });
  expect(screen.getByText("Photo 1")).toBeTruthy();
  expect(screen.queryByLabelText("Passcode")).toBeNull();
  expect(sessionStorage.getItem("boothwall:passcode")).toBe("654321");
});
it("holds one photo decision while its request is pending", async () => {
  const user = mount();
  await screen.findByText("Photo 1");
  const approval = deferredResponse();
  api.mockImplementation((input, init) =>
    init?.method === "POST" ? approval.promise : handleApi(input, init),
  );
  loadOriginals();
  const button = screen.getByRole<HTMLButtonElement>("button", { name: "Approve" });
  await user.dblClick(button);
  expect(button.disabled).toBe(true);
  expect(api.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  await act(async () => {
    approval.resolve(Response.json({ photo: photo(1) }));
  });
  expect(screen.queryByText("Photo 1")).toBeNull();
});
