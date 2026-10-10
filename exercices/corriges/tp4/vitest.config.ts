import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// TP4 corrigé : exécute uniquement les tests de référence du formateur.
export default defineConfig({
  root: fileURLToPath(new URL('../../..', import.meta.url)),
  test: {
    environment: 'node',
    include: ['exercices/corriges/tp4/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/thresholds.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage/tp4-corrige',
    },
  },
});
