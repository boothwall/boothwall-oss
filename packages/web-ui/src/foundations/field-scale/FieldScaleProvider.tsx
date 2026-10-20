import { createContext, type ReactNode, useContext } from "react";

/** How large form fields are drawn: "md" (default) or "lg", larger and roomier for hosts. */
export type FieldScale = "md" | "lg";

const FieldScaleContext = createContext<FieldScale>("md");

/** Sets the field size for everything inside, so an app picks it once at its root. */
export function FieldScaleProvider({
  scale,
  children,
}: {
  scale: FieldScale;
  children: ReactNode;
}) {
  return <FieldScaleContext.Provider value={scale}>{children}</FieldScaleContext.Provider>;
}

export const useFieldScale = () => useContext(FieldScaleContext);

/** The classes each field part uses at each scale, shared by every text field in the kit. */
export const FIELD_STYLES = {
  md: {
    label: "text-sm font-medium",
    input: "h-11 rounded-control px-3.5 text-base sm:text-sm",
    focusRing: "focus:ring-2",
    note: "text-sm",
  },
  lg: {
    label: "text-body font-semibold",
    input: "h-14 rounded-card px-5 text-body",
    focusRing: "focus:ring-4",
    note: "text-ui",
  },
} as const satisfies Record<FieldScale, Record<string, string>>;
