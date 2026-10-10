import { describe, expect, it } from 'vitest';
import { unresolvedAlarms, patientLevel } from '../../src/domain/alarms';
import { createInitialState, reduce, type Action } from '../../src/domain/engine';
import type { EngineState, PatientId, VitalKey } from '../../src/domain/model';
import { DEFAULT_THRESHOLDS } from '../../src/domain/thresholds';
import { NOT_RECEIVED, received } from '../../src/domain/validation';

const AT = 1_700_000_000_000;
const init = (seed = 1234) => createInitialState({ seed, speed: 1, thresholds: DEFAULT_THRESHOLDS }, AT);
const run = (s: EngineState, ...actions: Action[]) => actions.reduce(reduce, s);
const start = (s: EngineState) => reduce(s, { type: 'START', at: AT });
const tick = (s: EngineState, steps = 1) => reduce(s, { type: 'TICK', steps, at: AT });
const patient = (s: EngineState, id: PatientId) => s.patients.find((p) => p.patient.id === id)!;
const reading = (s: EngineState, id: PatientId, k: VitalKey) => patient(s, id).current.readings[k];
const override = (patientId: PatientId, vitalKey: VitalKey, value: unknown): Action =>
  ({ type: 'SET_OVERRIDE', patientId, vitalKey, raw: received(value), at: AT });
const types = (s: EngineState) => s.journal.map((e) => e.type);

describe('AC-01 démarrage et pause (SIM-001…004)', () => {
  it('état initial : 8 patients, seconde 0, aucun tick avant démarrage', () => {
    const s = init();
    expect(s.simulatorState).toBe('INITIALIZED');
    expect(s.simulatedSecond).toBe(0);
    expect(s.patients).toHaveLength(8);
    expect(s.patients.map((p) => p.patient.label)).toEqual(
      ['Patient 01', 'Patient 02', 'Patient 03', 'Patient 04', 'Patient 05', 'Patient 06', 'Patient 07', 'Patient 08'],
    );
    expect(s.patients.every((p) => p.patient.scenarioId === 'SC-01')).toBe(true);
    expect(tick(s)).toBe(s);
  });

  it('un pas produit un échantillon par patient', () => {
    const s = tick(start(init()));
    expect(s.simulatorState).toBe('RUNNING');
    expect(s.simulatedSecond).toBe(1);
    for (const p of s.patients) expect(s.history[p.patient.id].map((x) => x.simulatedSecond)).toEqual([0, 1]);
  });

  it('pause gèle le temps, reprise continue sans saut', () => {
    let s = tick(start(init()), 5);
    s = reduce(s, { type: 'PAUSE', at: AT });
    expect(s.simulatorState).toBe('PAUSED');
    expect(tick(s, 10)).toBe(s);
    s = tick(reduce(s, { type: 'RESUME', at: AT }));
    expect(s.simulatedSecond).toBe(6);
    expect(types(s)).toEqual(['SIM_STARTED', 'SIM_PAUSED', 'SIM_RESUMED']);
  });

  it('changer la vitesse ne réinitialise rien', () => {
    const s = run(tick(start(init()), 3), { type: 'SET_SPEED', speed: 10, at: AT });
    expect(s.speed).toBe(10);
    expect(s.simulatedSecond).toBe(3);
    expect(s.journal.at(-1)).toMatchObject({ type: 'SPEED_CHANGED', payload: { from: 1, to: 10 } });
  });

  it('SIM-007 : AUTO_PAUSE uniquement en RUNNING', () => {
    expect(reduce(init(), { type: 'AUTO_PAUSE', at: AT }).simulatorState).toBe('INITIALIZED');
    const s = reduce(start(init()), { type: 'AUTO_PAUSE', at: AT });
    expect(s.simulatorState).toBe('PAUSED');
    expect(types(s)).toContain('AUTO_PAUSE');
  });
});

