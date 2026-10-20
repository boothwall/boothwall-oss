import { z } from "zod";

export const reactionParamSchema = z.object({ id: z.uuid() });
