import { expect, it } from "vitest";

import { joinLink } from "./join-link.utils";
it("preserves case-sensitive event paths and query values in printed links", () => {
  const url = "https://events.test/w/MixedCase/snap?invite=AbC";
  expect(joinLink(url, "")).toEqual({
    qrValue: url,
    display: "events.test/w/MixedCase/snap?invite=AbC",
  });
});
