import { z } from "zod";

import { tribeSchema } from "#settings";
import { PHOTO_LIMITS } from "#wall";

/** What the check looks for before a photo reaches a big screen. Any of them flags it. */
export const SAFETY_FLAGS = ["nudity", "violence", "offensive"] as const;

export const safetyFlagSchema = z.enum(SAFETY_FLAGS);

export type SafetyFlag = z.infer<typeof safetyFlagSchema>;

/** Things that make a photo look poor on the wall. Shown as hints; they never hold a photo. */
export const QUALITY_ISSUES = ["blurry", "dark", "empty"] as const;

export const qualityIssueSchema = z.enum(QUALITY_ISSUES);

export type QualityIssue = z.infer<typeof qualityIssueSchema>;

/**
 * "safe": nothing found. "flagged": a person should look first. "unreviewed": the check didn't
 * run or didn't answer in time; the photo is treated as if smart moderation were off.
 */
export const analysisVerdictSchema = z.enum(["safe", "flagged", "unreviewed"]);

export type AnalysisVerdict = z.infer<typeof analysisVerdictSchema>;

/**
 * The smart check's verdict on one photo. Control panel only: of all this, walls and guests only
 * ever see the highlight score of an approved photo (`PhotoDTO.highlight`).
 */
export const photoAnalysisSchema = z.object({
  verdict: analysisVerdictSchema,
  /** Why it was flagged; empty unless the verdict is "flagged". */
  flags: z.array(safetyFlagSchema),
  issues: z.array(qualityIssueSchema),
  /** The live category that fits best, or null when unsure or unreviewed. */
  suggestedTribe: tribeSchema.nullable(),
  /** Only for photos uploaded without a caption. */
  suggestedCaption: z.string().min(1).max(PHOTO_LIMITS.captionMaxLength).nullable(),
  /** 0 to 1: how well the photo would carry the big screen. Null when unreviewed. */
  highlight: z.number().min(0).max(1).nullable(),
  analysedAt: z.iso.datetime(),
});

export type PhotoAnalysisDTO = z.infer<typeof photoAnalysisSchema>;
