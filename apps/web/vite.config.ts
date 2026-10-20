import { fileURLToPath } from "node:url";

import { boothwallConfig, webBasePath } from "@boothwall/shared/config";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { buildIdentity } from "./vite/configuration";
import { boothwall } from "./vite/plugins/boothwall";
import { reactNativeWeb } from "./vite/plugins/reactNativeWeb";

export default defineConfig({
  // A `urls.web` with a path (https://example.com/demo) builds the app to be served from there.
  base: webBasePath(boothwallConfig.urls.web),
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    boothwall(),
    reactNativeWeb(),
    buildIdentity(process.env.BOOTHWALL_BUILD_IDENTITY),
  ],
});
