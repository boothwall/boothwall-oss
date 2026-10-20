import { reportFullyDrawnOnce } from "./fullyDrawn";

it("marks the app fully drawn once, when the feed first goes live", () => {
  const reportFullyDrawn = jest.fn();
  Object.defineProperty(globalThis, "performance", {
    value: { reportFullyDrawn },
    configurable: true,
  });
  reportFullyDrawnOnce("connecting");
  expect(reportFullyDrawn).not.toHaveBeenCalled();
  reportFullyDrawnOnce("live");
  reportFullyDrawnOnce("offline");
  reportFullyDrawnOnce("live");
  expect(reportFullyDrawn).toHaveBeenCalledTimes(1);
});
