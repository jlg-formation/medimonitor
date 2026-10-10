import { describe, expect, it } from 'vitest';
import {
  acknowledgeAlarm,
  compareAlarms,
  patientLevel,
  reconcileVital,
  resolvedAlarms,
  unresolvedAlarms,
} from '../../src/domain/alarms';
import type { Alarm } from '../../src/domain/model';

const HIGH_WARN = { cause: 'HIGH', severity: 'WARNING' } as const;
const HIGH_CRIT = { cause: 'HIGH', severity: 'CRITICAL' } as const;

const alarm = (over: Partial<Alarm>): Alarm => ({
  id: 'A-000001',
  patientId: 'P-001',
  vitalKey: 'heartRate',
  cause: 'HIGH',
  severity: 'WARNING',
  state: 'ACTIVE',
  createdSecond: 0,
  acknowledgedSecond: null,
  resolvedSecond: null,
  ...over,
});

describe('reconcileVital', () => {
  it('crée un épisode ACTIVE à la première apparition', () => {
    const r = reconcileVital([], 'P-001', 'heartRate', HIGH_WARN, 5, 1);
    expect(r.alarms).toHaveLength(1);
    expect(r.alarms[0]).toMatchObject({ id: 'A-000001', state: 'ACTIVE', createdSecond: 5, ...HIGH_WARN });
    expect(r.transitions.map((t) => t.kind)).toEqual(['CREATED']);
    expect(r.nextAlarmSeq).toBe(2);
  });

  it('ALM-001 : pas de doublon pour une condition persistante', () => {
    const first = reconcileVital([], 'P-001', 'heartRate', HIGH_WARN, 5, 1);
    const second = reconcileVital(first.alarms, 'P-001', 'heartRate', HIGH_WARN, 6, first.nextAlarmSeq);
    expect(second.alarms).toBe(first.alarms);
    expect(second.transitions).toEqual([]);
  });

  it('ALM-003 : résout une alarme acquittée quand la condition disparaît', () => {
    const r = reconcileVital([alarm({ state: 'ACKNOWLEDGED', acknowledgedSecond: 2 })], 'P-001', 'heartRate', null, 9, 2);
    expect(r.alarms[0]).toMatchObject({ state: 'RESOLVED', resolvedSecond: 9 });
    expect(r.transitions.map((t) => t.kind)).toEqual(['RESOLVED']);
  });

  it('ALM-004 : une condition réapparue crée un nouvel épisode non acquitté', () => {
    const r = reconcileVital([alarm({ state: 'RESOLVED', resolvedSecond: 3 })], 'P-001', 'heartRate', HIGH_WARN, 10, 2);
    expect(r.alarms).toHaveLength(2);
    expect(r.alarms[1]).toMatchObject({ id: 'A-000002', state: 'ACTIVE', acknowledgedSecond: null });
  });

  it('ALM-005 : un changement de sévérité résout puis recrée', () => {
    const r = reconcileVital([alarm({ state: 'ACKNOWLEDGED' })], 'P-001', 'heartRate', HIGH_CRIT, 10, 2);
    expect(r.alarms.map((a) => [a.id, a.state, a.severity])).toEqual([
      ['A-000001', 'RESOLVED', 'WARNING'],
      ['A-000002', 'ACTIVE', 'CRITICAL'],
    ]);
    expect(r.transitions.map((t) => t.kind)).toEqual(['RESOLVED', 'CREATED']);
  });

  it("n'affecte pas les autres composantes ni les autres patients", () => {
    const others = [alarm({ vitalKey: 'spo2' }), alarm({ id: 'A-000002', patientId: 'P-002' })];
    const r = reconcileVital(others, 'P-001', 'heartRate', null, 1, 3);
    expect(r.alarms).toBe(others);
  });
});

describe('acknowledgeAlarm', () => {
  it('ALM-002 : ACTIVE → ACKNOWLEDGED en conservant sévérité et condition', () => {
    const acked = acknowledgeAlarm([alarm({ severity: 'CRITICAL' })], 'A-000001', 4);
    expect(acked).toMatchObject({ state: 'ACKNOWLEDGED', severity: 'CRITICAL', cause: 'HIGH', acknowledgedSecond: 4 });
  });
  it('ALM-008 : refuse une alarme déjà acquittée ou résolue', () => {
    expect(acknowledgeAlarm([alarm({ state: 'ACKNOWLEDGED' })], 'A-000001', 4)).toBeNull();
    expect(acknowledgeAlarm([alarm({ state: 'RESOLVED' })], 'A-000001', 4)).toBeNull();
    expect(acknowledgeAlarm([], 'A-404', 4)).toBeNull();
  });
});

describe('tri et état global', () => {
  const list = [
    alarm({ id: 'A-000003', severity: 'WARNING', createdSecond: 1 }),
    alarm({ id: 'A-000002', severity: 'CRITICAL', createdSecond: 5, state: 'ACKNOWLEDGED' }),
    alarm({ id: 'A-000001', severity: 'CRITICAL', createdSecond: 5 }),
    alarm({ id: 'A-000004', severity: 'INFORMATION', createdSecond: 0, patientId: 'P-002' }),
    alarm({ id: 'A-000005', severity: 'CRITICAL', state: 'RESOLVED', resolvedSecond: 8, patientId: 'P-003' }),
  ];

  it('ALM-007 : sévérité décroissante, création croissante, identifiant', () => {
    expect(unresolvedAlarms(list).map((a) => a.id)).toEqual(['A-000001', 'A-000002', 'A-000003', 'A-000004']);
    const sameSeverityAndSecond = [alarm({ id: 'A-000009' }), alarm({ id: 'A-000008' })];
    expect(sameSeverityAndSecond.sort(compareAlarms).map((a) => a.id)).toEqual(['A-000008', 'A-000009']);
  });

  it('sépare les alarmes résolues', () => {
    expect(resolvedAlarms(list).map((a) => a.id)).toEqual(['A-000005']);
    expect(unresolvedAlarms(list, 'P-002').map((a) => a.id)).toEqual(['A-000004']);
  });

  it('THR-004 : sévérité maximale, acquittées comprises, sinon NORMAL', () => {
    expect(patientLevel(list, 'P-001')).toBe('CRITICAL');
    expect(patientLevel([alarm({ severity: 'CRITICAL', state: 'ACKNOWLEDGED' })], 'P-001')).toBe('CRITICAL');
    expect(patientLevel(list, 'P-002')).toBe('INFORMATION');
    expect(patientLevel(list, 'P-003')).toBe('NORMAL');
    expect(patientLevel(list, 'P-008')).toBe('NORMAL');
  });
});
