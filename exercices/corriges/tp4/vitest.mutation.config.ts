import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// TP4 : exécute une suite de tests contre une version mutante de classifyValue.
// TP4_TESTS : dossier des tests à évaluer (défaut tests/tp4) ; MUTANT : M1…M10.
// Les imports relatifs « …/src/domain/thresholds » (sans extension) sont redirigés
// vers mutant-thresholds.ts, qui importe lui-même le vrai module avec l'extension .ts.
export default defineConfig({
  root: fileURLToPath(new URL('../../..', import.meta.url)),
  resolve: {
    alias: [
      {
        find: /^(?:\.\.\/)+src\/domain\/thresholds$/,
        replacement: fileURLToPath(new URL('./mutant-thresholds.ts', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'node',
    include: [`${process.env.TP4_TESTS ?? 'tests/tp4'}/**/*.test.ts`],
  },
});
