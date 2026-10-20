import { afterEach, expect, it, vi } from "vitest";

import { createEventTransport } from "#runtime";
import { photoFixture } from "#testing/runtime";

import { createCaptureClient } from "./capture.client";
afterEach(() => vi.unstubAllGlobals());
it.each([undefined, "selected"])("uploads and deletes anonymously for wall %s", async (wallId) => {
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (url: URL, options: RequestInit) => {
    requests.push(new Request(url, options));
    return options.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({ photo: photoFixture, deleteToken: "own-token" });
  });
  const client = createCaptureClient(
    createEventTransport({
      apiBaseUrl: "https://api.example.test",
      wallId,
      getPasscode: () => "host-secret",
    }),
  );
  const result = await client.uploadPhoto({
    image: new Blob(["image"]),
    thumb: new Blob(["thumb"]),
    caption: "Hello",
    tribe: "guests",
  });
  await client.removeOwnPhoto(result.photo.id, result.deleteToken);
  expect(requests.map((r) => r.credentials)).toEqual(["omit", "omit"]);
  expect(requests.every((r) => !r.headers.has("authorization"))).toBe(true);
  expect(requests[1]?.headers.get("x-delete-token")).toBe("own-token");
  expect(new URL(requests[0]!.url).searchParams.get("wall")).toBe(wallId ?? null);
  const body = await requests[0]!.text();
  for (const name of ["image", "thumb", "caption", "tribe", "consent"])
    expect(body).toContain(`name="${name}"`);
  expect(body).toContain('name="consent"\r\n\r\ntrue');
});
it("reuses the operation identity for the same draft retry and changes it for a new payload", async () => {
  const identities: (string | null)[] = [];
  vi.stubGlobal("fetch", async (_url: URL, options: RequestInit) => {
    identities.push(new Headers(options.headers).get("idempotency-key"));
    if (identities.length === 1) throw new Error("lost response");
    return Response.json({ photo: photoFixture, deleteToken: "receipt" });
  });
  const client = createCaptureClient(createEventTransport({ apiBaseUrl: "https://api.test" }));
  const args = {
    image: new Blob(["photo"]),
    thumb: new Blob(["thumb"]),
    caption: "Hello",
    tribe: "guests",
  };
  await expect(client.uploadPhoto(args)).rejects.toThrow();
  await client.uploadPhoto(args);
  await client.uploadPhoto({ ...args, caption: "Changed" });
  expect(identities[0]).toBeTruthy();
  expect(identities[1]).toBe(identities[0]);
  expect(identities[2]).not.toBe(identities[0]);
});
