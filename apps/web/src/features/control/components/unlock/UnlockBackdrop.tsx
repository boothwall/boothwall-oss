import { cn } from "@boothwall/web-ui";

const BLOCK = "rounded-card bg-ink/15";

/**
 * The desk's outline, blurred: tiles, the queue with a photo, the switches and the TV. Drawn,
 * not captured, because no photo or number may load before the passcode.
 */
export function UnlockBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 scale-104 blur-lg brightness-45 saturate-80"
    >
      <div className="flex h-16 items-center gap-4 border-b border-line px-7">
        <span className="h-7 w-36 rounded-tile bg-ink/40" />
        <span className="h-6 w-24 rounded-tile bg-ink/20 max-lg:hidden" />
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-12 lg:gap-6 lg:p-7">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="grid grid-cols-3 gap-3">
            <span className={cn(BLOCK, "h-20")} />
            <span className={cn(BLOCK, "h-20")} />
            <span className={cn(BLOCK, "h-20")} />
          </div>
          <div className={cn(BLOCK, "grid gap-5 p-5 lg:grid-cols-2")}>
            <span className="aspect-square rounded-control bg-primary/70" />
            <div className="flex flex-col justify-end gap-3">
              <span className="h-6 w-2/3 rounded-tile bg-ink/50" />
              <span className="h-12 rounded-pill bg-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <span className={cn(BLOCK, "h-24")} />
            <span className={cn(BLOCK, "h-24")} />
          </div>
          <span className={cn(BLOCK, "h-48")} />
        </div>
        <div className="flex flex-col gap-4 max-lg:hidden lg:col-span-5">
          <span className="aspect-video rounded-card bg-secondary/50" />
          <div className="grid grid-cols-2 gap-3">
            <span className="h-16 rounded-card bg-success/50" />
            <span className="h-16 rounded-card bg-success/50" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <span className="h-36 rounded-card bg-primary/40" />
            <span className={cn(BLOCK, "h-36")} />
            <span className={cn(BLOCK, "h-36")} />
          </div>
          <span className={cn(BLOCK, "h-36")} />
        </div>
      </div>
    </div>
  );
}
