import { compileMessage } from "@lingui/message-utils/compileMessage";
import { Trans, useLingui } from "@lingui/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { activateLanguage, createI18n } from "#catalogue";

import { useFormatters, useLanguage } from "../hooks/useRegional.ts";
import { LanguageProvider } from "./LanguageProvider.tsx";

const loaders = {
  guest: {
    de: async () => ({
      messages: {
        "guest.amount": compileMessage("Betrag: {amount}"),
        "guest.help": compileMessage("Fragen? Lies die <0>Hilfe</0>."),
      },
    }),
  },
};

function Probe() {
  const language = useLanguage();
  const { money } = useFormatters();
  const { _ } = useLingui();
  return (
    <p lang={language}>
      {_("guest.amount", { amount: money(1234, "EUR") })}{" "}
      <Trans id="guest.help" components={{ 0: <a href="/help" /> }} />
    </p>
  );
}

describe("LanguageProvider", () => {
  it("gives the tree its language, formatters and messages, with markup kept safe", async () => {
    const i18n = createI18n();
    await activateLanguage(i18n, "de", loaders);
    const html = renderToStaticMarkup(
      <LanguageProvider i18n={i18n} language="de" locale="de-AT" timeZone="Europe/Vienna">
        <Probe />
      </LanguageProvider>,
    );
    expect(html).toBe(
      '<p lang="de">Betrag: € 12,34 Fragen? Lies die <a href="/help">Hilfe</a>.</p>',
    );
  });

  it("names the missing provider instead of failing obscurely", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow("Wrap the app in <LanguageProvider>");
  });
});
