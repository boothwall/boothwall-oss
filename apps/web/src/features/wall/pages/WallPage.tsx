import { BrowserWallExperience } from "@boothwall/event-ui/wall";

import { appConfig } from "@/config";
import { StandaloneEvent } from "@/platform/event";
export function WallPage() {
  return (
    <StandaloneEvent wall>
      <BrowserWallExperience look={appConfig.wallLook} />
    </StandaloneEvent>
  );
}
