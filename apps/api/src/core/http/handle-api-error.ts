import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

import { ServiceError } from "./errors";
import type { AppEnv } from "./http-context";
import { errorBody } from "./response";

export const handleApiError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof ServiceError) {
    return c.json(errorBody(err.code, err.messageKey, err.details), err.status);
  }
  if (err instanceof ZodError) {
    return c.json(errorBody("VALIDATION_FAILED", "common.validationFailed", err.issues), 400);
  }
  // Hono's own refusals, such as a body that isn't the JSON it claims to be.
  if (err instanceof HTTPException && err.status < 500) {
    return c.json(errorBody("REQUEST_MALFORMED", "common.requestMalformed"), err.status);
  }
  console.error(err);
  return c.json(errorBody("INTERNAL", "common.internal"), 500);
};
