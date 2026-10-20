import { useCallback, useEffect, useState } from "react";

import { appPath } from "@/config";

import { CONTROL_TAB_PATHS, CONTROL_TABS, type ControlTab } from "../constants";

/** The tab this address names; Review for /control and anything unknown. */
export function tabOf(pathname: string): ControlTab {
  const path = pathname.toLowerCase().replace(/\/+$/, "");
  return (
    CONTROL_TABS.find((tab) => appPath(CONTROL_TAB_PATHS[tab]).replace(/\/+$/, "") === path) ??
    "review"
  );
}

/** The phone tab, kept in the address: Back steps through tabs and a reload stays on the tab. */
export function useControlTab() {
  const [tab, setTab] = useState(() => tabOf(window.location.pathname));
  useEffect(() => {
    const onPop = () => setTab(tabOf(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const open = useCallback((next: ControlTab) => {
    if (tabOf(window.location.pathname) === next) return;
    history.pushState(null, "", `${appPath(CONTROL_TAB_PATHS[next])}${window.location.search}`);
    setTab(next);
    window.scrollTo({ top: 0 });
  }, []);
  return { tab, open };
}
