import { freeze } from "./identity.utils.mjs";

export const commands = freeze({
  install: ["pnpm", "install", "--frozen-lockfile", "--ignore-scripts"],
  delegates: ["node", "scripts/postinstall/link-cf-delegates.mjs"],
  typecheck: ["pnpm", "typecheck"],
  lint: ["pnpm", "lint"],
  test: ["pnpm", "test"],
  format: ["pnpm", "format:check"],
  "build-api": ["pnpm", "--filter", "@boothwall/api", "build"],
  "build-web": ["pnpm", "--filter", "@boothwall/web", "build"],
});
export const checkIds = (phase) =>
  phase === "branch"
    ? ["install", "delegates", "typecheck", "lint", "test", "format", "build-api", "build-web"]
    : ["install", "delegates", "build-api", "build-web"];
