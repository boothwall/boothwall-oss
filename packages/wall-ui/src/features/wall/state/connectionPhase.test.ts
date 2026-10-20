import { connectionPhase, isShowingStale } from "./connectionPhase";

describe("connectionPhase", () => {
  it("walks connecting → loading → ready on a clean start", () => {
    expect(connectionPhase("connecting", false)).toBe("connecting");
    expect(connectionPhase("live", false)).toBe("loading");
    expect(connectionPhase("live", true)).toBe("ready");
  });

  it("fails while nothing has loaded yet", () => {
    expect(connectionPhase("offline", false)).toBe("failed");
  });

  it("stays ready after the first load, even when the socket drops", () => {
    expect(connectionPhase("offline", true)).toBe("ready");
    expect(connectionPhase("simulated", false)).toBe("ready");
  });
});

describe("isShowingStale", () => {
  it("flags a wall running on saved or pre-drop photos, never a fresh or demo one", () => {
    expect(isShowingStale("connecting", true, false)).toBe(true); // restored from the cache
    expect(isShowingStale("offline", true, true)).toBe(true); // the link dropped
    expect(isShowingStale("live", true, true)).toBe(false);
    expect(isShowingStale("connecting", false, false)).toBe(false); // nothing to show yet
    expect(isShowingStale("simulated", false, false)).toBe(false);
  });
});
