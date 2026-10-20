import { compileMessage } from "@lingui/message-utils/compileMessage";
import { expect, it } from "vitest";

import { createI18n } from "./catalogue.utils.ts";
import { messageTree } from "./message-tree.utils.ts";

type Values = {
  "capture.title": Record<never, never>;
  "capture.errors.DECODE": Record<never, never>;
  "capture.consent": { days: number };
  "wall.hello": Record<never, never>;
};

it("nests the value-free messages under a prefix and leaves out the rest", () => {
  const i18n = createI18n();
  const source = {
    "capture.title": "Ab auf die Wall.",
    "capture.errors.DECODE": "Das Foto konnte nicht gelesen werden.",
    "capture.consent": "Nach {days} Tagen gelöscht.",
    "wall.hello": "Hallo",
  };
  i18n.loadAndActivate({
    locale: "de",
    messages: Object.fromEntries(Object.entries(source).map(([id, m]) => [id, compileMessage(m)])),
  });
  const tree = messageTree<Values, "capture">(i18n, "capture");
  expect(tree).toEqual({
    title: "Ab auf die Wall.",
    errors: { DECODE: "Das Foto konnte nicht gelesen werden." },
  });
  // @ts-expect-error messages that need values are not in the tree
  expect(tree.consent).toBeUndefined();
});
