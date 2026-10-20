import { DEFAULT_SETTINGS, type PhotoDTO, type WallSettings } from "@boothwall/shared";
import { act, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

export const photo = (n: number, overrides: Partial<PhotoDTO> = {}): PhotoDTO => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  status: "approved",
  caption: `Photo ${n}`,
  tribe: "fire-tv",
  imageUrl: `https://api.test/photos/p${n}/image`,
  thumbUrl: `https://api.test/photos/p${n}/thumb`,
  createdAt: "2026-10-07T12:00:00.000Z",
  ...overrides,
});
export const state: { settings: WallSettings; pending: PhotoDTO[]; approved: PhotoDTO[] } = {
  settings: DEFAULT_SETTINGS,
  pending: [],
  approved: [],
};
export async function handleApi(input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(String(input));
  if (url.pathname === "/photos/pending") return Response.json({ photos: state.pending });
  if (url.pathname === "/photos/stats")
    return Response.json({
      onWall: state.approved.length,
      pending: state.pending.length,
      hidden: 0,
      uploadsToday: state.approved.length + state.pending.length,
      byTribe: {},
    });
  if (url.pathname === "/settings") return Response.json({ settings: state.settings });
  if (url.pathname === "/settings/runtime" && init?.method === "PATCH") {
    state.settings = { ...state.settings, ...JSON.parse(String(init.body)) };
    return Response.json({ settings: state.settings });
  }
  if (url.pathname === "/photos/manage")
    return Response.json({ photos: state.approved, nextCursor: null });
  const id = url.pathname.split("/")[2];
  if (url.pathname.endsWith("/approve") && init?.method === "POST") {
    const candidate = state.pending.find((p) => p.id === id);
    if (!candidate) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const approved = { ...candidate, status: "approved" as const };
    state.pending = state.pending.filter((p) => p.id !== id);
    state.approved = [approved, ...state.approved];
    return Response.json({ photo: approved });
  }
  if (init?.method === "DELETE") {
    state.pending = state.pending.filter((p) => p.id !== id);
    state.approved = state.approved.filter((p) => p.id !== id);
    return new Response(null, { status: 204 });
  }
  return Response.json({ error: { code: "ROUTE_NOT_FOUND" } }, { status: 404 });
}
export const api = vi.fn(handleApi);
export function withFakeApi() {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.hash = "";
    state.settings = { ...DEFAULT_SETTINGS };
    state.pending = [photo(1, { status: "pending" })];
    state.approved = [photo(2), photo(3)];
    api.mockReset().mockImplementation(handleApi);
    vi.stubGlobal("fetch", api);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    api.mockClear();
  });
}

/** jsdom never loads images, and Approve waits for each original: loads every image shown. */
export function loadOriginals() {
  act(() => {
    for (const image of document.querySelectorAll("img")) fireEvent.load(image);
  });
}
