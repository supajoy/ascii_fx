import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  onwarn(warning, handler) {
    // Suppress a11y warnings — this is a creative tool with many custom interactive elements
    if (warning.code.startsWith('a11y')) return;
    handler(warning);
  },
};
