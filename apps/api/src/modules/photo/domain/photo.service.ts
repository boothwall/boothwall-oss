import { photoQueryService } from "./photo-query.service";
import { photoReviewService } from "./photo-review.service";
import { photoUploadService } from "./photo-upload.service";

/**
 * The photo module's one service, as the routes, the moderation module and the jobs see it.
 * Each part lives in its own file: reading (query), deciding (review) and arriving (upload).
 */
export const photoService = {
  ...photoQueryService,
  ...photoReviewService,
  ...photoUploadService,
};
