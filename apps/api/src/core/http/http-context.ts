import type { WallId } from "@boothwall/shared";

import type { AppConfig } from "@/config/env";
import type {
  PhotoWorkflow,
  SettingsAuthority,
  SettingsValidator,
  UploadLifecycle,
} from "@/contracts/runtime";
import type { AppBindings } from "@/core/runtime/bindings";

export type AppVariables = {
  settingsAuthority: SettingsAuthority;
  mediaBaseUrl?: string;
  sharedEventMediaBaseUrl?: string;
  roomGeneration?: number;
  validateSettings?: SettingsValidator;
  uploadLifecycle?: UploadLifecycle;
  photoWorkflow?: PhotoWorkflow;
  requestId: string;
  config: AppConfig;
  /** The wall this request is for, set by the wall context middleware. */
  wallId: WallId;
};

export type AppEnv = { Bindings: AppBindings; Variables: AppVariables };
