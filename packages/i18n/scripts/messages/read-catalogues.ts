import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type CompiledMessage, compileMessageOrThrow } from "@lingui/message-utils/compileMessage";

import { DEFAULT_LANGUAGE, isLanguage, type Language } from "#languages";

/** An argument's TypeScript type, from how the English message uses it. */
export type ArgumentType = "number" | "string" | "date" | "any";

export type Catalogue = {
  language: Language;
  area: string;
  messages: Record<string, CompiledMessage>;
  /** Per message id: argument name → type. */
  args: Record<string, Record<string, ArgumentType>>;
};

const AREA = /^[a-z][a-z0-9-]*$/;

const typeOf = (type: string | undefined): ArgumentType =>
  type === "plural" || type === "selectordinal" || type === "number"
    ? "number"
    : type === "select"
      ? "string"
      : type === "date" || type === "time"
        ? "date"
        : "any";

function collectArgs(message: CompiledMessage, into: Record<string, ArgumentType>) {
  for (const token of message) {
    if (typeof token === "string") continue;
    const [name, type, format] = token;
    if (!into[name] || into[name] === "any") into[name] = typeOf(type);
    if (format && typeof format === "object")
      for (const [key, choice] of Object.entries(format))
        if (key !== "offset" && Array.isArray(choice)) collectArgs(choice as CompiledMessage, into);
  }
  return into;
}

function readCatalogue(path: string, language: Language, area: string, problems: string[]) {
  const where = `${language}/${area}.json`;
  let source: unknown;
  try {
    source = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    problems.push(`${where}: not valid JSON (${(error as Error).message})`);
    return null;
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    problems.push(`${where}: must be an object of id → message`);
    return null;
  }
  const catalogue: Catalogue = { language, area, messages: {}, args: {} };
  for (const [id, text] of Object.entries(source)) {
    if (!id.startsWith(`${area}.`)) problems.push(`${where}: "${id}" must start with "${area}."`);
    if (typeof text !== "string" || !text.trim()) {
      problems.push(`${where}: "${id}" is empty or not text`);
      continue;
    }
    try {
      catalogue.messages[id] = compileMessageOrThrow(text);
      catalogue.args[id] = collectArgs(catalogue.messages[id], {});
    } catch (error) {
      problems.push(`${where}: "${id}" is not valid ICU (${(error as Error).message})`);
    }
  }
  return catalogue;
}

function compareWithEnglish(english: Catalogue, other: Catalogue, problems: string[]) {
  const where = `${other.language}/${other.area}.json`;
  for (const id of Object.keys(english.messages))
    if (!(id in other.messages)) problems.push(`${where}: missing "${id}"`);
  for (const id of Object.keys(other.messages)) {
    if (!(id in english.messages)) {
      problems.push(`${where}: "${id}" is not in English (stale or misspelt)`);
      continue;
    }
    const want = Object.keys(english.args[id] ?? {})
      .sort()
      .join(", ");
    const got = Object.keys(other.args[id] ?? {})
      .sort()
      .join(", ");
    if (want !== got) problems.push(`${where}: "${id}" uses {${got}}, English uses {${want}}`);
  }
}

/**
 * Reads `<dir>/<language>/<area>.json`. English is the source of truth: every other language
 * may leave out whole areas (English fills in at runtime) but never ids or arguments inside one.
 */
export function readCatalogues(dir: string) {
  const problems: string[] = [];
  const catalogues: Catalogue[] = [];
  const languages = existsSync(dir)
    ? readdirSync(dir)
        .filter((n) => !n.startsWith("."))
        .sort()
    : [];
  if (!languages.includes(DEFAULT_LANGUAGE))
    problems.push(`${dir}: no "${DEFAULT_LANGUAGE}" folder`);
  const english = new Map<string, Catalogue>();
  const ordered = [DEFAULT_LANGUAGE, ...languages.filter((n) => n !== DEFAULT_LANGUAGE)];
  for (const language of ordered) {
    if (!languages.includes(language)) continue;
    if (!isLanguage(language)) {
      problems.push(`${language}/: not a supported language`);
      continue;
    }
    for (const file of readdirSync(join(dir, language)).sort()) {
      const area = file.replace(/\.json$/, "");
      if (!file.endsWith(".json") || !AREA.test(area)) {
        problems.push(`${language}/${file}: expected <area>.json in kebab-case`);
        continue;
      }
      const catalogue = readCatalogue(join(dir, language, file), language, area, problems);
      if (!catalogue) continue;
      if (language === DEFAULT_LANGUAGE) english.set(area, catalogue);
      else if (!english.has(area)) problems.push(`${language}/${file}: no English ${file}`);
      else compareWithEnglish(english.get(area)!, catalogue, problems);
      catalogues.push(catalogue);
    }
  }
  return { catalogues, problems };
}
