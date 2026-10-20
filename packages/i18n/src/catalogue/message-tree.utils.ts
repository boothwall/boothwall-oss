import type { I18n } from "@lingui/core";

type Plain<Values> = {
  [Id in keyof Values]: keyof Values[Id] extends never ? Id : never;
}[keyof Values] &
  string;

/**
 * The value-free messages under a prefix as a nested object of strings, typed from the
 * generated `MessageValues`: `"capture.errors.DECODE"` becomes `tree.errors.DECODE`.
 */
export type MessageTree<Values, Prefix extends string, Ids extends string = Plain<Values>> = {
  [
    Id in Ids as Id extends `${Prefix}.${infer Head}.${string}`
      ? Head
      : Id extends `${Prefix}.${infer Leaf}`
        ? Leaf
        : never
  ]: Id extends `${Prefix}.${infer Head}.${string}`
    ? MessageTree<Values, `${Prefix}.${Head}`, Ids>
    : string;
};

type Tree = { [key: string]: string | Tree };

/** Builds a `MessageTree` from the active language. Messages that need values are left out. */
export function messageTree<Values, Prefix extends string>(
  i18n: I18n,
  prefix: Prefix,
): MessageTree<Values, Prefix> {
  const tree: Tree = {};
  for (const [id, message] of Object.entries(i18n.messages)) {
    if (!id.startsWith(`${prefix}.`)) continue;
    if (Array.isArray(message) && message.some((token) => typeof token !== "string")) continue;
    const path = id.slice(prefix.length + 1).split(".");
    const leaf = path.pop()!;
    let node = tree;
    for (const key of path) node = (node[key] ??= {}) as Tree;
    node[leaf] = i18n._(id);
  }
  return tree as MessageTree<Values, Prefix>;
}
