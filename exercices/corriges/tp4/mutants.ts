/**
 * MediMonitor — TP4 — Implémentations mutantes de classifyValue (corrigé formateur).
 *
 * Chaque mutant reproduit classifyValue (src/domain/thresholds.ts) avec UNE seule
 * modification, signalée par « // MUTATION ».
 */
import type { Thresholds, VitalKey } from '../../../src/domain/model';
import { DEFAULT_THRESHOLDS, type Condition } from '../../../src/domain/thresholds.ts';

type Classify = (key: VitalKey, value: number, thresholds: Thresholds) => Condition | null;

export const MUTANTS: Record<string, Classify> = {
  M1(key, value, thresholds) {
    const t = thresholds[key];
    if (value <= t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' }; // MUTATION
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M2(key, value, thresholds) {
    const t = thresholds[key];
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (value <= t.warningLow) return { cause: 'LOW', severity: 'WARNING' }; // MUTATION
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M3(key, value, thresholds) {
    const t = thresholds[key];
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
    if (t.criticalHigh !== null && value >= t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' }; // MUTATION
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M4(key, value, thresholds) {
    const t = thresholds[key];
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value >= t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' }; // MUTATION
    return null;
  },

  M5(key, value, thresholds) {
    const t = thresholds[key];
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' }; // MUTATION : ordre inversé
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M6(key, value, thresholds) {
    const t = thresholds[key];
    if (value < t.criticalLow) return { cause: 'HIGH', severity: 'CRITICAL' }; // MUTATION
    if (value < t.warningLow) return { cause: 'HIGH', severity: 'WARNING' }; // MUTATION
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M7(key, value) {
    const t = DEFAULT_THRESHOLDS[key]; // MUTATION : le paramètre thresholds est ignoré
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M8(key, value, thresholds) {
    const t = thresholds[key];
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
    // MUTATION : sans garde, « value > null » vaut « value > 0 » en JavaScript.
    if (value > (t.criticalHigh as number)) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (value > (t.warningHigh as number)) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M9(key, raw, thresholds) {
    const t = thresholds[key];
    const value = Math.round(raw); // MUTATION
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return null;
  },

  M10(key, value, thresholds) {
    const t = thresholds[key];
    if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
    if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
    if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
    if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
    return undefined as unknown as null; // MUTATION
  },
};
