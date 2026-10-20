import { reactNativeWeb } from "./vite/reactNativeWeb";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [react(), reactNativeWeb()],
  resolve: {
    extensions: [".web.tsx", ".web.ts", ".web.js", ".tsx", ".ts", ".mjs", ".js", ".jsx", ".json"],
  },
  test: { environment: "node", setupFiles: ["./src/testing/setup/cleanup.ts"] },
});