describe('AC-02 reproductibilité (SIM-006)', () => {
  const scenarioActions = (s: EngineState) =>
    run(s,
      { type: 'SET_SCENARIO', patientId: 'P-002', scenarioId: 'SC-02', at: AT },
      { type: 'SET_SCENARIO', patientId: 'P-004', scenarioId: 'SC-07', at: AT },
      { type: 'SET_SCENARIO', patientId: 'P-006', scenarioId: 'SC-06', at: AT },
    );
  const business = (s: EngineState) => ({
    samples: s.history,
    alarms: s.alarms,
    events: s.journal.map(({ realTimestamp: _ignored, ...e }) => e),
  });

  it('même graine : x1 (120 pas unitaires) = x10 (12 lots de 10)', () => {
    let slow = start(scenarioActions(init(1234)));
    for (let i = 0; i < 120; i++) slow = reduce(slow, { type: 'TICK', steps: 1, at: AT + i * 1000 });
    let fast = start(scenarioActions(reduce(slow, { type: 'RESET', at: AT + 999_999 })));
    fast = run(fast, { type: 'SET_SPEED', speed: 10, at: AT });
    for (let i = 0; i < 12; i++) fast = reduce(fast, { type: 'TICK', steps: 10, at: AT + i * 100 });
    const slowBusiness = business(slow);
    const fastBusiness = business(fast);
    expect(fastBusiness.samples).toEqual(slowBusiness.samples);
    expect(fastBusiness.alarms).toEqual(slowBusiness.alarms);
    // Le journal rapide contient en plus SIM_RESET et SPEED_CHANGED : on compare les transitions d'alarme.
    const alarmEvents = (b: ReturnType<typeof business>) =>
      b.events.filter((e) => e.type.startsWith('ALARM_')).map(({ id: _id, ...e }) => e);
    expect(alarmEvents(fastBusiness)).toEqual(alarmEvents(slowBusiness));
    expect(alarmEvents(slowBusiness).length).toBeGreaterThan(0);
  });

  it('graines différentes → mesures différentes', () => {
    expect(tick(start(init(1)), 30).history).not.toEqual(tick(start(init(2)), 30).history);
  });
});

describe('scénarios dans le moteur', () => {
  it('le changement de scénario prend effet au pas suivant, seconde locale 0', () => {
    let s = tick(start(init()), 10);
    s = reduce(s, { type: 'SET_SCENARIO', patientId: 'P-001', scenarioId: 'SC-08', at: AT });
    expect(patient(s, 'P-001').patient.scenarioId).toBe('SC-01');
    expect(patient(s, 'P-001').pendingScenarioId).toBe('SC-08');
    expect(s.journal.at(-1)).toMatchObject({ type: 'SCENARIO_CHANGED', patientId: 'P-001', payload: { from: 'SC-01', to: 'SC-08' } });
    s = tick(s);
    expect(patient(s, 'P-001').patient.scenarioId).toBe('SC-08');
    expect(reading(s, 'P-001', 'heartRate').value).toBe(80);
    s = tick(s, 20);
    expect(reading(s, 'P-001', 'heartRate').value).toBe(135);
  });

  it('SC-02 déclenche des alarmes FC et SpO2 sur 120 s', () => {
    const s = tick(start(run(init(), { type: 'SET_SCENARIO', patientId: 'P-002', scenarioId: 'SC-02', at: AT })), 121);
    expect(reading(s, 'P-002', 'heartRate').value).toBe(132);
    expect(reading(s, 'P-002', 'spo2').value).toBe(89);
    expect(patientLevel(s.alarms, 'P-002')).toBe('CRITICAL');
    const active = unresolvedAlarms(s.alarms, 'P-002').map((a) => `${a.vitalKey}/${a.cause}/${a.severity}`);
    expect(active.sort()).toEqual(['heartRate/HIGH/CRITICAL', 'spo2/LOW/CRITICAL']);
    expect(s.alarms.filter((a) => a.patientId === 'P-002' && a.state === 'RESOLVED')).toHaveLength(2);
  });
});

