import type { PhotoAnalysisDTO, PhotoDTO, WallSettings } from "@boothwall/shared";

/** Optional, host-owned annotations for authenticated control views. */
export type AnalysisReader = {
  forPhotos(photoIds: readonly string[]): Promise<ReadonlyMap<string, PhotoAnalysisDTO>>;
};

export type PhotoUploadPlan = {
  approveNow: boolean;
  /** Best-effort observation after fresh persistence, never part of upload admission. */
  observe?: (input: { photo: PhotoDTO; thumb?: File }) => Promise<void>;
};

export type PhotoWorkflow = {
  planUpload(input: { settings: WallSettings; hasThumb: boolean }): PhotoUploadPlan;
  analyses?: AnalysisReader;
};
