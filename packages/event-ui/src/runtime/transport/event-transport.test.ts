import { afterEach, describe, expect, it, vi } from "vitest";

import { createEventTransport } from "./event-transport";

afterEach(() => vi.unstubAllGlobals());

function captureRequest() {
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (url: string | URL, options: RequestInit) => {
    requests.push(new Request(url, options));
    return new Response("{}", { status: 200 });
  });
  return requests;
}

describe("event transport", () => {
  it("preserves multipart payload and delete token while forcing one selected wall", async () => {
    const requests = captureRequest();
    const body = new FormData();
    body.set("caption", "Hello");
    const transport = createEventTransport({
      apiBaseUrl: "https://api.example.test",
      wallId: "wall-a",
    });
    await transport.request("/photos?wall=wrong&wall=other&limit=24", {
      access: "public",
      method: "POST",
      body,
      headers: { "x-delete-token": "mine" },
    });
    const request = requests[0]!;
    expect(request.url).toBe("https://api.example.test/photos?wall=wall-a&limit=24");
    expect(request.headers.get("content-type")).toContain("multipart/form-data; boundary=");
    expect(request.headers.get("x-delete-token")).toBe("mine");
    expect(await request.text()).toContain('name="caption"\r\n\r\nHello');
  });

  it("never forwards caller authorization or cookies to public requests", async () => {
    const requests = captureRequest();
    const transport = createEventTransport({
      apiBaseUrl: "https://api.example.test",
      getPasscode: () => "secret",
    });
    await transport.request("/settings", {
      access: "public",
      credentials: "include",
      headers: { authorization: "Bearer accidental" },
    });
    expect(requests[0]!.credentials).toBe("omit");
    expect(requests[0]!.headers.has("authorization")).toBe(false);
    await transport.request("/photos/pending", { access: "control" });
    expect(requests[1]!.headers.get("authorization")).toBe("Bearer secret");
    expect(requests[1]!.credentials).toBe("omit");
  });

  it("uses account cookies only for protected scoped calls without a bearer", async () => {
    const requests = captureRequest();
    const transport = createEventTransport({
      apiBaseUrl: "https://api.example.test",
      wallId: "wall-b",
    });
    await transport.request("/photos/pending", {
      access: "control",
      headers: { authorization: "Bearer accidental" },
    });
    expect(requests[0]!.credentials).toBe("include");
    expect(requests[0]!.headers.has("authorization")).toBe(false);
    await transport.request("/settings", { access: "public" });
    expect(requests[1]!.credentials).toBe("omit");
  });

  it("rejects absolute, protocol-relative and backslash endpoints", async () => {
    const transport = createEventTransport({ apiBaseUrl: "https://api.example.test" });
    for (const path of [
      "https://asset.example.test/photo?sig=signed",
      "//other.test/photos",
      "/\\other.test/photos",
    ]) {
      await expect(transport.request(path, { access: "control" })).rejects.toThrow(TypeError);
    }
  });

  it("scopes socket tickets and rejects missing control tickets", () => {
    const transport = createEventTransport({
      apiBaseUrl: "https://api.example.test",
      wallId: "wall-a",
    });
    expect(transport.socketUrl("public")).toBe("wss://api.example.test/wall/live?wall=wall-a");
    expect(transport.socketUrl("control", "ticket+value")).toBe(
      "wss://api.example.test/wall/control?wall=wall-a&ticket=ticket%2Bvalue",
    );
    expect(() => transport.socketUrl("control")).toThrow();
  });

  it("preserves abort and network failures and parses only valid error codes", async () => {
    const controller = new AbortController();
    const transport = createEventTransport({ apiBaseUrl: "https://api.example.test" });
    vi.stubGlobal("fetch", async (_url: URL, options: RequestInit) => {
      expect(options.signal).toBe(controller.signal);
      throw new DOMException("Cancelled", "AbortError");
    });
    await expect(
      transport.request("/settings", { access: "public", signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ error: { code: "FULL" } }), { status: 429 }),
    );
    await expect(transport.request("/photos", { access: "public" })).rejects.toMatchObject({
      name: "EventApiError",
      status: 429,
      code: "FULL",
    });
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ error: { code: {} } }), { status: 500 }),
    );
    await expect(transport.request("/photos", { access: "public" })).rejects.toMatchObject({
      status: 500,
      code: "HTTP_500",
    });
  });
});

it("retains an API base prefix for HTTP and sockets and blocks traversal", async () => {
  const requests = captureRequest();
  const transport = createEventTransport({
    apiBaseUrl: "https://walls.test/api",
    wallId: "wall-a",
  });
  await transport.request("/photos?limit=24", { access: "public" });
  expect(requests[0]!.url).toBe("https://walls.test/api/photos?limit=24&wall=wall-a");
  expect(transport.socketUrl("public")).toBe("wss://walls.test/api/wall/live?wall=wall-a");
  for (const path of ["/../auth", "/%2e%2e/auth", "/photos/../../auth"])
    await expect(transport.request(path, { access: "public" })).rejects.toThrow(TypeError);
});
