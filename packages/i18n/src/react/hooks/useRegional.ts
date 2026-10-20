import { useContext } from "react";

import type { Formatters } from "#format";
import type { Language } from "#languages";

import { type Regional, RegionalContext } from "../context/regional.context.ts";

function useRegional(): Regional {
  const regional = useContext(RegionalContext);
  if (!regional) throw new Error("Wrap the app in <LanguageProvider>");
  return regional;
}

export const useLanguage = (): Language => useRegional().language;

export const useFormatters = (): Formatters => useRegional().formatters;
