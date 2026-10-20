import { useEventRuntime } from "@boothwall/event-ui/runtime";
import { lazy, Suspense } from "react";

/** Loaded with the preview, so the wall stays out of the Control and guest entry bundles. */
const WallFrame = lazy(() =>
  import("@/features/wall").then(({ WallFrame }) => ({ default: WallFrame })),
);

/** The preview must not take the desk's arrow keys and Enter, so it hears no remote at all. */
const useNoRemote = () => {};

const FRAME = "aspect-video w-full rounded-tile";

/** The wall as the display draws it right now: the same page, live, at the TV's proportions. */
export function WallPreview() {
  const { demo } = useEventRuntime();
  return (
    <div className="rounded-card border border-line bg-canvas p-2 shadow-paper">
      <Suspense fallback={<div className={FRAME} />}>
        <WallFrame demo={demo} useRemoteInput={useNoRemote} className={FRAME} />
      </Suspense>
    </div>
  );
}
