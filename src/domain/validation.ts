import type { RawReadings, RawValue, Reading, VitalKey } from './model';

export interface VitalDomain {
  min: number;
  max: number;
  integer: boolean;
}

/** Domaines de validité (§4.2). */
export const VITAL_DOMAINS: Record<VitalKey, VitalDomain> = {
  heartRate: { min: 0, max: 300, integer: true },
  spo2: { min: 0, max: 100, integer: true },
  temperature: { min: 20, max: 45, integer: false },
  systolic: { min: 0, max: 300, integer: true },
  diastolic: { min: 0, max: 300, integer: true },
};

export const received = (value: unknown): RawValue => ({ received: true, value });
export const NOT_RECEIVED: RawValue = { received: false };

/** Valide une composante isolée. La température est arrondie au dixième. */
export function validateVital(key: VitalKey, raw: RawValue, simulatedSecond: number): Reading {
  if (!raw.received) return { value: null, status: 'UNAVAILABLE', simulatedSecond };
  const v = raw.value;
  const invalid: Reading = { value: null, status: 'INVALID', simulatedSecond };
  if (typeof v !== 'number' || !Number.isFinite(v)) return invalid;
  const domain = VITAL_DOMAINS[key];
  if (domain.integer && !Number.isInteger(v)) return invalid;
  const value = domain.integer ? v : Math.round(v * 10) / 10;
  if (value < domain.min || value > domain.max) return invalid;
  return { value, status: 'VALID', simulatedSecond };
}

/** Valide un jeu complet ; PAS/PAD sont validées conjointement (PAS > PAD). */
export function validateReadings(raws: RawReadings, simulatedSecond: number): Record<VitalKey, Reading> {
  const r = {
    heartRate: validateVital('heartRate', raws.heartRate, simulatedSecond),
    spo2: validateVital('spo2', raws.spo2, simulatedSecond),
    temperature: validateVital('temperature', raws.temperature, simulatedSecond),
    systolic: validateVital('systolic', raws.systolic, simulatedSecond),
    diastolic: validateVital('diastolic', raws.diastolic, simulatedSecond),
  };
  if (
    r.systolic.status === 'VALID' &&
    r.diastolic.status === 'VALID' &&
    (r.systolic.value as number) <= (r.diastolic.value as number)
  ) {
    r.systolic = { value: null, status: 'INVALID', simulatedSecond };
    r.diastolic = { value: null, status: 'INVALID', simulatedSecond };
  }
  return r;
}
