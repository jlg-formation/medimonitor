/**
 * MediMonitor — TP4 — Tests unitaires de classifyValue (corrigé formateur).
 *
 * Exécution : npm run test:tp4:corrige
 * Campagne de mutants : npm run test:tp4:mutants -- exercices/corriges/tp4
 *
 * Oracle : spécification §8 (docs/specification.md). Chaque composante est testée
 * par partition (une valeur représentative) et à chaque frontière (dernière valeur
 * d'une classe / première valeur de la suivante).
 */
import { describe, expect, it } from 'vitest';
import type { Thresholds, VitalKey } from '../../../src/domain/model';
import { classifyValue, DEFAULT_THRESHOLDS } from '../../../src/domain/thresholds';

const LOW_CRITICAL = { cause: 'LOW', severity: 'CRITICAL' } as const;
const LOW_WARNING = { cause: 'LOW', severity: 'WARNING' } as const;
const HIGH_WARNING = { cause: 'HIGH', severity: 'WARNING' } as const;
const HIGH_CRITICAL = { cause: 'HIGH', severity: 'CRITICAL' } as const;
const NORMAL = null;

type Expected = typeof LOW_CRITICAL | typeof LOW_WARNING | typeof HIGH_WARNING | typeof HIGH_CRITICAL | null;

const classify = (key: VitalKey, value: number) => classifyValue(key, value, DEFAULT_THRESHOLDS);

describe('fréquence cardiaque — CRITICAL x<50 · WARNING 50≤x<60 ou 100<x≤120', () => {
  it.each<[number, Expected]>([
    [30, LOW_CRITICAL],
    [49, LOW_CRITICAL], // dernière valeur CRITICAL bas
    [50, LOW_WARNING], // première valeur WARNING bas
    [59, LOW_WARNING],
    [60, NORMAL], // première valeur NORMAL
    [75, NORMAL],
    [100, NORMAL], // AC-03 : dernière valeur NORMAL
    [101, HIGH_WARNING],
    [120, HIGH_WARNING], // AC-03 : dernière valeur WARNING haut
    [121, HIGH_CRITICAL], // AC-03 : première valeur CRITICAL haut
    [180, HIGH_CRITICAL],
  ])('%s bpm → %o', (value, expected) => {
    expect(classify('heartRate', value)).toEqual(expected);
  });
});

describe('SpO2 — CRITICAL x<92 · WARNING 92≤x<95 · pas de seuil haut', () => {
  it.each<[number, Expected]>([
    [85, LOW_CRITICAL],
    [91, LOW_CRITICAL],
    [92, LOW_WARNING],
    [94, LOW_WARNING],
    [95, NORMAL],
    [98, NORMAL],
    [100, NORMAL], // maximum du domaine : aucun seuil haut ne doit se déclencher
  ])('%s %% → %o', (value, expected) => {
    expect(classify('spo2', value)).toEqual(expected);
  });
});

describe('température — CRITICAL x<35 ou x>39 · WARNING 35≤x<36 ou 38<x≤39', () => {
  it.each<[number, Expected]>([
    [33, LOW_CRITICAL],
    [34.9, LOW_CRITICAL],
    [35, LOW_WARNING],
    [35.9, LOW_WARNING], // valeur décimale juste sous la frontière : pas d'arrondi
    [36, NORMAL],
    [37, NORMAL],
    [38, NORMAL],
    [38.1, HIGH_WARNING],
    [39, HIGH_WARNING],
    [39.1, HIGH_CRITICAL],
    [41, HIGH_CRITICAL],
  ])('%s °C → %o', (value, expected) => {
    expect(classify('temperature', value)).toEqual(expected);
  });
});

describe('pression systolique — CRITICAL x<90 ou x>160 · WARNING 90≤x<100 ou 140<x≤160', () => {
  it.each<[number, Expected]>([
    [70, LOW_CRITICAL],
    [89, LOW_CRITICAL],
    [90, LOW_WARNING],
    [99, LOW_WARNING],
    [100, NORMAL],
    [120, NORMAL],
    [140, NORMAL],
    [141, HIGH_WARNING],
    [160, HIGH_WARNING],
    [161, HIGH_CRITICAL],
    [200, HIGH_CRITICAL],
  ])('%s mmHg → %o', (value, expected) => {
    expect(classify('systolic', value)).toEqual(expected);
  });
});

describe('pression diastolique — CRITICAL x<60 ou x>100 · WARNING 60≤x<65 ou 90<x≤100', () => {
  it.each<[number, Expected]>([
    [40, LOW_CRITICAL],
    [59, LOW_CRITICAL],
    [60, LOW_WARNING],
    [64, LOW_WARNING],
    [65, NORMAL],
    [80, NORMAL],
    [90, NORMAL],
    [91, HIGH_WARNING],
    [100, HIGH_WARNING],
    [101, HIGH_CRITICAL],
    [120, HIGH_CRITICAL],
  ])('%s mmHg → %o', (value, expected) => {
    expect(classify('diastolic', value)).toEqual(expected);
  });
});

describe('utilisation du paramètre thresholds', () => {
  it('applique les seuils reçus et non les seuils par défaut', () => {
    const custom: Thresholds = structuredClone(DEFAULT_THRESHOLDS);
    custom.heartRate = { criticalLow: 80, warningLow: 90, warningHigh: 110, criticalHigh: 130 };

    // 75 bpm est NORMAL avec les seuils par défaut, CRITICAL avec ces seuils.
    expect(classifyValue('heartRate', 75, custom)).toEqual(LOW_CRITICAL);
    expect(classifyValue('heartRate', 85, custom)).toEqual(LOW_WARNING);
    expect(classifyValue('heartRate', 125, custom)).toEqual(HIGH_WARNING);
  });

  it('un seuil haut à null ne déclenche jamais de condition haute', () => {
    const custom: Thresholds = structuredClone(DEFAULT_THRESHOLDS);
    custom.heartRate = { criticalLow: 50, warningLow: 60, warningHigh: null, criticalHigh: null };

    expect(classifyValue('heartRate', 250, custom)).toBeNull();
  });

  it('ne modifie pas l\'objet de seuils reçu', () => {
    const frozen = Object.freeze(structuredClone(DEFAULT_THRESHOLDS));
    const before = structuredClone(frozen);

    classifyValue('temperature', 40, frozen);

    expect(frozen).toEqual(before);
  });
});

describe('contrat de retour', () => {
  it('une valeur NORMAL renvoie exactement null (ni undefined, ni objet)', () => {
    expect(classify('heartRate', 75)).toBeNull();
  });

  it('une valeur hors seuil renvoie un objet avec exactement cause et severity', () => {
    expect(Object.keys(classify('spo2', 90) ?? {}).sort()).toEqual(['cause', 'severity']);
  });

  // Hors contrat : la fonction suppose une valeur déjà validée (validateVital / conditionFor).
  it.todo('NaN, Infinity : comportement à arbitrer par le Product Owner (question Q1 du corrigé)');
});
