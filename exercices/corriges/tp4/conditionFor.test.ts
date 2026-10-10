/**
 * MediMonitor — TP4 — Pour aller plus loin : conditionFor (THR-001), corrigé formateur.
 *
 * conditionFor enveloppe classifyValue : la validation précède la classification.
 */
import { describe, expect, it } from 'vitest';
import type { Reading } from '../../../src/domain/model';
import { conditionFor, DEFAULT_THRESHOLDS } from '../../../src/domain/thresholds';

const reading = (value: number | null, status: Reading['status']): Reading => ({ value, status, simulatedSecond: 0 });

describe('conditionFor — THR-001', () => {
  it('une mesure VALID est classée sur sa valeur', () => {
    expect(conditionFor('heartRate', reading(121, 'VALID'), DEFAULT_THRESHOLDS)).toEqual({ cause: 'HIGH', severity: 'CRITICAL' });
    expect(conditionFor('heartRate', reading(75, 'VALID'), DEFAULT_THRESHOLDS)).toBeNull();
  });

  it('une mesure INVALID ne produit qu\'une INFORMATION, quelle que soit la valeur', () => {
    // Même si une valeur critique traînait dans la mesure, elle ne doit pas être classée.
    expect(conditionFor('temperature', reading(45, 'INVALID'), DEFAULT_THRESHOLDS)).toEqual({ cause: 'INVALID', severity: 'INFORMATION' });
  });

  it('une mesure UNAVAILABLE ne produit qu\'une INFORMATION, jamais NORMAL', () => {
    expect(conditionFor('spo2', reading(null, 'UNAVAILABLE'), DEFAULT_THRESHOLDS)).toEqual({ cause: 'UNAVAILABLE', severity: 'INFORMATION' });
  });
});
