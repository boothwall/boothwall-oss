import { Button, cn, PhotoImage, type PhotoImagePhase } from "@boothwall/web-ui";

import { controlCopy, FOCUS_LIFT } from "@/features/control/constants";

const copy = controlCopy.original;

/**
 * The photo a host decides on: the original the wall shows. Never the guest's thumbnail, which
 * the phone makes and nothing ties to the original. `attempt` remounts it for another try.
 */
export function OriginalPhoto({
  src,
  alt,
  attempt = 0,
  fit = "contain",
  className,
  onPhaseChange,
}: {
  src: string;
  alt: string;
  attempt?: number;
  fit?: "contain" | "cover";
  className?: string;
  onPhaseChange: (phase: PhotoImagePhase) => void;
}) {
  return (
    <PhotoImage
      key={attempt}
      src={src}
      alt={alt}
      fit={fit}
      className={cn("rounded-control bg-canvas", className)}
      onPhaseChange={onPhaseChange}
    />
  );
}

/** Says whether Approve can be used yet; a failed original offers another try. */
export function OriginalNote({
  phase,
  onRetry,
}: {
  phase: PhotoImagePhase | undefined;
  onRetry: () => void;
}) {
  if (phase === "failed")
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2">
        <p className="text-label">{copy.failed}</p>
        <Button variant="secondary" size="sm" className={FOCUS_LIFT} onClick={onRetry}>
          {copy.retry}
        </Button>
      </div>
    );
  return (
    <p className={cn("text-label text-ink-muted", phase === "loaded" && "max-lg:hidden")}>
      {phase === "loaded" ? copy.loaded : copy.waits}
    </p>
  );
}
