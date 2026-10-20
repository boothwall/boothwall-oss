import { createContext } from "react";

import type { EventRuntime } from "../types";
export const EventContext = createContext<EventRuntime | null>(null);
