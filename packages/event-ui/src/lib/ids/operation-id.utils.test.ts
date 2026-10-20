import { describe, expect, it } from "vitest";

import { newOperationId } from "./operation-id.utils";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newOperationId", () => {
  it("uses randomUUID where the context provides it", () => {
    const api = { randomUUID: () => "11111111-1111-4111-8111-111111111111" } as unknown as Crypto;
    expect(newOperationId(api)).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("builds a v4 UUID from getRandomValues on an insecure origin", () => {
    const api = {
      getRandomValues: (bytes: Uint8Array) => globalThis.crypto.getRandomValues(bytes),
    } as unknown as Crypto;
    const ids = new Set(Array.from({ length: 50 }, () => newOperationId(api)));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });
});
