import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      'elkjs/lib/elk.bundled.js': resolve(
        __dirname,
        '../ui/src/lib/shared/viz/elk-stub.ts',
      ),
    },
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'QuizMcpWebComponents',
      formats: ['es', 'iife'],
      fileName: (format) =>
        format === 'es'
          ? 'quiz-mcp-web-components.mjs'
          : 'quiz-mcp-web-components.iife.js',
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
