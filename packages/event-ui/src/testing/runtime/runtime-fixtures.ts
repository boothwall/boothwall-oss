import { DEFAULT_SETTINGS } from "@boothwall/shared";

import { createEventTransport, type EventRuntime } from "#runtime";
export function createRuntimeFixture(wallId = "a"): EventRuntime {
  return {
    scopeKey: `api:${wallId}:control:user`,
    transport: createEventTransport({ apiBaseUrl: "https://api.example.test", wallId }),
    links: {
      wall: "/",
      snap: "/snap",
      recap: "/recap",
      control: "/control",
    },
    wall: { target: { wallId }, apiBaseUrl: "https://api.example.test" },
    defaults: DEFAULT_SETTINGS,
    presentation: {
      sourceUrl: "https://example.test",
      sourceLabel: "Source",
      showSourceOnWall: false,
      showSourceOnGuest: true,
    },
    retentionDays: 30,
    demo: false,
  };
}
export const photoFixture = {
  id: "p1",
  status: "approved" as const,
  caption: "Friends",
  tribe: "guests",
  imageUrl: "https://images.example.test/p1?sig=a",
  thumbUrl: "https://images.example.test/t1?sig=a",
  createdAt: "2026-10-13T00:00:00Z",
};
