import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { api, handleApi, loadOriginals, photo, withFakeApi } from "./ControlPage.fixtures";

withFakeApi();
function mount() {
  sessionStorage.setItem("boothwall:passcode", "123456");
  render(<ControlPage />);
  return userEvent.setup();
}
it.each([401, 403, 429])(
  "locks and clears protected photos after a %s response",
  async (status) => {
    const user = mount();
    await screen.findByText("Photo 1");
    api.mockImplementation((input, init) =>
      init?.method === "POST"
        ? Promise.resolve(Response.json({ error: { code: "ACCESS_DENIED" } }, { status }))
        : handleApi(input, init),
    );
    loadOriginals();
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByLabelText("Passcode")).toBeTruthy();
    expect(screen.queryByText("Photo 1")).toBeNull();
    expect(sessionStorage.getItem("boothwall:passcode")).toBeNull();
    expect(screen.getByRole("alert").textContent).toMatch(
      status === 429 ? /Too many/ : /Wrong passcode/,
    );
  },
);
it("preserves the visible queue on refresh failure and reloads after retry", async () => {
  const user = mount();
  await screen.findByText("Photo 1");
  api.mockImplementation((input, init) =>
    new URL(String(input)).pathname === "/photos/pending"
      ? Promise.reject(new TypeError("offline"))
      : handleApi(input, init),
  );
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByText("Photo 1")).toBeTruthy();
  expect(sessionStorage.getItem("boothwall:passcode")).toBe("123456");
  api.mockImplementation(handleApi);
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(screen.getByText("Photo 1")).toBeTruthy();
});
it("keeps loaded approved pages when polling resumes", async () => {
  api.mockImplementation((input, init) => {
    const url = new URL(String(input));
    if (url.pathname !== "/photos/manage") return handleApi(input, init);
    return Promise.resolve(
      Response.json(
        url.searchParams.has("cursor")
          ? { photos: [photo(4)], nextCursor: null }
          : { photos: [photo(2)], nextCursor: "next-page" },
      ),
    );
  });
  const user = mount();
  await screen.findByText("Photo 1");
  await user.click(screen.getByRole("tab", { name: /On the wall/ }));
  await user.click(screen.getByRole("button", { name: "Load more photos" }));
  expect(await screen.findByText("Photo 4")).toBeTruthy();
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(screen.getByText("Photo 4")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Load more photos" })).toBeNull();
});
