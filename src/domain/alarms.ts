import type { Alarm, PatientId, PatientLevel, Severity, VitalKey } from './model';
import type { Condition } from './thresholds';

export const SEVERITY_RANK: Record<PatientLevel, number> = {
  CRITICAL: 3,
  WARNING: 2,
  INFORMATION: 1,
  NORMAL: 0,
};

export const isUnresolved = (a: Alarm) => a.state !== 'RESOLVED';

export interface AlarmTransition {
  kind: 'CREATED' | 'RESOLVED';
  alarm: Alarm;
}

export interface ReconcileResult {
  alarms: Alarm[];
  transitions: AlarmTransition[];
  nextAlarmSeq: number;
}

export const formatAlarmId = (seq: number) => `A-${String(seq).padStart(6, '0')}`;

/**
 * Aligne les alarmes d'une composante sur sa condition courante.
 * L'identité d'un épisode est (patient, composante, cause, sévérité) : tout changement
 * résout l'épisode courant et en crée un nouveau (ALM-001, ALM-003, ALM-004, ALM-005).
 */
export function reconcileVital(
  alarms: Alarm[],
  patientId: PatientId,
  vitalKey: VitalKey,
  condition: Condition | null,
  simulatedSecond: number,
  nextAlarmSeq: number,
): ReconcileResult {
  const transitions: AlarmTransition[] = [];
  let matched = false;
  let seq = nextAlarmSeq;
  let changed = false;
  const next = alarms.map((a) => {
    if (a.patientId !== patientId || a.vitalKey !== vitalKey || !isUnresolved(a)) return a;
    if (condition && a.cause === condition.cause && a.severity === condition.severity) {
      matched = true;
      return a;
    }
    const resolved: Alarm = { ...a, state: 'RESOLVED', resolvedSecond: simulatedSecond };
    transitions.push({ kind: 'RESOLVED', alarm: resolved });
    changed = true;
    return resolved;
  });
  if (condition && !matched) {
    const created: Alarm = {
      id: formatAlarmId(seq++),
      patientId,
      vitalKey,
      cause: condition.cause,
      severity: condition.severity,
      state: 'ACTIVE',
      createdSecond: simulatedSecond,
      acknowledgedSecond: null,
      resolvedSecond: null,
    };
    next.push(created);
    transitions.push({ kind: 'CREATED', alarm: created });
    changed = true;
  }
  return { alarms: changed ? next : alarms, transitions, nextAlarmSeq: seq };
}

/** ALM-002 / ALM-008 : seule une alarme ACTIVE peut être acquittée. */
export function acknowledgeAlarm(alarms: Alarm[], alarmId: string, simulatedSecond: number): Alarm | null {
  const alarm = alarms.find((a) => a.id === alarmId);
  if (!alarm || alarm.state !== 'ACTIVE') return null;
  return { ...alarm, state: 'ACKNOWLEDGED', acknowledgedSecond: simulatedSecond };
}

/** ALM-007 : sévérité décroissante, puis seconde de création croissante, puis identifiant. */
export function compareAlarms(a: Alarm, b: Alarm): number {
  return (
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
    a.createdSecond - b.createdSecond ||
    a.id.localeCompare(b.id)
  );
}

export function unresolvedAlarms(alarms: Alarm[], patientId?: PatientId): Alarm[] {
  return alarms
    .filter((a) => isUnresolved(a) && (patientId === undefined || a.patientId === patientId))
    .sort(compareAlarms);
}

export function resolvedAlarms(alarms: Alarm[], patientId?: PatientId): Alarm[] {
  return alarms
    .filter((a) => a.state === 'RESOLVED' && (patientId === undefined || a.patientId === patientId))
    .sort((a, b) => (b.resolvedSecond ?? 0) - (a.resolvedSecond ?? 0) || b.id.localeCompare(a.id));
}

/** THR-004 : sévérité maximale des alarmes non résolues (acquittées comprises), sinon NORMAL. */
export function patientLevel(alarms: Alarm[], patientId: PatientId): PatientLevel {
  let level: PatientLevel = 'NORMAL';
  for (const a of alarms) {
    if (a.patientId === patientId && isUnresolved(a) && SEVERITY_RANK[a.severity] > SEVERITY_RANK[level]) {
      level = a.severity as Severity;
    }
  }
  return level;
}
