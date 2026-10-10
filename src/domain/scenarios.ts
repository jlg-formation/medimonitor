import type { RawReadings, ScenarioId, VitalKey } from './model';
import { VITAL_KEYS } from './model';
import { hashJitter } from './rng';
import { NOT_RECEIVED, received } from './validation';

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  description: string;
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  { id: 'SC-01', label: 'Stable', description: 'Petites variations déterministes dans la zone normale.' },
  { id: 'SC-02', label: 'Dégradation progressive', description: 'Sur 120 s : FC 75 → 132 bpm, SpO2 98 → 89 %.' },
  { id: 'SC-03', label: 'Récupération', description: 'Sur 120 s : FC 132 → 75 bpm, SpO2 89 → 98 %.' },
  { id: 'SC-04', label: 'Perte de capteur', description: 'SpO2 indisponible de t=30 à t=59.' },
  { id: 'SC-05', label: 'Valeur aberrante', description: 'Température brute de 99 °C à t=45.' },
  { id: 'SC-06', label: 'Alarme intermittente', description: 'FC 110 bpm 10 s puis 80 bpm 10 s, en boucle.' },
  { id: 'SC-07', label: 'Panne de communication', description: 'Toutes les composantes indisponibles de t=30 à t=89.' },
  { id: 'SC-08', label: 'Dégradation rapide', description: 'De t=0 à t=20 : FC 80 → 135 bpm, SpO2 98 → 88 %, puis maintien.' },
];

export const SCENARIO_IDS: readonly ScenarioId[] = SCENARIOS.map((s) => s.id);

export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === 'string' && (SCENARIO_IDS as readonly string[]).includes(value);
}

/** Valeurs de base fixes (§6). */
export const BASELINE: Record<VitalKey, number> = {
  heartRate: 75,
  spo2: 98,
  temperature: 36.8,
  systolic: 120,
  diastolic: 80,
};

const round = (v: number) => Math.round(v);
const roundTenth = (v: number) => Math.round(v * 10) / 10;

/** Interpolation linéaire bornée : de `from` à `to` sur [0, duration], maintien ensuite. */
function lerp(from: number, to: number, t: number, duration: number): number {
  const ratio = Math.min(Math.max(t / duration, 0), 1);
  return from + (to - from) * ratio;
}

function baseline(): Record<VitalKey, number | null> {
  return { ...BASELINE };
}

function toRaw(values: Record<VitalKey, unknown>): RawReadings {
  const out = {} as RawReadings;
  for (const k of VITAL_KEYS) out[k] = values[k] === null ? NOT_RECEIVED : received(values[k]);
  return out;
}

/**
 * Valeurs brutes produites par un scénario à sa seconde locale `t` (0 à l'activation).
 * `null` signifie donnée non reçue. Fonction pure, sans état.
 */
export function computeScenario(
  id: ScenarioId,
  t: number,
  seed: number,
  patientIndex: number,
): RawReadings {
  const v: Record<VitalKey, unknown> = baseline();
  switch (id) {
    case 'SC-01': {
      const j = (amp: number, vital: number) => hashJitter(amp, seed, patientIndex, vital, t);
      v.heartRate = BASELINE.heartRate + j(3, 0);
      v.spo2 = BASELINE.spo2 + j(1, 1);
      v.temperature = roundTenth(BASELINE.temperature + j(1, 2) / 10);
      v.systolic = BASELINE.systolic + j(4, 3);
      v.diastolic = BASELINE.diastolic + j(3, 4);
      break;
    }
    case 'SC-02':
      v.heartRate = round(lerp(75, 132, t, 120));
      v.spo2 = round(lerp(98, 89, t, 120));
      break;
    case 'SC-03':
      v.heartRate = round(lerp(132, 75, t, 120));
      v.spo2 = round(lerp(89, 98, t, 120));
      break;
    case 'SC-04':
      if (t >= 30 && t <= 59) v.spo2 = null;
      break;
    case 'SC-05':
      if (t === 45) v.temperature = 99;
      break;
    case 'SC-06':
      v.heartRate = t % 20 < 10 ? 110 : 80;
      break;
    case 'SC-07':
      if (t >= 30 && t <= 89) for (const k of VITAL_KEYS) v[k] = null;
      break;
    case 'SC-08':
      v.heartRate = round(lerp(80, 135, t, 20));
      v.spo2 = round(lerp(98, 88, t, 20));
      break;
  }
  return toRaw(v);
}
