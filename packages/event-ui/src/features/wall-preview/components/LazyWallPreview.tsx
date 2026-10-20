import { lazy, Suspense } from "react";

import type { WallFrameProps } from "#features/wall/components/canvas";

const Frame = lazy(() =>
  import("#features/wall/components/canvas").then(({ WallFrame }) => ({ default: WallFrame })),
);
/** Host and guest entry bundles load the native renderer only when this preview mounts. */
export function LazyWallPreview(props: WallFrameProps) {
  return (
    <Suspense fallback={<div className={props.className} />}>
      <Frame {...props} />
    </Suspense>
  );
}
