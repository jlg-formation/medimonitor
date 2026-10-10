// Moteur de simulation : reducer pur (state, action) → state.
// Toute la logique métier passe ici ; l'UI ne fait que dispatcher des actions.

import { createPatients } from '../data/patients';
import { acknowledgeAlarm, reconcileVital } from './alarms';
import { appendBounded, createEvent, MAX_JOURNAL_EVENTS, type EventDraft } from './events';
import { pushSample } from './history';
import type {
  EngineState,
  LogEvent,
  PatientId,
  PatientRuntime,
  RawValue,
  Reading,
  Sample,
  ScenarioId,
  Speed,
  Thresholds,
  VitalKey,
} from './model';
import { VITAL_KEYS } from './model';
import { computeScenario } from './scenarios';
import { conditionFor, validateThresholds } from './thresholds';
import { validateReadings, validateVital } from './validation';

export type Action =
  | { type: 'START'; at: number }
  | { type: 'PAUSE'; at: number }
  | { type: 'RESUME'; at: number }
  | { type: 'AUTO_PAUSE'; at: number }
  | { type: 'RESET'; at: number }
  | { type: 'TICK'; steps: number; at: number }
  | { type: 'SET_SPEED'; speed: Speed; at: number }
  | { type: 'SET_SEED'; seed: number; at: number }
  | { type: 'SET_SCENARIO'; patientId: PatientId; scenarioId: ScenarioId; at: number }
  | { type: 'SET_OVERRIDE'; patientId: PatientId; vitalKey: VitalKey; raw: RawValue; at: number }
  | { type: 'RELEASE_OVERRIDE'; patientId: PatientId; vitalKey: VitalKey; at: number }
  | { type: 'ACK_ALARM'; alarmId: string; at: number }
  | { type: 'SET_THRESHOLDS'; thresholds: Thresholds; at: number };

export interface EngineConfig {
  seed: number;
  speed: Speed;
  thresholds: Thresholds;
}

/** Contexte de travail d'une action : copie superficielle mutable + événements produits. */
interface Ctx {
  s: EngineState;
  at: number;
  events: LogEvent[];
  ownedHistory: Set<PatientId>;
}

function begin(state: EngineState, at: number): Ctx {
  return {
    s: { ...state, patients: [...state.patients], history: { ...state.history } },
    at,
    events: [],
    ownedHistory: new Set(),
  };
}

function finish(ctx: Ctx): EngineState {
  ctx.s.journal = appendBounded(ctx.s.journal, ctx.events, MAX_JOURNAL_EVENTS);
  return ctx.s;
}

function log(ctx: Ctx, draft: EventDraft): void {
  ctx.events.push(createEvent(ctx.s.nextEventSeq, draft, ctx.s.simulatedSecond, ctx.at));
  ctx.s.nextEventSeq += 1;
}

const readingSummary = (r: Reading | undefined) =>
  r ? { value: r.value, status: r.status } : null;

/** Calcule l'échantillon courant d'un patient : scénario → overrides → validation conjointe (MAN-002/003). */
export function computeSample(s: EngineState, rt: PatientRuntime): Sample {
  const second = s.simulatedSecond;
  const raws = computeScenario(rt.patient.scenarioId, second - rt.scenarioStartSecond, s.seed, rt.index);
  for (const o of s.overrides) {
    if (o.patientId === rt.patient.id) raws[o.vitalKey] = o.raw;
  }
  return { patientId: rt.patient.id, simulatedSecond: second, readings: validateReadings(raws, second) };
}

/** Réconcilie les alarmes d'un patient avec ses dernières mesures, en journalisant les transitions. */
function evaluateAlarms(ctx: Ctx, sample: Sample): void {
  for (const key of VITAL_KEYS) {
    const condition = conditionFor(key, sample.readings[key], ctx.s.thresholds);
    const r = reconcileVital(ctx.s.alarms, sample.patientId, key, condition, ctx.s.simulatedSecond, ctx.s.nextAlarmSeq);
    ctx.s.alarms = r.alarms;
    ctx.s.nextAlarmSeq = r.nextAlarmSeq;
    for (const t of r.transitions) {
      log(ctx, {
        type: t.kind === 'CREATED' ? 'ALARM_CREATED' : 'ALARM_RESOLVED',
        patientId: t.alarm.patientId,
        payload: { alarmId: t.alarm.id, vitalKey: t.alarm.vitalKey, cause: t.alarm.cause, severity: t.alarm.severity },
      });
    }
  }
}

