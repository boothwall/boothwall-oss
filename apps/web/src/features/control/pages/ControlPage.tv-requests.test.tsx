import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ControlPage } from "./ControlPage";
import { api, handleApi, withFakeApi } from "./ControlPage.fixtures";

withFakeApi();

function recordTvRequests() {
  const sent: unknown[] = [];
  api.mockImplementation((input, init) => {
    if (String(input).endsWith("/wall/remote") && init?.method === "POST") {
      sent.push(JSON.parse(String(init.body)));
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return handleApi(input, init);
  });
  sessionStorage.setItem("boothwall:passcode", "123456");
  render(<ControlPage />);
  return sent;
}

it.each([
  ["Photo call", "photocall"],
  ["Remote help", "hints"],
  ["Next theme", "theme"],
])("%s asks the wall and says so once it's sent", async (button, command) => {
  const sent = recordTvRequests();
  const user = userEvent.setup();

  await user.click(await screen.findByRole("button", { name: button }));

  expect(await screen.findByText("Sent to the wall")).toBeTruthy();
  expect(sent).toEqual([{ command }]);
});
