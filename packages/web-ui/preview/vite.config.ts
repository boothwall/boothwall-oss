import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { surfaceThemeCss } from "@boothwall/shared/brand";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin, searchForWorkspaceRoot } from "vite";

/** The surface themes, inlined as the apps do it, so the preview can show both. */
const surfaces = (): Plugin => ({
  name: "surfaces",
  transformIndexHtml: () => [
    { tag: "style", children: surfaceThemeCss(), injectTo: "head-prepend" },
  ],
});

// The kit preview: every component on one page, for screenshots and visual review.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // The logos are imported from brand/ at the repository root.
  server: {
    fs: {
      allow: [
        fileURLToPath(new URL("../../..", import.meta.url)),
        resolve(
          searchForWorkspaceRoot(fileURLToPath(new URL(".", import.meta.url))),
          "node_modules",
        ),
      ],
    },
  },
  plugins: [react(), tailwindcss(), surfaces()],
});
