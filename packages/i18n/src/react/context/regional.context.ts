import { createContext } from "react";

import type { Formatters } from "#format";
import type { Language } from "#languages";

export type Regional = { language: Language; formatters: Formatters };

export const RegionalContext = createContext<Regional | null>(null);
