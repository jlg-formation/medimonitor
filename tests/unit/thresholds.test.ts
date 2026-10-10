import { describe, expect, it } from 'vitest';
import type { VitalKey } from '../../src/domain/model';
import { classifyValue, conditionFor, DEFAULT_THRESHOLDS, validateThresholds } from '../../src/domain/thresholds';

const level = (key: VitalKey, v: number) => classifyValue(key, v, DEFAULT_THRESHOLDS)?.severity ?? 'NORMAL';

describe('classification aux frontières (§8)', () => {
  it.each([
    // FC
    ['heartRate', 49, 'CRITICAL'], ['heartRate', 50, 'WARNING'], ['heartRate', 59, 'WARNING'],
    ['heartRate', 60, 'NORMAL'], ['heartRate', 100, 'NORMAL'], ['heartRate', 101, 'WARNING'],
    ['heartRate', 120, 'WARNING'], ['heartRate', 121, 'CRITICAL'],
    // SpO2
    ['spo2', 91, 'CRITICAL'], ['spo2', 92, 'WARNING'], ['spo2', 94, 'WARNING'], ['spo2', 95, 'NORMAL'], ['spo2', 100, 'NORMAL'],
    // Température
    ['temperature', 34.9, 'CRITICAL'], ['temperature', 35, 'WARNING'], ['temperature', 35.9, 'WARNING'],
    ['temperature', 36, 'NORMAL'], ['temperature', 38, 'NORMAL'], ['temperature', 38.1, 'WARNING'],
    ['temperature', 39, 'WARNING'], ['temperature', 39.1, 'CRITICAL'],
    // PAS
    ['systolic', 89, 'CRITICAL'], ['systolic', 90, 'WARNING'], ['systolic', 99, 'WARNING'], ['systolic', 100, 'NORMAL'],
    ['systolic', 140, 'NORMAL'], ['systolic', 141, 'WARNING'], ['systolic', 160, 'WARNING'], ['systolic', 161, 'CRITICAL'],
    // PAD
    ['diastolic', 59, 'CRITICAL'], ['diastolic', 60, 'WARNING'], ['diastolic', 64, 'WARNING'], ['diastolic', 65, 'NORMAL'],
    ['diastolic', 90, 'NORMAL'], ['diastolic', 91, 'WARNING'], ['diastolic', 100, 'WARNING'], ['diastolic', 101, 'CRITICAL'],
  ] as const)('%s = %s → %s', (key, value, expected) => {
    expect(level(key, value)).toBe(expected);
  });

  it('AC-03 : FC 120 WARNING, 121 CRITICAL, 100 NORMAL', () => {
    expect(level('heartRate', 120)).toBe('WARNING');
    expect(level('heartRate', 121)).toBe('CRITICAL');
    expect(level('heartRate', 100)).toBe('NORMAL');
  });

  it('donne la cause LOW/HIGH', () => {
    expect(classifyValue('heartRate', 40, DEFAULT_THRESHOLDS)?.cause).toBe('LOW');
    expect(classifyValue('heartRate', 130, DEFAULT_THRESHOLDS)?.cause).toBe('HIGH');
  });
});

describe('conditionFor (THR-001)', () => {
  it('une mesure INVALID ne produit que INFORMATION', () => {
    expect(conditionFor('temperature', { value: null, status: 'INVALID', simulatedSecond: 0 }, DEFAULT_THRESHOLDS))
      .toEqual({ cause: 'INVALID', severity: 'INFORMATION' });
  });
  it('une mesure UNAVAILABLE ne produit que INFORMATION', () => {
    expect(conditionFor('spo2', { value: null, status: 'UNAVAILABLE', simulatedSecond: 0 }, DEFAULT_THRESHOLDS))
      .toEqual({ cause: 'UNAVAILABLE', severity: 'INFORMATION' });
  });
  it('une mesure valide normale ne produit aucune condition', () => {
    expect(conditionFor('heartRate', { value: 75, status: 'VALID', simulatedSecond: 0 }, DEFAULT_THRESHOLDS)).toBeNull();
  });
});

describe('validateThresholds (THR-002)', () => {
  it('accepte les seuils par défaut', () => {
    expect(validateThresholds(DEFAULT_THRESHOLDS)).toEqual([]);
  });
  it('rejette des seuils non ordonnés', () => {
    const t = structuredClone(DEFAULT_THRESHOLDS);
    t.heartRate.warningLow = 40;
    expect(validateThresholds(t).join()).toMatch(/ordonnés/);
  });
  it('rejette des seuils hors domaine de validité', () => {
    const t = structuredClone(DEFAULT_THRESHOLDS);
    t.spo2.criticalLow = -1;
    expect(validateThresholds(t).join()).toMatch(/spo2\.criticalLow/);
  });
  it('rejette une valeur non numérique', () => {
    const t = structuredClone(DEFAULT_THRESHOLDS) as unknown as Record<string, Record<string, unknown>>;
    (t.temperature as Record<string, unknown>).criticalHigh = 'abc';
    expect(validateThresholds(t)).not.toEqual([]);
  });
  it('rejette un objet absent', () => {
    expect(validateThresholds(null)).not.toEqual([]);
  });
});
