import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import { resolve } from "node:path";

const isWatch = process.argv.includes("--watch");

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "elkjs/lib/elk.bundled.js": resolve(
        __dirname,
        "../ui/src/lib/shared/viz/elk-stub.ts"
      ),
    },
  },

  esbuild: {
    jsx: "automatic",
    jsxImportSource: "hono/jsx/dom",
  },
  build: {
    outDir: "dist",
    emptyOutDir: !isWatch,
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      input: "src/main.tsx",
    },
  },
});
