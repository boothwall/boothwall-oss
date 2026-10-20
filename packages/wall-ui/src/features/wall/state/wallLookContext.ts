import type { WallLook } from "@boothwall/shared";
import { createContext } from "react";

/**
 * The wall's optional looks. Classic unless the host passes its own (`look` on WallScreen); the
 * open edition's apps pass `wall` from boothwall.config.ts.
 */
export const WallLookContext = createContext<WallLook>({});
