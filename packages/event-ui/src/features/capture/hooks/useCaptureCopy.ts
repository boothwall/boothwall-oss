import { createTranslator, type MessageTree, messageTree } from "@boothwall/i18n";
import type { MessageValues } from "@boothwall/i18n/messages/index";

import { guestI18n, type Locale, useLocale } from "#i18n";
import { useEventRuntime } from "#runtime";

/** The upload page's words that need no values; the words live in @boothwall/i18n `capture`. */
export type CaptureCopy = MessageTree<MessageValues, "capture">;

export type CaptureErrorKey = keyof CaptureCopy["errors"];

const trees = new Map<Locale, CaptureCopy>();

/** The upload page's fixed words in one language. */
export function captureCopy(locale: Locale): CaptureCopy {
  let tree = trees.get(locale);
  if (!tree)
    trees.set(locale, (tree = messageTree<MessageValues, "capture">(guestI18n(locale), "capture")));
  return tree;
}

/** The upload page's copy in the visitor's language, with when this wall's photos expire. */
export function useCaptureCopy(): CaptureCopy & { consent: string } {
  const locale = useLocale();
  const copy = captureCopy(locale);
  const t = createTranslator<MessageValues>(guestI18n(locale));
  const { retentionDays, retention } = useEventRuntime();
  // Only an absent field is the standalone app; null is a wall whose window isn't known.
  if (retention === undefined)
    return { ...copy, consent: t("capture.consent", { days: String(retentionDays) }) };
  const days = String(retention?.days);
  const when = !retention
    ? copy.retention.unknown
    : retention.anchor === "upload"
      ? t("capture.retention.upload", { days })
      : retention.expiresAt
        ? t("capture.retention.by", {
            date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
              new Date(retention.expiresAt),
            ),
          })
        : t("capture.retention.eventEnd", { days });
  return {
    ...copy,
    consent: [copy.consentShown, when, copy.retention.sooner, copy.retention.copies].join(" "),
  };
}
