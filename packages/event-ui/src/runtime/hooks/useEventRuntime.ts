import { useContext } from "react";

import { EventContext } from "../providers";
import type { EventRuntime } from "../types";
export function useEventRuntime(): EventRuntime {
  const runtime = useContext(EventContext);
  if (!runtime) throw new Error("EventProvider is required");
  return runtime;
}