describe('AC-04 override maintenu (MAN-001…005)', () => {
  it('impose, maintient 30 s, puis libère', () => {
    let s = run(init(), override('P-001', 'heartRate', 125));
    expect(s.simulatedSecond).toBe(0);
    expect(reading(s, 'P-001', 'heartRate').value).toBe(125);
    const crit = unresolvedAlarms(s.alarms, 'P-001');
    expect(crit).toMatchObject([{ vitalKey: 'heartRate', severity: 'CRITICAL', state: 'ACTIVE' }]);
    expect(types(s)).toEqual(['MANUAL_OVERRIDE_SET', 'ALARM_CREATED']);
    expect(s.journal[0]?.payload).toMatchObject({ vitalKey: 'heartRate', next: { value: 125, status: 'VALID' } });

    s = tick(start(s), 30);
    expect(reading(s, 'P-001', 'heartRate').value).toBe(125);
    expect(s.overrides).toHaveLength(1);
    expect(s.alarms.filter((a) => a.patientId === 'P-001')).toHaveLength(1);
    // Les autres composantes continuent d'évoluer.
    const spo2 = new Set(s.history['P-001'].map((x) => x.readings.systolic.value));
    expect(spo2.size).toBeGreaterThan(1);

    s = reduce(s, { type: 'RELEASE_OVERRIDE', patientId: 'P-001', vitalKey: 'heartRate', at: AT });
    expect(s.simulatedSecond).toBe(30);
    expect(s.overrides).toEqual([]);
    const hr = reading(s, 'P-001', 'heartRate').value as number;
    expect(hr).toBeGreaterThanOrEqual(72);
    expect(hr).toBeLessThanOrEqual(78);
    expect(unresolvedAlarms(s.alarms, 'P-001')).toEqual([]);
    expect(types(s).slice(-2)).toEqual(['MANUAL_OVERRIDE_RELEASED', 'ALARM_RESOLVED']);
  });

  it("l'override survit au changement de scénario", () => {
    let s = run(init(), override('P-001', 'spo2', 99), { type: 'SET_SCENARIO', patientId: 'P-001', scenarioId: 'SC-02', at: AT });
    s = tick(start(s), 121); // seconde locale 120
    expect(reading(s, 'P-001', 'spo2').value).toBe(99);
    expect(reading(s, 'P-001', 'heartRate').value).toBe(132);
  });

  it('un override « indisponible » donne UNAVAILABLE et une alarme INFORMATION', () => {
    const s = run(init(), { type: 'SET_OVERRIDE', patientId: 'P-005', vitalKey: 'spo2', raw: NOT_RECEIVED, at: AT });
    expect(reading(s, 'P-005', 'spo2')).toMatchObject({ value: null, status: 'UNAVAILABLE' });
    expect(unresolvedAlarms(s.alarms, 'P-005')).toMatchObject([{ cause: 'UNAVAILABLE', severity: 'INFORMATION' }]);
  });

  it('libérer sans override ne fait rien', () => {
    const s = init();
    expect(reduce(s, { type: 'RELEASE_OVERRIDE', patientId: 'P-001', vitalKey: 'spo2', at: AT })).toBe(s);
  });
});

describe('AC-05 / AC-11 acquittement', () => {
  it('reste visible, CRITICAL, valeur inchangée', () => {
    let s = run(init(), override('P-002', 'heartRate', 125));
    const id = unresolvedAlarms(s.alarms, 'P-002')[0]!.id;
    s = reduce(s, { type: 'ACK_ALARM', alarmId: id, at: AT });
    expect(unresolvedAlarms(s.alarms, 'P-002')).toMatchObject([{ id, state: 'ACKNOWLEDGED', severity: 'CRITICAL' }]);
    expect(patientLevel(s.alarms, 'P-002')).toBe('CRITICAL');
    expect(reading(s, 'P-002', 'heartRate').value).toBe(125);
    expect(s.journal.at(-1)).toMatchObject({ type: 'ALARM_ACKNOWLEDGED', payload: { alarmId: id } });
    // ALM-008 : double acquittement sans effet.
    expect(reduce(s, { type: 'ACK_ALARM', alarmId: id, at: AT })).toBe(s);
    // La condition persiste au fil des ticks.
    s = tick(start(s), 5);
    expect(unresolvedAlarms(s.alarms, 'P-002')).toMatchObject([{ id, state: 'ACKNOWLEDGED' }]);
  });
});

