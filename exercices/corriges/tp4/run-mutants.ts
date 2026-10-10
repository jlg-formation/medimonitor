/**
 * MediMonitor — TP4 — Campagne de mutants sur une suite de tests de classifyValue.
 *
 * Usage :
 *   npm run test:tp4:mutants                          → évalue tests/tp4 (suite du stagiaire)
 *   npm run test:tp4:mutants -- exercices/corriges/tp4  → évalue la suite de référence
 *
 * La suite doit passer sur le code d'origine, puis échouer sur chaque mutant.
 * Un mutant « survivant » révèle un comportement que la suite ne vérifie pas.
 * Les tests doivent importer classifyValue par un chemin relatif sans extension
 * (« ../../src/domain/thresholds »).
 *
 * Code de sortie : 0 si la suite passe sur le code d'origine, 1 sinon.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MUTANT_CATALOGUE } from './catalogue.ts';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const config = fileURLToPath(new URL('./vitest.mutation.config.ts', import.meta.url));
const vitest = fileURLToPath(new URL('../../../node_modules/vitest/vitest.mjs', import.meta.url));
const testDir = (process.argv[2] ?? 'tests/tp4').replace(/\\/g, '/').replace(/\/$/, '');

function runSuite(mutant: string): boolean {
  const result = spawnSync(process.execPath, [vitest, 'run', '--config', config, '--reporter=dot'], {
    cwd: root,
    env: { ...process.env, MUTANT: mutant, TP4_TESTS: testDir },
    encoding: 'utf8',
  });
  return result.status === 0;
}

console.log(`Suite évaluée : ${testDir}\n`);

if (!runSuite('')) {
  console.log('Code d\'origine : ÉCHEC — la suite doit d\'abord passer sur le code non modifié.');
  console.log(`Vérifiez avec : npx vitest run --config ${config} (TP4_TESTS=${testDir})`);
  process.exit(1);
}
console.log('Code d\'origine : PASS\n');

let killed = 0;
for (const m of MUTANT_CATALOGUE) {
  const survived = runSuite(m.id);
  if (!survived) killed++;
  const status = survived ? 'SURVIVANT' : 'tué     ';
  console.log(`${m.id.padEnd(4)} ${status}  ${m.description}${survived ? `\n                 → piste : ${m.tueur}` : ''}`);
}

console.log(`\nScore de mutation : ${killed}/${MUTANT_CATALOGUE.length} mutants tués`);
