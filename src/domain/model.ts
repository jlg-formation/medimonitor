// Types du domaine MediMonitor (spécification §4.1). Aucun import React ici.

export type PatientId = 'P-001' | 'P-002' | 'P-003' | 'P-004' | 'P-005' | 'P-006' | 'P-007' | 'P-008';
export type VitalKey = 'heartRate' | 'spo2' | 'temperature' | 'systolic' | 'diastolic';
export type MeasureStatus = 'VALID' | 'INVALID' | 'UNAVAILABLE';
export type Severity = 'INFORMATION' | 'WARNING' | 'CRITICAL';
export type PatientLevel = Severity | 'NORMAL';
export type SimulatorState = 'INITIALIZED' | 'RUNNING' | 'PAUSED';
export type AlarmState = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlarmCause = 'LOW' | 'HIGH' | 'INVALID' | 'UNAVAILABLE';
export type Speed = 1 | 5 | 10;
export type ScenarioId = 'SC-01' | 'SC-02' | 'SC-03' | 'SC-04' | 'SC-05' | 'SC-06' | 'SC-07' | 'SC-08';

export const VITAL_KEYS: readonly VitalKey[] = ['heartRate', 'spo2', 'temperature', 'systolic', 'diastolic'];
export const SPEEDS: readonly Speed[] = [1, 5, 10];

export interface Reading {
  value: number | null;
  status: MeasureStatus;
  simulatedSecond: number;
}

export interface Patient {
  id: PatientId;
  label: string;
  scenarioId: ScenarioId;
}

export interface Sample {
  patientId: PatientId;
  simulatedSecond: number;
  readings: Record<VitalKey, Reading>;
}

/** Valeur brute reçue d'un capteur ou saisie. `received: false` = donnée non reçue. */
export type RawValue = { received: false } | { received: true; value: unknown };
export type RawReadings = Record<VitalKey, RawValue>;

export interface ManualOverride {
  patientId: PatientId;
  vitalKey: VitalKey;
  raw: RawValue;
  reading: Reading;
}

export interface VitalThresholds {
  criticalLow: number;
  warningLow: number;
  /** null : pas de seuil haut (SpO2). */
  warningHigh: number | null;
  criticalHigh: number | null;
}
export type Thresholds = Record<VitalKey, VitalThresholds>;

export interface Alarm {
  id: string;
  patientId: PatientId;
  vitalKey: VitalKey;
  cause: AlarmCause;
  severity: Severity;
  state: AlarmState;
  createdSecond: number;
  acknowledgedSecond: number | null;
  resolvedSecond: number | null;
}

export type EventType =
  | 'SIM_STARTED'
  | 'SIM_PAUSED'
  | 'SIM_RESUMED'
  | 'SIM_RESET'
  | 'AUTO_PAUSE'
  | 'SPEED_CHANGED'
  | 'SCENARIO_CHANGED'
  | 'MANUAL_OVERRIDE_SET'
  | 'MANUAL_OVERRIDE_RELEASED'
  | 'ALARM_CREATED'
  | 'ALARM_ACKNOWLEDGED'
  | 'ALARM_RESOLVED'
  | 'SETTINGS_CHANGED';

export const EVENT_TYPES: readonly EventType[] = [
  'SIM_STARTED', 'SIM_PAUSED', 'SIM_RESUMED', 'SIM_RESET', 'AUTO_PAUSE', 'SPEED_CHANGED',
  'SCENARIO_CHANGED', 'MANUAL_OVERRIDE_SET', 'MANUAL_OVERRIDE_RELEASED', 'ALARM_CREATED',
  'ALARM_ACKNOWLEDGED', 'ALARM_RESOLVED', 'SETTINGS_CHANGED',
];

export interface LogEvent {
  id: string;
  type: EventType;
  patientId?: PatientId;
  simulatedSecond: number;
  realTimestamp: number;
  payload: Record<string, unknown>;
}

export type ChartWindow = 60 | 300 | 900 | 3600;
export const CHART_WINDOWS: readonly ChartWindow[] = [60, 300, 900, 3600];

export interface DisplayPreferences {
  /** Fenêtre affichée sur les courbes, en secondes simulées. */
  chartWindowSeconds: ChartWindow;
}

/** Réglages persistés (HIS-004). */
export interface Settings {
  speed: Speed;
  seed: number;
  thresholds: Thresholds;
  display: DisplayPreferences;
}

export interface PatientRuntime {
  patient: Patient;
  index: number;
  /** Seconde simulée globale correspondant à la seconde locale 0 du scénario actif. */
  scenarioStartSecond: number;
  /** Scénario choisi, appliqué au prochain pas simulé. */
  pendingScenarioId: ScenarioId | null;
  current: Sample;
  /** Dernière seconde où au moins une composante a été reçue (fraîcheur). */
  lastReceivedSecond: number | null;
}

export interface EngineState {
  simulatorState: SimulatorState;
  simulatedSecond: number;
  speed: Speed;
  seed: number;
  thresholds: Thresholds;
  patients: PatientRuntime[];
  overrides: ManualOverride[];
  alarms: Alarm[];
  history: Record<PatientId, Sample[]>;
  journal: LogEvent[];
  nextAlarmSeq: number;
  nextEventSeq: number;
}
