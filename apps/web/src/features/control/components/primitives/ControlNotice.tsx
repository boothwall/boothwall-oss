import { useEventRuntime } from "@boothwall/event-ui/runtime";
import { cn } from "@boothwall/web-ui";

/** The deployment's one quiet line (`notice` in boothwall.config.ts), when it has one. */
export function ControlNotice({ className }: { className?: string }) {
  const { notice } = useEventRuntime().presentation;
  if (!notice) return null;
  return <p className={cn("text-label text-ink-subtle", className)}>{notice}</p>;
}
