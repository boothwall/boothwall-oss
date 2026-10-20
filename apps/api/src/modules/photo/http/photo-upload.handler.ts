import { PHOTO_LIMITS } from "@boothwall/shared";
import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";

import { badRequest, serviceUnavailable } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { clientIp } from "@/core/http/request-ip";
import { created } from "@/core/http/response";
import { photoTooLarge, photoUploadsClosed } from "@/modules/photo/domain/photo.errors";
import { photoService } from "@/modules/photo/domain/photo.service";
import { settingsService } from "@/modules/settings";

import { depsFrom } from "./photo.deps";
import { uploadFieldsSchema } from "./photo.schemas";

/** Same bounded multipart ingestion on guest and authenticated control routes. */
export const photoUploadLimit = bodyLimit({
  maxSize: PHOTO_LIMITS.maxBytes + PHOTO_LIMITS.thumbMaxBytes + 16 * 1024,
  onError: () => {
    throw photoTooLarge({ bytes: -1, maxBytes: PHOTO_LIMITS.maxBytes });
  },
});

/** Channel is selected by the mounted route, never from form fields or headers. */
export function photoUploadHandler(channel: "guest" | "control") {
  return async (c: Context<AppEnv>) => {
    if (!c.req.header("content-type")?.startsWith("multipart/form-data")) {
      throw badRequest("PHOTO_MULTIPART_REQUIRED");
    }
    // Closed uploads are refused before the body is read.
    const deps = depsFrom(c);
    const settings = await settingsService.get(deps.db, deps.wallId, c.get("settingsAuthority"));
    const uploadsOpen = settings.uploadsOpen && !settings.eventEnded;
    if (!uploadsOpen && !c.req.header("idempotency-key")) throw photoUploadsClosed();
    const form = await c.req.formData();
    const image = form.get("image");
    if (!(image instanceof File)) throw badRequest("PHOTO_IMAGE_REQUIRED");
    const thumb = form.get("thumb");
    if (thumb !== null && !(thumb instanceof File)) throw badRequest("PHOTO_THUMB_INVALID");
    const fields = uploadFieldsSchema.parse(Object.fromEntries(form));
    const workflow = c.get("photoWorkflow");
    if (!workflow && settings.smartModeration.enabled) {
      throw serviceUnavailable(
        "PHOTO_REVIEW_UNAVAILABLE",
        {
          setting: "smartModeration.enabled",
          requiredValue: false,
          guidance:
            "Disable the unsupported legacy smartModeration.enabled setting to resume uploads.",
        },
        "photo.reviewUnavailable",
      );
    }
    const plan = workflow?.planUpload({ settings, hasThumb: thumb !== null }) ?? {
      approveNow: settings.autoApprove,
    };
    const operationId = c.req.header("idempotency-key");
    if (operationId && !/^[a-zA-Z0-9_-]{16,128}$/.test(operationId))
      throw badRequest("UPLOAD_OPERATION_INVALID");
    const result = await photoService.upload(deps, {
      operationId,
      channel,
      image,
      thumb: thumb ?? undefined,
      caption: fields.caption,
      tribe: fields.tribe,
      clientIp: clientIp(c),
      policy: {
        autoApprove: plan.approveNow,
        uploadsOpen,
        categoryIds: settings.categories.map((category) => category.id),
      },
    });
    // Transitional best-effort observation; durable completion is a host responsibility.
    if (!result.replayed && plan.observe) {
      const observe = plan.observe;
      c.executionCtx.waitUntil(
        Promise.resolve()
          .then(() => observe({ photo: result.photo, thumb: thumb ?? undefined }))
          .catch(() => {
            console.error("photo observation failed", result.photo.id);
          }),
      );
    }
    return created(
      c,
      channel === "control"
        ? { photo: result.photo }
        : { photo: result.photo, deleteToken: result.deleteToken },
    );
  };
}
