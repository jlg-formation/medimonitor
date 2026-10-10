import type { AlarmCause, Reading, Severity, Thresholds, VitalKey } from './model';
import { VITAL_KEYS } from './model';
import { VITAL_DOMAINS } from './validation';

/** Seuils pédagogiques fictifs par défaut (§8). Non validés médicalement. */
export const DEFAULT_THRESHOLDS: Thresholds = {
  heartRate: { criticalLow: 50, warningLow: 60, warningHigh: 100, criticalHigh: 120 },
  spo2: { criticalLow: 92, warningLow: 95, warningHigh: null, criticalHigh: null },
  temperature: { criticalLow: 35, warningLow: 36, warningHigh: 38, criticalHigh: 39 },
  systolic: { criticalLow: 90, warningLow: 100, warningHigh: 140, criticalHigh: 160 },
  diastolic: { criticalLow: 60, warningLow: 65, warningHigh: 90, criticalHigh: 100 },
};

export interface Condition {
  cause: AlarmCause;
  severity: Severity;
}

/**
 * Classe une valeur valide :
 * x < criticalLow → CRITICAL ; x < warningLow → WARNING ;
 * x > criticalHigh → CRITICAL ; x > warningHigh → WARNING ; sinon null (NORMAL).
 */
export function classifyValue(key: VitalKey, value: number, thresholds: Thresholds): Condition | null {
  const t = thresholds[key];
  if (value < t.criticalLow) return { cause: 'LOW', severity: 'CRITICAL' };
  if (value < t.warningLow) return { cause: 'LOW', severity: 'WARNING' };
  if (t.criticalHigh !== null && value > t.criticalHigh) return { cause: 'HIGH', severity: 'CRITICAL' };
  if (t.warningHigh !== null && value > t.warningHigh) return { cause: 'HIGH', severity: 'WARNING' };
  return null;
}

/** THR-001 : la validation précède la classification ; une mesure non valide ne donne qu'INFORMATION. */
export function conditionFor(key: VitalKey, reading: Reading, thresholds: Thresholds): Condition | null {
  if (reading.status === 'INVALID') return { cause: 'INVALID', severity: 'INFORMATION' };
  if (reading.status === 'UNAVAILABLE') return { cause: 'UNAVAILABLE', severity: 'INFORMATION' };
  return classifyValue(key, reading.value as number, thresholds);
}

/** THR-002 : renvoie la liste des erreurs (vide si le paramétrage est valide). */
export function validateThresholds(thresholds: unknown): string[] {
  const errors: string[] = [];
  if (typeof thresholds !== 'object' || thresholds === null) return ['Paramétrage des seuils absent.'];
  const all = thresholds as Record<string, unknown>;
  for (const key of VITAL_KEYS) {
    const t = all[key] as Record<string, unknown> | undefined;
    const domain = VITAL_DOMAINS[key];
    if (typeof t !== 'object' || t === null) {
      errors.push(`${key} : seuils absents.`);
      continue;
    }
    const values: number[] = [];
    for (const field of ['criticalLow', 'warningLow', 'warningHigh', 'criticalHigh'] as const) {
      const v = t[field];
      const optional = key === 'spo2' && (field === 'warningHigh' || field === 'criticalHigh');
      if (optional && v === null) continue;
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        errors.push(`${key}.${field} : valeur numérique requise.`);
        continue;
      }
      if (v < domain.min || v > domain.max) {
        errors.push(`${key}.${field} : doit être compris entre ${domain.min} et ${domain.max}.`);
      }
      values.push(v);
    }
    for (let i = 1; i < values.length; i++) {
      if ((values[i - 1] as number) > (values[i] as number)) {
        errors.push(`${key} : les seuils doivent être ordonnés (critique bas ≤ alerte bas ≤ alerte haut ≤ critique haut).`);
        break;
      }
    }
  }
  return errors;
}
