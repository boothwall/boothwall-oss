import type { Language } from "#languages";

export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

/** CLDR operands: integer digits `i`, visible fraction digits `v` and the fraction itself `f`. */
function operands(n: number) {
  const [whole = "0", fraction = ""] = String(Math.abs(n)).split(".");
  return { n: Math.abs(n), i: Number(whole), v: fraction.length, f: Number(fraction || "0") };
}

/** CLDR 46 cardinal rules for the launch languages, for runtimes without `Intl.PluralRules`. */
const FALLBACK: Record<Language, (n: number) => PluralCategory> = {
  en: (n) => (operands(n).i === 1 && operands(n).v === 0 ? "one" : "other"),
  de: (n) => (operands(n).i === 1 && operands(n).v === 0 ? "one" : "other"),
  es: (n) => {
    const { i, v } = operands(n);
    if (n === 1) return "one";
    return v === 0 && i !== 0 && i % 1_000_000 === 0 ? "many" : "other";
  },
  hr: (n) => {
    const { i, v, f } = operands(n);
    const ends = (x: number, one: number[], not: number[]) =>
      one.includes(x % 10) && !not.includes(x % 100);
    if ((v === 0 && ends(i, [1], [11])) || ends(f, [1], [11])) return "one";
    if ((v === 0 && ends(i, [2, 3, 4], [12, 13, 14])) || ends(f, [2, 3, 4], [12, 13, 14]))
      return "few";
    return "other";
  },
};

const rules = new Map<Language, Intl.PluralRules>();

/** The plural form a count takes in a language ("1 Foto", "5 fotografija"). */
export function pluralCategory(
  language: Language,
  n: number,
  intl: Pick<typeof Intl, "PluralRules"> | undefined = globalThis.Intl,
): PluralCategory {
  if (!intl?.PluralRules) return FALLBACK[language](n);
  let rule = rules.get(language);
  if (!rule) rules.set(language, (rule = new intl.PluralRules(language)));
  return rule.select(n);
}
