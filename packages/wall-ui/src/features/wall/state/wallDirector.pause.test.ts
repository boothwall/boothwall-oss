import { initialDirectorState, wallDirector } from "./wallDirector";

describe("desired playback pause", () => {
  it("sets a desired state without restarting an already matching countdown", () => {
    const playing = { ...initialDirectorState, selectedId: "photo", cycle: 4 };
    expect(wallDirector(playing, { type: "setPaused", paused: false })).toBe(playing);
    const paused = wallDirector(playing, { type: "setPaused", paused: true });
    expect(paused).toEqual({ ...playing, paused: true, cycle: 5 });
    expect(wallDirector(paused, { type: "setPaused", paused: true })).toBe(paused);
    expect(wallDirector(paused, { type: "setPaused", paused: false })).toEqual({
      ...playing,
      cycle: 6,
    });
  });

  it("allows legacy toggles and reapplies the same authoritative desired state afterwards", () => {
    const paused = { ...initialDirectorState, paused: true };
    const local = wallDirector(paused, { type: "togglePause" });
    expect(local.paused).toBe(false);
    const reconciled = wallDirector(local, { type: "setPaused", paused: true });
    expect(reconciled).toEqual({ ...paused, cycle: 2 });
  });
});