/** Applique un nouvel échantillon : état visible, historique, fraîcheur, alarmes. */
function applySample(ctx: Ctx, index: number, sample: Sample): void {
  const rt = ctx.s.patients[index] as PatientRuntime;
  const anyReceived = VITAL_KEYS.some((k) => sample.readings[k].status !== 'UNAVAILABLE');
  ctx.s.patients[index] = {
    ...rt,
    current: sample,
    lastReceivedSecond: anyReceived ? sample.simulatedSecond : rt.lastReceivedSecond,
  };
  const id = rt.patient.id;
  if (!ctx.ownedHistory.has(id)) {
    ctx.s.history[id] = [...ctx.s.history[id]];
    ctx.ownedHistory.add(id);
  }
  pushSample(ctx.s.history[id], sample);
  evaluateAlarms(ctx, sample);
}

/** Recalcule un patient à l'instant courant sans avancer l'horloge (SIM-008, MAN-004). */
function refreshPatient(ctx: Ctx, index: number): void {
  applySample(ctx, index, computeSample(ctx.s, ctx.s.patients[index] as PatientRuntime));
}

const patientIndex = (s: EngineState, id: PatientId) => s.patients.findIndex((p) => p.patient.id === id);

/** SIM-001 : état initial déterministe à la seconde 0, sans tick. */
export function createInitialState(
  config: EngineConfig,
  at: number,
  carry: Pick<EngineState, 'journal' | 'nextEventSeq'> = { journal: [], nextEventSeq: 1 },
): EngineState {
  const patients = createPatients();
  const history = {} as Record<PatientId, Sample[]>;
  const runtimes: PatientRuntime[] = patients.map((patient, index) => {
    history[patient.id] = [];
    return {
      patient,
      index,
      scenarioStartSecond: 0,
      pendingScenarioId: null,
      current: { patientId: patient.id, simulatedSecond: 0, readings: validateReadings(computeScenario(patient.scenarioId, 0, config.seed, index), 0) },
      lastReceivedSecond: null,
    };
  });
  const base: EngineState = {
    simulatorState: 'INITIALIZED',
    simulatedSecond: 0,
    speed: config.speed,
    seed: config.seed,
    thresholds: config.thresholds,
    patients: runtimes,
    overrides: [],
    alarms: [],
    history,
    journal: carry.journal,
    nextAlarmSeq: 1,
    nextEventSeq: carry.nextEventSeq,
  };
  const ctx = begin(base, at);
  for (let i = 0; i < runtimes.length; i++) refreshPatient(ctx, i);
  return finish(ctx);
}

/** SIM-002 : un pas virtuel de 1 s → un échantillon par patient, puis alarmes et journal. */
function step(ctx: Ctx): void {
  ctx.s.simulatedSecond += 1;
  const second = ctx.s.simulatedSecond;
  for (let i = 0; i < ctx.s.patients.length; i++) {
    const rt = ctx.s.patients[i] as PatientRuntime;
    if (rt.pendingScenarioId) {
      ctx.s.patients[i] = {
        ...rt,
        patient: { ...rt.patient, scenarioId: rt.pendingScenarioId },
        scenarioStartSecond: second,
        pendingScenarioId: null,
      };
    }
    refreshPatient(ctx, i);
  }
}

