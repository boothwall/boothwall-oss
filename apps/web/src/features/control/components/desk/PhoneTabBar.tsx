import { cn } from "@boothwall/web-ui";
import { Inbox, QrCode, Tv } from "lucide-react";
import type { MouseEvent } from "react";

import { appPath } from "@/config";
import { CONTROL_TAB_PATHS, controlCopy, type ControlTab } from "@/features/control/constants";

import { CountBadge } from "../primitives";

const copy = controlCopy.tabs;
const TABS = [
  { tab: "review", label: copy.review, Icon: Inbox },
  { tab: "live", label: copy.live, Icon: Tv },
  { tab: "guests", label: copy.guests, Icon: QrCode },
] as const;

/** Review, Live and Guests at the foot of a phone; each is a real address. */
export function PhoneTabBar({
  current,
  waiting,
  onOpen,
}: {
  current: ControlTab;
  waiting: number;
  onOpen: (tab: ControlTab) => void;
}) {
  const follow = (tab: ControlTab) => (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(tab);
  };
  return (
    <nav
      aria-label={copy.label}
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-line bg-canvas/90 px-2.5 pt-2 pb-safe-bottom backdrop-blur-md lg:hidden"
    >
      {TABS.map(({ tab, label, Icon }) => (
        <a
          key={tab}
          href={appPath(CONTROL_TAB_PATHS[tab])}
          aria-current={current === tab ? "page" : undefined}
          onClick={follow(tab)}
          className={cn(
            "relative flex flex-col items-center gap-1 rounded-control py-1.5 text-xs font-semibold transition focus-visible:scale-102 focus-visible:bg-surface focus-visible:outline-2 focus-visible:outline-ink active:scale-98",
            current === tab
              ? "text-ink before:absolute before:-top-2.5 before:h-0.75 before:w-9 before:rounded-pill before:bg-primary-text"
              : "text-ink-subtle",
          )}
        >
          <Icon aria-hidden className="size-5" strokeWidth={1.8} />
          {label}
          {tab === "review" && waiting > 0 && (
            <CountBadge count={waiting} className="absolute top-0 left-1/2 ml-1.5" />
          )}
        </a>
      ))}
    </nav>
  );
}
