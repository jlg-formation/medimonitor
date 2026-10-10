/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base relative : le site fonctionne sur GitHub Pages quel que soit le nom du dépôt.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
  },
});
