import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { seedCategory, seedLocalWall, seedStatusMessage } from "./seed.mjs";

afterEach(() => mock.restoreAll());

test("seeds a standalone wall with explicit host approval and no provider checks", async () => {
  const settings = {
    autoApprove: false,
    categories: [{ id: "guests", label: "Guests", catchAll: true }],
    smartModeration: { enabled: false, autoApproveSafe: false, holdFlagged: true },
  };
  const approved = [];
  let uploaded = 0;
  mock.method(globalThis, "fetch", async (url, init = {}) => {
    if (url.endsWith("/photos/stats")) {
      assert.equal(init.headers.authorization, "Bearer fixture-token");
      return Response.json({ onWall: 0, pending: 0, hidden: 0 });
    }
    if (url.endsWith("/photos?limit=1")) return Response.json({ stats: { total: 0 }, settings });
    if (url.endsWith("/settings")) throw new Error("Configured presentation is not mutable");
    if (url.endsWith("/photos")) {
      assert.equal(settings.smartModeration.enabled, false);
      uploaded += 1;
      return Response.json({ photo: { id: `seed-${uploaded}` } });
    }
    approved.push(url);
    assert.ok(init.headers.authorization);
    return Response.json({});
  });
  assert.deepEqual(await seedLocalWall("https://local.test", "fixture-token"), { seeded: 12 });
  assert.equal(uploaded, 12);
  assert.equal(approved.length, 12);
});

test("leaves a populated standalone wall untouched", async () => {
  mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "https://local.test/photos/stats");
    assert.equal(init.headers.authorization, "Bearer fixture-token");
    return Response.json({ onWall: 3, pending: 0, hidden: 0 });
  });
  assert.deepEqual(await seedLocalWall("https://local.test", "fixture-token"), { seeded: 0 });
  assert.equal(fetch.mock.callCount(), 1);
});

test("does not mutate legacy review settings or upload before an explicit migration decision", async () => {
  mock.method(globalThis, "fetch", async (url) =>
    url.endsWith("/photos/stats")
      ? Response.json({ onWall: 0, pending: 0, hidden: 0 })
      : Response.json({
          stats: { total: 0 },
          settings: {
            categories: [{ id: "guests", label: "Guests" }],
            smartModeration: { enabled: true, autoApproveSafe: true, holdFlagged: true },
          },
        }),
  );
  await assert.rejects(
    seedLocalWall("https://local.test", "fixture-token"),
    /legacy review.*migration/i,
  );
  assert.equal(fetch.mock.callCount(), 2);
});

test("demo status keeps pending recovery guidance visible instead of claiming samples were seeded", () => {
  const notice = "Pending or hidden photos remain; review them in Control.";
  assert.equal(seedStatusMessage({ seeded: 0, notice }), notice);
  assert.equal(seedStatusMessage({ seeded: 0 }), "The wall already has photos");
  assert.equal(seedStatusMessage({ seeded: 12 }), "12 demo photos on the wall");
});

test("keeps known categories and spreads unknown ones over the wall's named categories", () => {
  const missions = [
    { id: "speaker", label: "Selfie with a speaker" },
    { id: "booth", label: "Best booth find" },
    { id: "visiting", label: "Just visiting", catchAll: true },
  ];
  assert.equal(seedCategory("booth", 0, missions), "booth");
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => seedCategory("team", index, missions)),
    ["speaker", "booth", "speaker", "booth"],
  );
  assert.equal(seedCategory("team", 5, [{ id: "all", label: "All", catchAll: true }]), "all");
});
