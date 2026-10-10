import { describe, expect, it } from 'vitest';
import type { RawReadings, ScenarioId, VitalKey } from '../../src/domain/model';
import { VITAL_KEYS } from '../../src/domain/model';
import { BASELINE, computeScenario, SCENARIO_IDS } from '../../src/domain/scenarios';
import { DEFAULT_THRESHOLDS, classifyValue } from '../../src/domain/thresholds';
import { validateReadings } from '../../src/domain/validation';

const at = (id: ScenarioId, t: number) => computeScenario(id, t, 1234, 0);
const value = (r: RawReadings, k: VitalKey) => (r[k].received ? r[k].value : 'UNAVAILABLE');

describe('scénarios', () => {
  it('définit exactement huit scénarios', () => {
    expect(SCENARIO_IDS).toEqual(['SC-01', 'SC-02', 'SC-03', 'SC-04', 'SC-05', 'SC-06', 'SC-07', 'SC-08']);
  });

  it('SC-01 reste dans la zone normale et est déterministe', () => {
    for (let p = 0; p < 8; p++) {
      for (let t = 0; t < 300; t++) {
        const raw = computeScenario('SC-01', t, 42, p);
        expect(raw).toEqual(computeScenario('SC-01', t, 42, p));
        const readings = validateReadings(raw, t);
        for (const k of VITAL_KEYS) {
          expect(readings[k].status).toBe('VALID');
          expect(classifyValue(k, readings[k].value as number, DEFAULT_THRESHOLDS)).toBeNull();
        }
      }
    }
  });

  it('SC-01 varie selon la graine', () => {
    const a = Array.from({ length: 30 }, (_, t) => value(computeScenario('SC-01', t, 1, 0), 'heartRate'));
    const b = Array.from({ length: 30 }, (_, t) => value(computeScenario('SC-01', t, 2, 0), 'heartRate'));
    expect(a).not.toEqual(b);
  });

  it.each([
    [0, 75, 98], [30, 89, 96], [60, 104, 94], [120, 132, 89], [200, 132, 89],
  ])('SC-02 à t=%s : FC=%s, SpO2=%s', (t, hr, spo2) => {
    const r = at('SC-02', t);
    expect(value(r, 'heartRate')).toBe(hr);
    expect(value(r, 'spo2')).toBe(spo2);
    expect(value(r, 'temperature')).toBe(BASELINE.temperature);
    expect(value(r, 'systolic')).toBe(120);
  });

  it.each([
    [0, 132, 89], [60, 104, 94], [120, 75, 98], [150, 75, 98],
  ])('SC-03 à t=%s : FC=%s, SpO2=%s', (t, hr, spo2) => {
    const r = at('SC-03', t);
    expect(value(r, 'heartRate')).toBe(hr);
    expect(value(r, 'spo2')).toBe(spo2);
  });

  it.each([
    [0, 98], [29, 98], [30, 'UNAVAILABLE'], [45, 'UNAVAILABLE'], [59, 'UNAVAILABLE'], [60, 98], [90, 98],
  ])('SC-04 à t=%s : SpO2=%s', (t, spo2) => {
    expect(value(at('SC-04', t), 'spo2')).toBe(spo2);
    expect(value(at('SC-04', t), 'heartRate')).toBe(75);
  });

  it.each([
    [44, 36.8], [45, 99], [46, 36.8],
  ])('SC-05 à t=%s : température brute=%s', (t, temp) => {
    expect(value(at('SC-05', t), 'temperature')).toBe(temp);
  });

  it.each([
    [0, 110], [9, 110], [10, 80], [19, 80], [20, 110], [29, 110], [30, 80], [45, 110], [59, 80], [60, 110],
  ])('SC-06 à t=%s : FC=%s', (t, hr) => {
    expect(value(at('SC-06', t), 'heartRate')).toBe(hr);
  });

  it.each([
    [29, false], [30, true], [59, true], [60, true], [89, true], [90, false], [120, false],
  ])('SC-07 à t=%s : panne=%s', (t, down) => {
    const r = at('SC-07', t);
    for (const k of VITAL_KEYS) expect(r[k].received).toBe(!down);
  });

  it.each([
    [0, 80, 98], [10, 108, 93], [20, 135, 88], [45, 135, 88], [120, 135, 88],
  ])('SC-08 à t=%s : FC=%s, SpO2=%s', (t, hr, spo2) => {
    const r = at('SC-08', t);
    expect(value(r, 'heartRate')).toBe(hr);
    expect(value(r, 'spo2')).toBe(spo2);
  });
});
