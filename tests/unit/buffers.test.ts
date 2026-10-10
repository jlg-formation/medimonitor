import { describe, expect, it } from 'vitest';
import { appendBounded, createEvent } from '../../src/domain/events';
import { MAX_HISTORY_SECONDS, pushSample } from '../../src/domain/history';
import type { Sample } from '../../src/domain/model';
import { hashJitter, hashUnit, mulberry32 } from '../../src/domain/rng';

const sample = (s: number): Sample => ({ patientId: 'P-001', simulatedSecond: s, readings: {} as Sample['readings'] });

describe('historique (HIS-001)', () => {
  it('limite à 3600 échantillons en supprimant les plus anciens', () => {
    const h: Sample[] = [];
    for (let s = 0; s <= MAX_HISTORY_SECONDS + 10; s++) pushSample(h, sample(s));
    expect(h).toHaveLength(MAX_HISTORY_SECONDS);
    expect(h[0]?.simulatedSecond).toBe(11);
    expect(h.at(-1)?.simulatedSecond).toBe(MAX_HISTORY_SECONDS + 10);
  });
  it('remplace un échantillon de la même seconde', () => {
    const h = [sample(0)];
    const replacement = sample(0);
    pushSample(h, replacement);
    expect(h).toEqual([replacement]);
  });
});

describe('journal (HIS-002)', () => {
  it('supprime les plus anciens au-delà de la limite', () => {
    expect(appendBounded([1, 2, 3], [4, 5], 4)).toEqual([2, 3, 4, 5]);
    const list = [1];
    expect(appendBounded(list, [], 4)).toBe(list);
  });
  it('crée des événements avec tous les champs', () => {
    expect(createEvent(7, { type: 'SIM_STARTED' }, 3, 1000)).toEqual({
      id: 'E-000007', type: 'SIM_STARTED', simulatedSecond: 3, realTimestamp: 1000, payload: {},
    });
    expect(createEvent(1, { type: 'SCENARIO_CHANGED', patientId: 'P-002' }, 0, 0).patientId).toBe('P-002');
  });
});

describe('rng', () => {
  it('mulberry32 est reproductible', () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });
  it('hashUnit est dans [0,1) et hashJitter dans les bornes', () => {
    for (let i = 0; i < 1000; i++) {
      const u = hashUnit(1, i);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      const j = hashJitter(3, 9, i);
      expect(j).toBeGreaterThanOrEqual(-3);
      expect(j).toBeLessThanOrEqual(3);
    }
  });
});
