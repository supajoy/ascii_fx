import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    svelte(),
    // Gzip pre-compression for faster serving
    compression({ algorithm: 'gzip', threshold: 1024 }),
    // Brotli pre-compression (smaller than gzip, supported by all modern browsers)
    compression({ algorithm: 'brotliCompress', threshold: 1024 }),
  ],
  build: {
    // Terser for aggressive minification (smaller output than default esbuild)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: { toplevel: true },
    },
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          svelte: ['svelte', 'svelte/internal'],
        },
      },
    },
    // Inline small assets
    assetsInlineLimit: 4096,
    // Source maps off for production
    sourcemap: false,
    // Target modern browsers only
    target: 'es2020',
  },
  // Security headers hint for preview server
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});
