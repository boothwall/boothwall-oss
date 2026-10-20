import { describe, expect, it } from "vitest";

import { parseReactionCounts } from "./reaction.counts";

describe("parseReactionCounts", () => {
  it("fills every reaction, zero when nobody tapped it", () => {
    expect(parseReactionCounts('{"heart":3}')).toEqual({ heart: 3, fire: 0, laugh: 0, clap: 0 });
  });

  it("drops unknown reactions and malformed values", () => {
    expect(parseReactionCounts('{"heart":-1,"fire":"2","laugh":1.5,"wave":4,"clap":2}')).toEqual({
      heart: 0,
      fire: 0,
      laugh: 0,
      clap: 2,
    });
    expect(parseReactionCounts("not json")).toEqual({ heart: 0, fire: 0, laugh: 0, clap: 0 });
    expect(parseReactionCounts(null)).toEqual({ heart: 0, fire: 0, laugh: 0, clap: 0 });
  });
});
