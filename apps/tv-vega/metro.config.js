const fs = require("node:fs");
const path = require("node:path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

/** Every node_modules from the app up to the workspace root (the core's own, or a parent's). */
function nodeModulesAbove(from) {
  const found = [];
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, "node_modules");
    if (fs.existsSync(candidate)) found.push(candidate);
    const atRoot =
      fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) || path.dirname(dir) === dir;
    if (atRoot) return found;
  }
}

/**
 * Monorepo-aware Metro config: watch workspace packages (raw TS source) and
 * resolve from the app and every hoisted node_modules above it.
 * @type {import("metro-config").MetroConfig}
 */
const config = {
  watchFolders: [path.resolve(workspaceRoot, "packages"), ...nodeModulesAbove(projectRoot)],
  resolver: {
    nodeModulesPaths: nodeModulesAbove(projectRoot),
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
