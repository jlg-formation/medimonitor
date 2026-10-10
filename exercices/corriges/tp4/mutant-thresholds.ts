/**
 * MediMonitor — TP4 — Module de substitution de src/domain/thresholds (corrigé formateur).
 *
 * vitest.mutation.config.ts redirige ici les imports « ../../src/domain/thresholds ».
 * La variable d'environnement MUTANT (M1…M10) choisit la version de classifyValue ;
 * sans MUTANT, la version d'origine est utilisée.
 */
import type { Reading, Thresholds, VitalKey } from '../../../src/domain/model';
import {
  classifyValue as originalClassifyValue,
  DEFAULT_THRESHOLDS,
  validateThresholds,
  type Condition,
} from '../../../src/domain/thresholds.ts';
import { MUTANTS } from './mutants';

export { DEFAULT_THRESHOLDS, validateThresholds };
export type { Condition };

const mutantId = process.env.MUTANT;
const mutant = mutantId ? MUTANTS[mutantId] : undefined;
if (mutantId && !mutant) throw new Error(`Mutant inconnu : ${mutantId}`);

export const classifyValue = mutant ?? originalClassifyValue;

/** Copie de conditionFor, reliée à la classifyValue éventuellement mutée. */
export function conditionFor(key: VitalKey, reading: Reading, thresholds: Thresholds): Condition | null {
  if (reading.status === 'INVALID') return { cause: 'INVALID', severity: 'INFORMATION' };
  if (reading.status === 'UNAVAILABLE') return { cause: 'UNAVAILABLE', severity: 'INFORMATION' };
  return classifyValue(key, reading.value as number, thresholds);
}
