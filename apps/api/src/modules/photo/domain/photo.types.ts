import type {
  ControlPhotoDTO,
  GuestPhotoStatusDTO,
  PhotoDTO,
  PhotoPageDTO,
  PhotoSort,
  PhotoStatsDTO,
  PhotoStatus,
  Tribe,
  UploadResultDTO,
  WallEvent,
  WallId,
  WallSnapshotDTO,
} from "@boothwall/shared";

import type { AnalysisReader } from "@/contracts/runtime";
import type { Db } from "@/db/client";

import type { UploadLifecycle } from "./upload-lifecycle";

export type {
  ControlPhotoDTO,
  GuestPhotoStatusDTO,
  PhotoDTO,
  PhotoPageDTO,
  PhotoStatsDTO,
  UploadResultDTO,
  WallSnapshotDTO,
};

/** Pushes realtime events to connected walls (implemented by the wall module). */
export type WallBroadcaster = {
  broadcast(event: WallEvent): Promise<void>;
};

/** Per-request collaborators; built from Worker bindings in the routes. */
export type PhotoDeps = {
  uploadLifecycle?: UploadLifecycle;
  fingerprintKey?: string;
  db: Db;
  /** The wall this request is for; every read and write is scoped to it. */
  wallId: WallId;
  bucket: R2Bucket;
  wall: WallBroadcaster;
  /** Media URL base for the requesting HTTP surface. */
  origin: string;
  /** Shared realtime media base; defaults to HTTP origin for a standalone API. */
  sharedEventOrigin?: string;
  /** Secret that signs links to images still waiting for approval. */
  signingKey: string;
  /** Verdicts for Control panel views; without it, they show none. */
  analyses?: AnalysisReader;
  now?: () => Date;
};

export type UploadPhotoArgs = {
  /** Trusted route source. Multipart fields never choose this value. */
  channel?: "guest" | "control";
  operationId?: string;
  image: File;
  /** Optional small copy for wall cards; checked like the image. */
  thumb?: File;
  caption: string | null;
  tribe: Tribe;
  clientIp: string;
  policy: UploadPolicy;
};

/** What the live settings allow for a new upload. */
export type UploadPolicy = {
  /** Skip the approval queue: the photo goes straight to the wall. */
  autoApprove: boolean;
  uploadsOpen?: boolean;
  /** The categories a visitor can pick right now. */
  categoryIds: readonly string[];
};

export type RemovePhotoArgs = {
  id: string;
  deleteToken?: string;
  isAdmin: boolean;
};

/** Which stored copy an image request wants. */
export type ImageVariant = "image" | "thumb";

/** Where the previous page of the Control panel's list ended. */
export type PhotoCursor = {
  /** Category position in the live list; only used by the "category" sort. */
  rank: number;
  createdAt: number;
  id: string;
};

export type PhotoListFilter = {
  status?: PhotoStatus;
  tribe?: Tribe;
  q?: string;
  sort: PhotoSort;
  cursor?: PhotoCursor;
  limit: number;
  /** Category ids in picker order, for the "category" sort. */
  categoryOrder: readonly string[];
};

export type ListPhotosArgs = Omit<PhotoListFilter, "cursor"> & {
  /** Opaque cursor from the previous page. */
  cursor?: string;
};

export type UpdatePhotoArgs = {
  caption?: string | null;
  tribe?: Tribe;
  /** true takes the photo off the wall; false puts a hidden one back. */
  hidden?: boolean;
  /** true exempts the photo from retention. */
  keep?: boolean;
};
