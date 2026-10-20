import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { seedLocalWall } from "./seed.mjs";

afterEach(() => mock.restoreAll());

function wallFixture(rows = [], failure = "approval") {
  let shouldFail = true;
  const settings = {
    categories: [{ id: "guests", label: "Guests", catchAll: true }],
    smartModeration: { enabled: false },
  };
  const mutations = [];
  mock.method(globalThis, "fetch", async (url, init = {}) => {
    if (url.endsWith("/photos/stats")) {
      assert.equal(init.headers.authorization, "Bearer fixture-passcode");
      return Response.json({
        onWall: rows.filter((row) => row.status === "approved").length,
        pending: rows.filter((row) => row.status === "pending").length,
        hidden: rows.filter((row) => row.status === "hidden").length,
      });
    }
    if (url.endsWith("/photos?limit=1"))
      return Response.json({
        stats: { total: rows.filter((row) => row.status === "approved").length },
        settings,
      });
    mutations.push(url);
    if (url.endsWith("/photos")) {
      const photo = { id: `seed-${rows.length + 1}`, status: "pending" };
      rows.push(photo);
      if (failure === "upload-response" && shouldFail) {
        shouldFail = false;
        throw Error("Response lost after accepted upload");
      }
      return Response.json({ photo }, { status: 201 });
    }
    if (url.endsWith("/approve")) {
      if (failure === "approval" && shouldFail) {
        shouldFail = false;
        return new Response("unavailable", { status: 503 });
      }
      rows.find((row) => row.id === url.split("/").at(-2)).status = "approved";
      return Response.json({});
    }
    throw Error(`Unexpected fixture request ${url}`);
  });
  return { rows, mutations };
}

for (const failure of ["approval", "upload-response"]) {
  test(`restart after ${failure} does not create or approve another sample cohort`, async () => {
    const fixture = wallFixture([], failure);
    await assert.rejects(seedLocalWall("https://local.test", "fixture-passcode"), /503|lost/);
    const count = failure === "approval" ? 12 : 1;
    assert.equal(fixture.rows.length, count);
    fixture.mutations.length = 0;
    const result = await seedLocalWall("https://local.test", "fixture-passcode");
    assert.equal(result.seeded, 0);
    assert.match(result.notice, /pending or hidden.*Control/i);
    assert.equal(fixture.rows.length, count);
    assert.equal(fixture.rows.filter((row) => row.status === "pending").length, count);
    assert.deepEqual(fixture.mutations, []);
  });
}

test("existing pending and hidden photos are left untouched without guessing sample ownership", async () => {
  const fixture = wallFixture([
    { id: "host-photo", status: "hidden" },
    { id: "guest-photo", status: "pending" },
  ]);
  const result = await seedLocalWall("https://local.test", "fixture-passcode");
  assert.equal(result.seeded, 0);
  assert.match(result.notice, /pending or hidden.*Control/i);
  assert.deepEqual(fixture.mutations, []);
});

test("uncertain, unauthorized or malformed occupancy cannot admit sample uploads", async () => {
  for (const response of [
    () => new Response("denied", { status: 401 }),
    () => new Response("unavailable", { status: 503 }),
    () => Response.json({ onWall: 0, pending: "0", hidden: 0 }),
    () => Response.json({ onWall: 0, pending: 0, hidden: -1 }),
    () => Response.json({ onWall: 0, pending: 0 }),
  ]) {
    mock.restoreAll();
    const requests = [];
    mock.method(globalThis, "fetch", async (url) => {
      requests.push(url);
      return response();
    });
    await assert.rejects(seedLocalWall("https://local.test", "fixture-passcode"));
    assert.deepEqual(requests, ["https://local.test/photos/stats"]);
  }
});
