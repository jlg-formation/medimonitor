import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// TP4 : exécute uniquement les tests écrits par le stagiaire (tests/tp4/),
// jamais les tests existants de tests/unit ni tests/integration.
export default defineConfig({
  root: fileURLToPath(new URL('../../..', import.meta.url)),
  test: {
    environment: 'node',
    include: ['tests/tp4/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/thresholds.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage/tp4',
    },
  },
});
