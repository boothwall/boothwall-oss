import { LazyWallPreview } from "@boothwall/event-ui/wall-preview";
import type { ComponentProps } from "react";

import { appConfig } from "@/config";
import { StandaloneEvent } from "@/platform/event";
export function WallFrame(props: ComponentProps<typeof LazyWallPreview>) {
  return (
    <StandaloneEvent demo={props.demo} wall>
      <LazyWallPreview look={appConfig.wallLook} {...props} />
    </StandaloneEvent>
  );
}

export type WallFrameProps = ComponentProps<typeof LazyWallPreview>;
