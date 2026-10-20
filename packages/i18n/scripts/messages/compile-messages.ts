import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { emitCatalogues } from "./emit-catalogues.ts";
import { readCatalogues } from "./read-catalogues.ts";

export type CompileOptions = {
  /** `messages/` with `<language>/<area>.json`. */
  sourceDir: string;
  /** The generated folder, e.g. `src/messages`. Owned by this tool. */
  outDir: string;
  runtime?: string;
  /** Compare only; write nothing. CI and tests use this. */
  check?: boolean;
};

function listFiles(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(dir, entry.name), base)
      : [relative(base, join(dir, entry.name))],
  );
}

/** Validates every catalogue, then writes (or checks) the generated folder. */
export function compileMessages({
  sourceDir,
  outDir,
  runtime = "@boothwall/i18n",
  check,
}: CompileOptions) {
  const { catalogues, problems } = readCatalogues(sourceDir);
  if (problems.length) return { problems, written: [] as string[] };
  const files = emitCatalogues(catalogues, runtime);
  const written: string[] = [];
  for (const [path, text] of files) {
    const target = join(outDir, path);
    const current = existsSync(target) ? readFileSync(target, "utf8") : null;
    if (current === text) continue;
    if (check) {
      problems.push(`${relative(process.cwd(), target)}: out of date; run the messages script`);
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
    written.push(path);
  }
  // Never delete: a file the tool no longer makes is reported for a person to remove.
  for (const path of listFiles(outDir))
    if (!files.has(path)) problems.push(`${join(outDir, path)}: no longer generated; remove it`);
  return { problems, written };
}