describe('AC-06 résolution sans acquittement', () => {
  it('WARNING → RESOLVED, conservée dans l’historique', () => {
    let s = run(init(), override('P-003', 'heartRate', 110));
    const id = unresolvedAlarms(s.alarms, 'P-003')[0]!.id;
    s = run(s, override('P-003', 'heartRate', 80));
    expect(unresolvedAlarms(s.alarms, 'P-003')).toEqual([]);
    expect(s.alarms.find((a) => a.id === id)).toMatchObject({ state: 'RESOLVED', acknowledgedSecond: null });
  });
});

describe('AC-07 donnée invalide', () => {
  it('température 99 → INVALID et INFORMATION, pas de seuil', () => {
    let s = run(init(), { type: 'SET_SCENARIO', patientId: 'P-003', scenarioId: 'SC-05', at: AT });
    s = tick(start(s), 46); // seconde locale 45 au pas 46
    expect(reading(s, 'P-003', 'temperature')).toMatchObject({ value: null, status: 'INVALID' });
    const alarms = unresolvedAlarms(s.alarms, 'P-003');
    expect(alarms).toMatchObject([{ vitalKey: 'temperature', cause: 'INVALID', severity: 'INFORMATION' }]);
    s = tick(s);
    expect(reading(s, 'P-003', 'temperature')).toMatchObject({ value: 36.8, status: 'VALID' });
    expect(unresolvedAlarms(s.alarms, 'P-003')).toEqual([]);
  });
});

describe('AC-08 panne de communication', () => {
  it('UNAVAILABLE de 30 à 89, reprise et résolution à 90', () => {
    let s = run(init(), { type: 'SET_SCENARIO', patientId: 'P-004', scenarioId: 'SC-07', at: AT });
    s = tick(start(s), 30); // seconde locale 29
    expect(reading(s, 'P-004', 'heartRate').status).toBe('VALID');
    s = tick(s);
    for (const k of ['heartRate', 'spo2', 'temperature', 'systolic', 'diastolic'] as const) {
      expect(reading(s, 'P-004', k)).toMatchObject({ value: null, status: 'UNAVAILABLE' });
    }
    expect(unresolvedAlarms(s.alarms, 'P-004')).toHaveLength(5);
    const freshness = patient(s, 'P-004').lastReceivedSecond;
    s = tick(s, 59); // seconde locale 89
    expect(reading(s, 'P-004', 'spo2').status).toBe('UNAVAILABLE');
    expect(patient(s, 'P-004').lastReceivedSecond).toBe(freshness);
    s = tick(s); // seconde locale 90
    expect(reading(s, 'P-004', 'spo2')).toMatchObject({ value: 98, status: 'VALID' });
    expect(unresolvedAlarms(s.alarms, 'P-004')).toEqual([]);
    expect(s.alarms.filter((a) => a.patientId === 'P-004' && a.state === 'RESOLVED')).toHaveLength(5);
  });
});

