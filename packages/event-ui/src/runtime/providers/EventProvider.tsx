import type { ReactNode } from "react";

import type { EventRuntime } from "../types";
import { EventContext } from "./event-context";
export function EventProvider({
  runtime,
  children,
}: {
  runtime: EventRuntime;
  children: ReactNode;
}) {
  return (
    <EventContext.Provider key={runtime.scopeKey} value={runtime}>
      {children}
    </EventContext.Provider>
  );
}
