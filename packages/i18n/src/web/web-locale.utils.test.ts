import { describe, expect, it } from "vitest";

import { storedPreference, urlLanguage } from "./web-locale.utils.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  } as unknown as Storage & { data: Map<string, string> };
}

describe("web adapter", () => {
  it("reads the URL's language without trusting it", () => {
    expect(urlLanguage("?lang=hr&x=1")).toBe("hr");
    expect(urlLanguage("")).toBeNull();
  });

  it("remembers a valid choice and reads anything else as automatic", () => {
    const storage = memoryStorage({ bad: "klingon" });
    const store = storedPreference("boothwall:prefs:v1", storage);
    expect(store.read()).toBeNull();
    store.write("de");
    expect(store.read()).toBe("de");
    store.write(null);
    expect(storage.data.has("boothwall:prefs:v1")).toBe(false);
    expect(storedPreference("bad", storage).read()).toBeNull();
  });
});