describe('AC-09 reset (SIM-005)', () => {
  it('remet tout à zéro sauf graine, vitesse et seuils', () => {
    const thresholds = structuredClone(DEFAULT_THRESHOLDS);
    thresholds.heartRate.warningHigh = 105;
    let s = run(init(77),
      { type: 'SET_SPEED', speed: 5, at: AT },
      { type: 'SET_THRESHOLDS', thresholds, at: AT },
      { type: 'SET_SCENARIO', patientId: 'P-002', scenarioId: 'SC-08', at: AT },
      override('P-001', 'heartRate', 125),
    );
    s = tick(start(s), 40);
    expect(s.alarms.length).toBeGreaterThan(0);
    s = reduce(s, { type: 'RESET', at: AT });
    expect(s.simulatorState).toBe('INITIALIZED');
    expect(s.simulatedSecond).toBe(0);
    expect(s.overrides).toEqual([]);
    expect(s.alarms).toEqual([]);
    expect(s.patients.every((p) => p.patient.scenarioId === 'SC-01' && p.pendingScenarioId === null)).toBe(true);
    expect(Object.values(s.history).every((h) => h.length === 1)).toBe(true);
    expect(types(s)).toEqual(['SIM_RESET']);
    expect(s.seed).toBe(77);
    expect(s.speed).toBe(5);
    expect(s.thresholds).toBe(thresholds);
    expect(s).toEqual(run(createInitialState({ seed: 77, speed: 5, thresholds }, AT), { type: 'RESET', at: AT }));
  });
});

describe('AC-12 pression incohérente (MAN-003)', () => {
  it('PAS=70 avec PAD=80 → paire INVALID, INFORMATION', () => {
    let s = run(init(), override('P-006', 'diastolic', 80), override('P-006', 'systolic', 70));
    expect(reading(s, 'P-006', 'systolic')).toMatchObject({ value: null, status: 'INVALID' });
    expect(reading(s, 'P-006', 'diastolic')).toMatchObject({ value: null, status: 'INVALID' });
    const alarms = unresolvedAlarms(s.alarms, 'P-006');
    expect(alarms.map((a) => `${a.vitalKey}/${a.cause}/${a.severity}`).sort()).toEqual([
      'diastolic/INVALID/INFORMATION',
      'systolic/INVALID/INFORMATION',
    ]);
    s = reduce(s, { type: 'RELEASE_OVERRIDE', patientId: 'P-006', vitalKey: 'systolic', at: AT });
    expect(reading(s, 'P-006', 'diastolic')).toMatchObject({ value: 80, status: 'VALID' });
  });
});

describe('seuils et graine', () => {
  it('THR-003 : changer les seuils réévalue sans avancer le temps', () => {
    let s = run(init(), override('P-001', 'heartRate', 105));
    expect(unresolvedAlarms(s.alarms, 'P-001')).toMatchObject([{ severity: 'WARNING' }]);
    const thresholds = structuredClone(DEFAULT_THRESHOLDS);
    thresholds.heartRate.warningHigh = 110;
    s = reduce(s, { type: 'SET_THRESHOLDS', thresholds, at: AT });
    expect(s.simulatedSecond).toBe(0);
    expect(unresolvedAlarms(s.alarms, 'P-001')).toEqual([]);
    expect(types(s).slice(-2)).toEqual(['SETTINGS_CHANGED', 'ALARM_RESOLVED']);
  });

  it('THR-002 : un paramétrage invalide est ignoré', () => {
    const s = init();
    const bad = structuredClone(DEFAULT_THRESHOLDS);
    bad.spo2.criticalLow = 99;
    expect(reduce(s, { type: 'SET_THRESHOLDS', thresholds: bad, at: AT })).toBe(s);
  });

  it('la graine ne change qu’avant le démarrage', () => {
    const s = reduce(init(1), { type: 'SET_SEED', seed: 2, at: AT });
    expect(s.seed).toBe(2);
    expect(s.patients[0]?.current).toEqual(init(2).patients[0]?.current);
    expect(s.journal.at(-1)).toMatchObject({ type: 'SETTINGS_CHANGED', payload: { setting: 'seed' } });
    const running = start(s);
    expect(reduce(running, { type: 'SET_SEED', seed: 3, at: AT })).toBe(running);
  });
});

describe('limites mémoire', () => {
  it('HIS-001 : historique borné à 3600 secondes', () => {
    const s = tick(start(init()), 3700);
    expect(s.history['P-001']).toHaveLength(3600);
    expect(s.history['P-001'][0]?.simulatedSecond).toBe(101);
  });
});
