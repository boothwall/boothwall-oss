import { createEventTransport } from "@boothwall/event-ui/runtime";

export function createStandaloneEventTransport(options: {
  apiBaseUrl: string;
  getPasscode: () => string;
}) {
  return createEventTransport(options);
}
