import type { WallEvent, WallSnapshotDTO } from "@boothwall/shared";

import type { FeedStatus } from "../state/connectionPhase";

/** Applications can supply an authorized feed without changing the shared presentation. */
export type WallDisplayObserver = {
  snapshot(snapshot: WallSnapshotDTO): void;
  event(event: WallEvent): void;
  status(status: FeedStatus): void;
  failure(): void;
  revoked(): void;
};
export type WallDisplaySource = {
  /** Cleanup stops requests/events and releases any resources owned by this subscription. */
  connect(observer: WallDisplayObserver): () => void;
};
