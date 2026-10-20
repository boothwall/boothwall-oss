import { createHash } from "node:crypto";

import { expect, it, vi } from "vitest";

import { boothwallConfig } from "../boothwall.config.ts";
import { boothwallConfigSchema } from "../schema/boothwall-config.schemas.ts";
import {
  prepareSettingsApplication,
  type SettingsApplicationInput,
} from "./settings-application.utils.ts";
import { previewSettingsMigration } from "./settings-migration.utils.ts";

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const prepare = (input: SettingsApplicationInput) => prepareSettingsApplication(input, sha256);

it("prepares migration without browser crypto or text encoder globals", async () => {
  const originalConfig = boothwallConfigSchema.parse(boothwallConfig);
  const stored = JSON.stringify({ announcement: "Grüße 🎉", uploadsOpen: false });
  const reviewedPreview = previewSettingsMigration(originalConfig, stored);
  vi.stubGlobal("crypto", undefined);
  vi.stubGlobal("TextEncoder", undefined);
  try {
    const plan = await prepareSettingsApplication(
      {
        originalConfig,
        currentConfig: { ...originalConfig, ...reviewedPreview.configPatch },
        stored,
        reviewedPreview,
        sources: {
          configuredSha256: sha256(JSON.stringify(originalConfig)),
          storedSha256: sha256(stored),
        },
      },
      sha256,
    );
    expect(plan.record.migration?.originalStored).toBe(stored);
    expect(plan.record.runtimeState.uploadsOpen).toBe(false);
  } finally {
    vi.unstubAllGlobals();
  }
});

it("applies only the reviewed original identities and exact target patch, retaining original data and runtime", async () => {
  const originalConfig = boothwallConfigSchema.parse(boothwallConfig);
  const stored =
    '{ "announcement":"Welcome", "showWhoIsHere":false, "uploadsOpen":false, "playbackPaused":true }';
  const reviewedPreview = previewSettingsMigration(originalConfig, stored);
  const currentConfig = { ...originalConfig, ...reviewedPreview.configPatch };
  const input = {
    originalConfig,
    currentConfig,
    stored,
    reviewedPreview,
    sources: {
      configuredSha256: await sha256(JSON.stringify(originalConfig)),
      storedSha256: await sha256(stored),
    },
  };
  const application = await prepare(input);
  expect(application.expectedStored).toBe(stored);
  expect(application.record).toMatchObject({
    kind: "configured-runtime",
    runtimeState: {
      playbackPaused: true,
      uploadsOpen: false,
      eventEnded: false,
    },
    migration: { originalStored: stored, ...input.sources },
  });
  await expect(prepare({ ...input, stored: stored + " " })).rejects.toThrow(/source/i);
  await expect(
    prepare({
      ...input,
      currentConfig: {
        ...currentConfig,
        categories: [{ id: "replacement", label: "Changed" }],
      },
    }),
  ).rejects.toThrow(/target/i);
});

it("requires explicit decisions for unsupported review policy and a retained ended event", async () => {
  const originalConfig = boothwallConfigSchema.parse(boothwallConfig);
  const stored = JSON.stringify({
    eventEnded: true,
    uploadsOpen: true,
    smartModeration: { enabled: true, autoApproveSafe: true, holdFlagged: true },
  });
  const reviewedPreview = previewSettingsMigration(originalConfig, stored);
  const currentConfig = {
    ...originalConfig,
    ...reviewedPreview.configPatch,
    settings: {
      ...reviewedPreview.configPatch.settings,
      smartModeration: {
        ...reviewedPreview.configPatch.settings.smartModeration,
        enabled: false,
        autoApproveSafe: false,
      },
    },
  };
  const input = {
    originalConfig,
    currentConfig,
    stored,
    reviewedPreview,
    sources: {
      configuredSha256: await sha256(JSON.stringify(originalConfig)),
      storedSha256: await sha256(stored),
    },
  };
  await expect(prepare(input)).rejects.toThrow(/decision/i);
  const result = await prepare({
    ...input,
    decisions: {
      retainEnded: true,
      disableLegacyReview: true,
    },
  });
  expect(result.record.runtimeState).toMatchObject({ eventEnded: true, uploadsOpen: true });
  expect(result.record.migration?.originalStored).toBe(stored);
  expect(result.record.migration?.decisions).toEqual({
    retainEnded: true,
    disableLegacyReview: true,
  });
});
