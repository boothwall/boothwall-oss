/**
 * zValidator hook: hand a failed parse to the app's error handler, which answers with the
 * shared VALIDATION_FAILED shape instead of Hono's default.
 */
export const rethrow = (result: { success: boolean; error?: unknown }) => {
  if (!result.success) throw result.error;
};
