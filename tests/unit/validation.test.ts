import { describe, expect, it } from 'vitest';
import type { RawReadings } from '../../src/domain/model';
import { NOT_RECEIVED, received, validateReadings, validateVital } from '../../src/domain/validation';

const raws = (over: Partial<Record<keyof RawReadings, unknown>> = {}): RawReadings => ({
  heartRate: received(75),
  spo2: received(98),
  temperature: received(36.8),
  systolic: received(120),
  diastolic: received(80),
  ...Object.fromEntries(Object.entries(over).map(([k, v]) => [k, received(v)])),
});

describe('validateVital', () => {
  it.each([
    ['heartRate', 0, 'VALID'],
    ['heartRate', 300, 'VALID'],
    ['heartRate', -1, 'INVALID'],
    ['heartRate', 301, 'INVALID'],
    ['heartRate', 75.5, 'INVALID'],
    ['spo2', 100, 'VALID'],
    ['spo2', 101, 'INVALID'],
    ['temperature', 20, 'VALID'],
    ['temperature', 45, 'VALID'],
    ['temperature', 19.9, 'INVALID'],
    ['temperature', 45.1, 'INVALID'],
    ['temperature', 99, 'INVALID'],
    ['systolic', 300, 'VALID'],
    ['diastolic', -5, 'INVALID'],
  ] as const)('%s = %s → %s', (key, value, status) => {
    expect(validateVital(key, received(value), 3).status).toBe(status);
  });

  it.each([NaN, Infinity, -Infinity, '75', null, undefined, {}])('rejette la valeur non numérique %s', (value) => {
    const r = validateVital('heartRate', received(value), 0);
    expect(r).toEqual({ value: null, status: 'INVALID', simulatedSecond: 0 });
  });

  it('marque une donnée non reçue UNAVAILABLE, jamais zéro', () => {
    expect(validateVital('spo2', NOT_RECEIVED, 7)).toEqual({ value: null, status: 'UNAVAILABLE', simulatedSecond: 7 });
  });

  it('arrondit la température au dixième', () => {
    expect(validateVital('temperature', received(37.26), 0).value).toBe(37.3);
  });
});

describe('validateReadings — pression artérielle conjointe', () => {
  it('accepte PAS > PAD', () => {
    const r = validateReadings(raws(), 0);
    expect(r.systolic.status).toBe('VALID');
    expect(r.diastolic.status).toBe('VALID');
  });

  it.each([
    [70, 80],
    [80, 80],
  ])('invalide les deux composantes si PAS=%s ≤ PAD=%s', (sys, dia) => {
    const r = validateReadings(raws({ systolic: sys, diastolic: dia }), 0);
    expect(r.systolic).toEqual({ value: null, status: 'INVALID', simulatedSecond: 0 });
    expect(r.diastolic).toEqual({ value: null, status: 'INVALID', simulatedSecond: 0 });
    expect(r.heartRate.status).toBe('VALID');
  });

  it("n'invalide pas la PAD quand la PAS est indisponible", () => {
    const r = validateReadings({ ...raws(), systolic: NOT_RECEIVED }, 0);
    expect(r.systolic.status).toBe('UNAVAILABLE');
    expect(r.diastolic.status).toBe('VALID');
  });
});
