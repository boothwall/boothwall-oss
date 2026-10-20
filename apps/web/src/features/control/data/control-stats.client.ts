import type { EventTransport } from "@boothwall/event-ui/runtime";
import { type PhotoStatsDTO, photoStatsSchema } from "@boothwall/shared";

/** The desk's numbers: on the wall, waiting, and sent since `since` (the booth's midnight). */
export function createStatsClient(transport: EventTransport) {
  return {
    async fetchStats(since: Date): Promise<PhotoStatsDTO> {
      const params = new URLSearchParams({ since: since.toISOString() });
      const response = await transport.request(`/photos/stats?${params}`, { access: "control" });
      return photoStatsSchema.parse(await response.json());
    },
  };
}
