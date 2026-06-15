// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/admin': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },

    plugins: [tailwindcss()]
  },

  integrations: [react()]
});