export function reduce(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'START': {
      if (state.simulatorState !== 'INITIALIZED') return state;
      const ctx = begin(state, action.at);
      ctx.s.simulatorState = 'RUNNING';
      log(ctx, { type: 'SIM_STARTED' });
      return finish(ctx);
    }
    case 'PAUSE':
    case 'AUTO_PAUSE': {
      if (state.simulatorState !== 'RUNNING') return state;
      const ctx = begin(state, action.at);
      ctx.s.simulatorState = 'PAUSED';
      log(ctx, { type: action.type === 'PAUSE' ? 'SIM_PAUSED' : 'AUTO_PAUSE' });
      return finish(ctx);
    }
    case 'RESUME': {
      if (state.simulatorState !== 'PAUSED') return state;
      const ctx = begin(state, action.at);
      ctx.s.simulatorState = 'RUNNING';
      log(ctx, { type: 'SIM_RESUMED' });
      return finish(ctx);
    }
    case 'RESET': {
      // SIM-005 : tout est remis à zéro sauf la graine, la vitesse et les seuils configurés.
      const fresh = createInitialState({ seed: state.seed, speed: state.speed, thresholds: state.thresholds }, action.at);
      const ctx = begin(fresh, action.at);
      log(ctx, { type: 'SIM_RESET' });
      return finish(ctx);
    }
    case 'TICK': {
      if (state.simulatorState !== 'RUNNING' || action.steps <= 0) return state;
      const ctx = begin(state, action.at);
      for (let i = 0; i < action.steps; i++) step(ctx);
      return finish(ctx);
    }
    case 'SET_SPEED': {
      if (state.speed === action.speed) return state;
      const ctx = begin(state, action.at);
      ctx.s.speed = action.speed;
      log(ctx, { type: 'SPEED_CHANGED', payload: { from: state.speed, to: action.speed } });
      return finish(ctx);
    }
    case 'SET_SEED': {
      // La graine ne change qu'avant le démarrage, pour préserver la reproductibilité (SIM-006).
      if (state.simulatorState !== 'INITIALIZED' || state.seed === action.seed || !Number.isInteger(action.seed)) return state;
      const fresh = createInitialState({ seed: action.seed, speed: state.speed, thresholds: state.thresholds }, action.at, state);
      const ctx = begin(fresh, action.at);
      log(ctx, { type: 'SETTINGS_CHANGED', payload: { setting: 'seed', from: state.seed, to: action.seed } });
      return finish(ctx);
    }
    case 'SET_SCENARIO': {
      const index = patientIndex(state, action.patientId);
      const rt = state.patients[index];
      if (!rt) return state;
      const target = rt.pendingScenarioId ?? rt.patient.scenarioId;
      if (target === action.scenarioId) return state;
      const ctx = begin(state, action.at);
      ctx.s.patients[index] = { ...rt, pendingScenarioId: action.scenarioId };
      log(ctx, {
        type: 'SCENARIO_CHANGED',
        patientId: action.patientId,
        payload: { from: rt.patient.scenarioId, to: action.scenarioId },
      });
      return finish(ctx);
    }
    case 'SET_OVERRIDE': {
      const index = patientIndex(state, action.patientId);
      const rt = state.patients[index];
      if (!rt) return state;
      const reading = validateVital(action.vitalKey, action.raw, state.simulatedSecond);
      const ctx = begin(state, action.at);
      ctx.s.overrides = [
        ...state.overrides.filter((o) => !(o.patientId === action.patientId && o.vitalKey === action.vitalKey)),
        { patientId: action.patientId, vitalKey: action.vitalKey, raw: action.raw, reading },
      ];
      log(ctx, {
        type: 'MANUAL_OVERRIDE_SET',
        patientId: action.patientId,
        payload: {
          vitalKey: action.vitalKey,
          previous: readingSummary(rt.current.readings[action.vitalKey]),
          next: readingSummary(reading),
          raw: action.raw.received ? action.raw.value : null,
        },
      });
      refreshPatient(ctx, index);
      return finish(ctx);
    }
    case 'RELEASE_OVERRIDE': {
      const index = patientIndex(state, action.patientId);
      const rt = state.patients[index];
      const existing = state.overrides.find((o) => o.patientId === action.patientId && o.vitalKey === action.vitalKey);
      if (!rt || !existing) return state;
      const ctx = begin(state, action.at);
      ctx.s.overrides = state.overrides.filter((o) => o !== existing);
      const sample = computeSample(ctx.s, rt);
      log(ctx, {
        type: 'MANUAL_OVERRIDE_RELEASED',
        patientId: action.patientId,
        payload: {
          vitalKey: action.vitalKey,
          previous: readingSummary(rt.current.readings[action.vitalKey]),
          next: readingSummary(sample.readings[action.vitalKey]),
        },
      });
      applySample(ctx, index, sample);
      return finish(ctx);
    }
    case 'ACK_ALARM': {
      const acked = acknowledgeAlarm(state.alarms, action.alarmId, state.simulatedSecond);
      if (!acked) return state;
      const ctx = begin(state, action.at);
      ctx.s.alarms = state.alarms.map((a) => (a.id === acked.id ? acked : a));
      log(ctx, {
        type: 'ALARM_ACKNOWLEDGED',
        patientId: acked.patientId,
        payload: { alarmId: acked.id, vitalKey: acked.vitalKey, cause: acked.cause, severity: acked.severity },
      });
      return finish(ctx);
    }
    case 'SET_THRESHOLDS': {
      if (validateThresholds(action.thresholds).length > 0) return state;
      const ctx = begin(state, action.at);
      ctx.s.thresholds = action.thresholds;
      log(ctx, { type: 'SETTINGS_CHANGED', payload: { setting: 'thresholds' } });
      // THR-003 : réévaluation immédiate des dernières mesures, sans avancer le temps.
      for (const rt of ctx.s.patients) evaluateAlarms(ctx, rt.current);
      return finish(ctx);
    }
  }
}
