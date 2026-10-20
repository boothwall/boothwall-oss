import type { WallConfiguredSettings, WallRuntimeState } from "#settings";

import type { BoothwallConfig } from "../schema/boothwall-config.schemas.ts";

export interface SettingsMigrationIssue {
  field: string;
  code: "invalid-record" | "invalid-field" | "unknown-field" | "unsupported-policy";
  guidance: string;
}

/** Suggested replacements only; applying them and retiring overrides is an operator action. */
export interface SettingsMigrationPreview {
  schemaVersion: 1;
  ready: boolean;
  configPatch: {
    event: BoothwallConfig["event"];
    categories: BoothwallConfig["categories"];
    settings: Omit<
      WallConfiguredSettings,
      "eventName" | "eventHashtag" | "eventYear" | "categories"
    >;
  };
  runtimeState: WallRuntimeState;
  issues: SettingsMigrationIssue[];
}
