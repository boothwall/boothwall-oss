import { CaptureExperience } from "@boothwall/event-ui/capture";

import { StandaloneEvent } from "@/platform/event";
export function CapturePage() {
  return (
    <StandaloneEvent>
      <CaptureExperience />
    </StandaloneEvent>
  );
}
