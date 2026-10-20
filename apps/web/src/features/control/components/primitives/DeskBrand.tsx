import { EVENT } from "@boothwall/shared";
import { cn } from "@boothwall/web-ui";

import logo from "@/assets/brand/logo.png";
import { EVENT_WORDMARK, LOCKUP_NAME } from "@/config";

/**
 * The lockup, and the event's wordmark after a rule when the config has one: the two brands in
 * one bar, as on the guest page. `className` sizes the lockup; the wordmark sits a step smaller.
 */
export function DeskBrand({ className }: { className: string }) {
  if (!EVENT_WORDMARK) return <img src={logo} alt={EVENT.name} className={className} />;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <img src={logo} alt={LOCKUP_NAME} className={cn(className, "min-w-0 shrink")} />
      <span aria-hidden className="w-px self-stretch bg-line" />
      <img
        src={EVENT_WORDMARK}
        alt={EVENT.name}
        className="h-5 w-auto min-w-0 shrink object-contain object-left lg:h-6.5"
      />
    </span>
  );
}
