import { compileMessage } from "@lingui/message-utils/compileMessage";
import { describe, expect, it } from "vitest";

import { activateLanguage, createI18n, createTranslator } from "./catalogue.utils.ts";

const compiled = (source: Record<string, string>) => ({
  messages: Object.fromEntries(Object.entries(source).map(([id, m]) => [id, compileMessage(m)])),
});

const loaders = {
  guest: {
    en: async () => compiled({ "guest.photos": "{count, plural, one {# photo} other {# photos}}" }),
    hr: async () =>
      compiled({
        "guest.photos":
          "{count, plural, one {# fotografija} few {# fotografije} other {# fotografija}}",
      }),
  },
  wall: { en: async () => compiled({ "wall.hello": "Hello, {name}" }) },
};

type Values = { "guest.photos": { count: number }; "wall.hello": { name: string } };

describe("catalogues", () => {
  it("loads a language's areas and renders compiled messages with its plural rules", async () => {
    const i18n = createI18n();
    await activateLanguage(i18n, "hr", loaders);
    const t = createTranslator<Values>(i18n);
    expect(t("guest.photos", { count: 22 })).toBe("22 fotografije");
    // hr has no wall area yet: English fills the gap instead of a bare id.
    expect(t("wall.hello", { name: "Iva" })).toBe("Hello, Iva");
    expect(i18n.locale).toBe("hr");
  });

  it("keeps instances apart", async () => {
    const [a, b] = [createI18n(), createI18n()];
    await activateLanguage(a, "en", loaders, ["guest"]);
    await activateLanguage(b, "hr", loaders, ["guest"]);
    expect(a._("guest.photos", { count: 1 })).toBe("1 photo");
    expect(b._("guest.photos", { count: 1 })).toBe("1 fotografija");
  });

  it("fails loudly for an area nobody wrote", async () => {
    await expect(activateLanguage(createI18n(), "de", loaders, ["extra"])).rejects.toThrow(
      'No catalogue for area "extra"',
    );
  });
});
