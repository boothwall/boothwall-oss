import { z } from "zod";

/** A category id, stored with every photo ("tribe" is the wire name). */
export const tribeSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,31}$/, "category ids are lowercase, digits and dashes");

export type Tribe = z.infer<typeof tribeSchema>;

export const CATEGORY_LIMITS = { max: 8, labelMaxLength: 24 } as const;

export const categorySchema = z.object({
  id: tribeSchema,
  label: z.string().trim().min(1).max(CATEGORY_LIMITS.labelMaxLength),
  /** "Just visiting": not printed on cards, kept apart from the battle bars. At most one. */
  catchAll: z.boolean().optional(),
});

export type Category = z.infer<typeof categorySchema>;

/** What visitors pick from, in order. Standalone category identities come from configuration. */
export const categoriesSchema = z
  .array(categorySchema)
  .min(1)
  .max(CATEGORY_LIMITS.max)
  .superRefine((categories, ctx) => {
    const ids = categories.map((category) => category.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "category ids must be unique" });
    }
    if (categories.filter((category) => category.catchAll).length > 1) {
      ctx.addIssue({ code: "custom", message: "only one catch-all category" });
    }
  });

/** The category's name, for lists and pickers; a removed one shows its id. */
export const categoryName = (categories: readonly Category[], id: string): string =>
  categories.find((category) => category.id === id)?.label ?? id;

/** What a card prints for the category: nothing for the catch-all or a removed category. */
export const printedCategory = (categories: readonly Category[], id: string): string | null => {
  const category = categories.find((item) => item.id === id);
  return category && !category.catchAll ? category.label : null;
};

export const catchAllOf = (categories: readonly Category[]): string | undefined =>
  categories.find((category) => category.catchAll)?.id;
