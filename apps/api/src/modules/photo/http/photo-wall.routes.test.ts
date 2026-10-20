import { describe, expect, it, vi } from "vitest";

import { sha256Hex } from "@/core/security/crypto";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { row } from "@/modules/photo/domain/photo.fixtures";

import { errorCode, ID, mockRouteDefaults, request } from "./photo.routes.fixtures";

mockRouteDefaults();

const TOKEN = "guest-delete-token";
const status = (token?: string) =>
  request(`/photos/${ID}/status`, {
    passcode: "",
    headers: token === undefined ? {} : { "x-delete-token": token },
  });

describe("GET /photos/:id/status", () => {
  it("tells the sender whether their photo is waiting, live or declined", async () => {
    const deleteTokenHash = await sha256Hex(TOKEN);
    const removedAt = new Date("2026-10-19T12:00:00.000Z");
    const findById = vi.spyOn(photoRepo, "findById");
    for (const [stored, state] of [
      [{ status: "pending", approvedAt: null }, "waiting"],
      [{ status: "approved" }, "live"],
      [{ status: "hidden" }, "declined"],
      [{ status: "pending", removedAt }, "declined"],
      [{ status: "approved", removedAt }, "declined"],
    ] as const) {
      findById.mockResolvedValue(row({ ...stored, deleteTokenHash }));
      const res = await status(TOKEN);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ state });
    }
  });

  it("refuses a missing or wrong token like a guest delete, without the photo's state", async () => {
    vi.spyOn(photoRepo, "findById").mockResolvedValue(
      row({ status: "hidden", deleteTokenHash: await sha256Hex(TOKEN) }),
    );
    for (const token of [undefined, "", "someone-elses-token"]) {
      const res = await status(token);
      expect(res.status).toBe(403);
      const body = await res.text();
      expect(JSON.parse(body).error.code).toBe("PHOTO_STATUS_FORBIDDEN");
      expect(body).not.toMatch(/hidden|declined|state/);
    }
  });

  it("answers an unknown or malformed id as not found or invalid", async () => {
    vi.spyOn(photoRepo, "findById").mockResolvedValue(undefined);
    const missing = await status(TOKEN);
    expect(missing.status).toBe(404);
    expect(await errorCode(missing)).toBe("PHOTO_NOT_FOUND");
    expect((await request("/photos/not-a-uuid/status", { passcode: "" })).status).toBe(400);
  });
});
