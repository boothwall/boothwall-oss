/** Every language BoothWall can speak. Each surface offers a subset until its copy is reviewed. */
export const LANGUAGES = ["en", "de", "es", "hr"] as const;

export type Language = (typeof LANGUAGES)[number];

/** The language used when nothing else matches. Its catalogues are the source of truth. */
export const DEFAULT_LANGUAGE: Language = "en";

/** How each language names itself, for switchers; and its writing direction. */
export const LANGUAGE_INFO: Readonly<Record<Language, { endonym: string; dir: "ltr" | "rtl" }>> = {
  en: { endonym: "English", dir: "ltr" },
  de: { endonym: "Deutsch", dir: "ltr" },
  es: { endonym: "Español", dir: "ltr" },
  hr: { endonym: "Hrvatski", dir: "ltr" },
};
