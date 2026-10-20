import { twoLineCaption } from "./captionText";

describe("twoLineCaption", () => {
  it("balances two lines between words and never leaves an emoji or a number alone", () => {
    expect(twoLineCaption("Coffee and a demo ☕")).toBe("Coffee and\na demo ☕");
    expect(twoLineCaption("Couch co-op 🎮")).toBe("Couch\nco-op 🎮");
    expect(twoLineCaption("Thumbs up for D-pad focus")).toBe("Thumbs up for\nD-pad focus");
  });

  it("keeps a caption that has nowhere to break as it is", () => {
    expect(twoLineCaption("Coffee #3")).toBe("Coffee #3");
    expect(twoLineCaption("Hello")).toBe("Hello");
  });
});
