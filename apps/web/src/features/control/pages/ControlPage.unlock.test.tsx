import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { api, handleApi, withFakeApi } from "./ControlPage.fixtures";

withFakeApi();
const paths = () => api.mock.calls.map(([input]) => new URL(String(input)).pathname);

async function enter(passcode: string) {
  render(<ControlPage />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Passcode"), passcode);
  await user.click(screen.getByRole("button", { name: "Unlock" }));
  return user;
}

it("keeps a wrong passcode on the unlock card without loading the desk", async () => {
  api.mockImplementation((input, init) =>
    new URL(String(input)).pathname === "/photos/stats"
      ? Promise.resolve(Response.json({ error: { code: "ACCESS_DENIED" } }, { status: 401 }))
      : handleApi(input, init),
  );
  await enter("000000");
  expect((await screen.findByRole("alert")).textContent).toMatch(/Wrong passcode/);
  expect(screen.getByLabelText("Passcode")).toBeTruthy();
  expect(paths()).not.toContain("/photos/pending");
  expect(sessionStorage.getItem("boothwall:passcode")).toBeNull();
});

it("opens the desk once the passcode checks out", async () => {
  await enter("123456");
  expect(await screen.findByRole("button", { name: /Lock/ })).toBeTruthy();
  expect(sessionStorage.getItem("boothwall:passcode")).toBe("123456");
});
