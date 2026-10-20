import { afterEach, expect, it } from "vitest";

import { photoControlFixture } from "@/app/testing/photo-control.fixture";
import { UPLOAD_LIMITS } from "@/modules/photo/domain/upload-limits";

const limits = structuredClone(UPLOAD_LIMITS);
afterEach(() => Object.assign(UPLOAD_LIMITS, structuredClone(limits)));

it("requires admin before parsing even an invalid control upload body", async () => {
  const f = await photoControlFixture();
  try {
    const response = await f.request(
      "/photos/control",
      { method: "POST", body: "not multipart" },
      false,
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "ADMIN_REQUIRED" } });
    expect(f.objects.size).toBe(0);
    expect(f.sqlite.prepare("SELECT count(*) AS n FROM photos").get()).toEqual({ n: 0 });
  } finally {
    f.close();
  }
});

it("uses the ordinary pipeline for control photos without trusting multipart source or actor fields", async () => {
  const f = await photoControlFixture();
  try {
    const response = await f.send(true, "wall-a", {
      channel: "guest-web",
      actor: "someone-else",
      role: "owner",
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      photo: { id: string; status: string };
    };
    expect(body.photo.status).toBe("pending");
    // A control uploader has current admin authority, not a lasting guest deletion capability.
    expect(body).not.toHaveProperty("deleteToken");
    expect(f.objects.size).toBe(1);
    expect(
      f.sqlite.prepare("SELECT client_fingerprint FROM photos WHERE id=?").get(body.photo.id),
    ).toMatchObject({ client_fingerprint: expect.stringMatching(/^control:/) });
    expect(JSON.stringify(body)).not.toMatch(/someone-else|guest-web|actor|client_fingerprint/);
  } finally {
    f.close();
  }
});

it("keeps61control uploads off venue guest burst and legacy counters across walls", async () => {
  const f = await photoControlFixture();
  try {
    for (let i = 0; i < 61; i++)
      expect((await f.send(true, i % 2 ? "wall-a" : "wall-b")).status).toBe(201);
    for (let i = 0; i < 60; i++) expect((await f.send(false)).status).toBe(201);
    const refused = await f.send(false, "wall-b", { channel: "control" });
    expect(refused.status).toBe(429);
    expect(await refused.json()).toMatchObject({ error: { code: "PHOTO_RATE_LIMITED" } });
    expect(f.sqlite.prepare("SELECT count(*) AS n FROM photos").get()).toEqual({ n: 121 });
  } finally {
    f.close();
  }
});

it.each(["pending", "daily"])(
  "keeps the shared wall %s cap for control and guest photos",
  async (cap) => {
    const f = await photoControlFixture();
    try {
      if (cap === "pending") UPLOAD_LIMITS.maxPending = 2;
      else UPLOAD_LIMITS.globalDaily = 2;
      expect((await f.send(true)).status).toBe(201);
      expect((await f.send(false)).status).toBe(201);
      const refused = await f.send(true);
      expect(refused.status).toBe(503);
      expect(await refused.json()).toMatchObject({ error: { code: "PHOTO_WALL_BUSY" } });
      expect(f.objects.size).toBe(2);
    } finally {
      f.close();
    }
  },
);

it.each(["paused", "ended"])(
  "refuses a fresh control upload when the wall is %s",
  async (state) => {
    const f = await photoControlFixture();
    try {
      const settings = {
        ...f.settings,
        uploadsOpen: state !== "paused",
        eventEnded: state === "ended",
      };
      expect(
        (
          await f.request("/settings?wall=wall-a", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(settings),
          })
        ).status,
      ).toBe(200);
      if (state === "ended")
        expect((await f.request("/event/end?wall=wall-a", { method: "POST" })).status).toBe(200);
      const response = await f.send(true);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: "PHOTO_UPLOADS_CLOSED" } });
      expect(f.objects.size).toBe(0);
    } finally {
      f.close();
    }
  },
);

it("follows auto approval and broadcasts the same public photo event", async () => {
  const f = await photoControlFixture();
  try {
    await f.request("/settings?wall=wall-a", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f.settings, autoApprove: true }),
    });
    const response = await f.send(true);
    expect(response.status).toBe(201);
    const body = (await response.json()) as { photo: { id: string; status: string } };
    expect(body.photo.status).toBe("approved");
    expect(f.events).toContainEqual(
      expect.objectContaining({
        type: "photo.created",
        photo: expect.objectContaining({ id: body.photo.id }),
      }),
    );
    expect(JSON.stringify(f.events)).not.toMatch(/actor|client_fingerprint|control:/);
  } finally {
    f.close();
  }
});
