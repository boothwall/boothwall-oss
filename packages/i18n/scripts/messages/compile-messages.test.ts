import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { activateLanguage, createI18n } from "#catalogue";

import { compileMessages } from "./compile-messages.ts";

function workspace(files: Record<string, object | string>) {
  const root = mkdtempSync(join(tmpdir(), "boothwall-messages-"));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, "messages", path)), { recursive: true });
    writeFileSync(
      join(root, "messages", path),
      typeof body === "string" ? body : JSON.stringify(body),
    );
  }
  return { root, sourceDir: join(root, "messages"), outDir: join(root, "generated") };
}

const PHOTOS = "{count, plural, one {# photo} other {# photos}}";

describe("compileMessages", () => {
  it("compiles catalogues into typed, lazily loaded modules that check as up to date", async () => {
    const dirs = workspace({
      "en/guest.json": { "guest.photos": PHOTOS, "guest.title": "Your wall" },
      "hr/guest.json": {
        "guest.photos":
          "{count, plural, one {# fotografija} few {# fotografije} other {# fotografija}}",
        "guest.title": "Tvoj zid",
      },
      "en/wall.json": { "wall.hello": "Hello, {name}" },
    });
    expect(compileMessages(dirs)).toEqual({
      problems: [],
      written: [
        "en/guest.ts",
        "values/guest.ts",
        "en/wall.ts",
        "values/wall.ts",
        "hr/guest.ts",
        "message-values.ts",
        "index.ts",
      ],
    });
    const read = (path: string) => readFileSync(join(dirs.outDir, path), "utf8");
    expect(read("values/guest.ts")).toContain(
      '"guest.photos": { count: number };\n  "guest.title": Record<never, never>;',
    );
    expect(read("values/wall.ts")).toContain('"wall.hello": { name: string | number };');
    expect(read("message-values.ts")).toContain("export type MessageValues = Guest & Wall;");
    expect(compileMessages({ ...dirs, check: true }).problems).toEqual([]);

    // The architecture gate forbids computed imports, so read the generated modules' data.
    const generated = (path: string) => async () => ({
      messages: JSON.parse(
        readFileSync(join(dirs.outDir, path), "utf8").match(/= (\{.*\});$/m)![1]!,
      ),
    });
    const i18n = createI18n();
    await activateLanguage(i18n, "hr", {
      guest: { hr: generated("hr/guest.ts") },
      wall: { en: generated("en/wall.ts") },
    });
    expect(i18n._("guest.photos", { count: 3 })).toBe("3 fotografije");
    expect(i18n._("wall.hello", { name: "Iva" })).toBe("Hello, Iva");
  });

  it("refuses incomplete or inconsistent translations and writes nothing", () => {
    const dirs = workspace({
      "en/guest.json": { "guest.photos": PHOTOS, "guest.title": "Your wall" },
      "de/guest.json": { "guest.photos": "{n} Fotos", "guest.extra": "Mehr" },
      "es/guest.json": { "guest.photos": "{count, plural, one {# foto}", "guest.title": "Tu muro" },
      "es/extra.json": { "extra.title": "Más" },
      "fr/guest.json": {},
      "en/wall.json": { "guest.hello": "Hi" },
    });
    expect(compileMessages(dirs)).toEqual({
      written: [],
      problems: [
        'en/wall.json: "guest.hello" must start with "wall."',
        'de/guest.json: missing "guest.title"',
        'de/guest.json: "guest.photos" uses {n}, English uses {count}',
        'de/guest.json: "guest.extra" is not in English (stale or misspelt)',
        "es/extra.json: no English extra.json",
        expect.stringMatching(/^es\/guest\.json: "guest\.photos" is not valid ICU/),
        'es/guest.json: missing "guest.photos"',
        "fr/: not a supported language",
      ],
    });
  });

  it("reports stale generated files instead of deleting them", () => {
    const dirs = workspace({ "en/guest.json": { "guest.title": "Your wall" } });
    compileMessages(dirs);
    mkdirSync(join(dirs.outDir, "de"), { recursive: true });
    writeFileSync(join(dirs.outDir, "de/guest.ts"), "old");
    writeFileSync(join(dirs.sourceDir, "en/guest.json"), JSON.stringify({ "guest.title": "Wall" }));
    expect(compileMessages({ ...dirs, check: true }).problems).toEqual([
      expect.stringMatching(/generated\/en\/guest\.ts: out of date/),
      `${join(dirs.outDir, "de/guest.ts")}: no longer generated; remove it`,
    ]);
  });
});
