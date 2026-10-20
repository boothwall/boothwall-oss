import { afterEach, expect, it, vi } from "vitest";

import { createEventTransport } from "#runtime";

import { createControlClient } from "./control.client";
afterEach(() => vi.unstubAllGlobals());
const photo = {
  id: "photo-1",
  status: "pending",
  caption: null,
  tribe: "guests",
  imageUrl: "https://images.example.test/one?sig=secret",
  thumbUrl: "https://images.example.test/thumb?sig=secret",
  createdAt: "2026-10-13T00:00:00Z",
  analysis: {
    verdict: "flagged",
    flags: ["violence"],
    issues: [],
    suggestedTribe: null,
    suggestedCaption: null,
    highlight: null,
    analysedAt: "2026-10-13T00:00:00Z",
  },
};
it("preserves analysis and signed assets while validating pending data", async () => {
  const client = createControlClient(
    createEventTransport({ apiBaseUrl: "https://api.example.test" }),
  );
  vi.stubGlobal("fetch", async () => Response.json({ photos: [photo] }));
  expect((await client.fetchPending())[0]).toEqual(photo);
  vi.stubGlobal("fetch", async () =>
    Response.json({ photos: [{ ...photo, analysis: { verdict: "invalid" } }] }),
  );
  await expect(client.fetchPending()).rejects.toThrow();
});

it("scopes queue decisions to their captured wall and encodes photo IDs", async () => {
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (url: URL, options: RequestInit) => {
    requests.push(new Request(url, options));
    return options.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({ photo: { ...photo, status: "approved" } });
  });
  const client = createControlClient(
    createEventTransport({ apiBaseUrl: "https://api.example.test", wallId: "a" }),
  );
  await client.approvePhoto("id/with?special");
  await client.removePhoto("id/with?special");
  expect(requests.map((r) => [r.method, r.url])).toEqual([
    ["POST", "https://api.example.test/photos/id%2Fwith%3Fspecial/approve?wall=a"],
    ["DELETE", "https://api.example.test/photos/id%2Fwith%3Fspecial?wall=a"],
  ]);
});

it("reads only approved photos with an encoded cursor through protected control access", async () => {
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (url: URL, options: RequestInit) => {
    requests.push(new Request(url, options));
    return Response.json({ photos: [{ ...photo, status: "approved" }], nextCursor: null });
  });
  const client = createControlClient(
    createEventTransport({
      apiBaseUrl: "https://api.example.test",
      getPasscode: () => "test",
    }),
  );
  expect((await client.fetchApproved("cursor/one")).photos[0]?.status).toBe("approved");
  expect(new URL(requests[0]!.url).searchParams.get("status")).toBe("approved");
  expect(new URL(requests[0]!.url).searchParams.get("cursor")).toBe("cursor/one");
  expect(requests[0]!.headers.get("authorization")).toBe("Bearer test");
});
