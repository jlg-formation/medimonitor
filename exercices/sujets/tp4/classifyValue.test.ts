/**
 * MediMonitor — TP4 — Tests unitaires de classifyValue (fichier de départ).
 *
 * À copier dans tests/tp4/classifyValue.test.ts, puis à compléter.
 * Exécution : npm run test:tp4
 *
 * Oracle : spécification §8 (docs/specification.md), pas le code de la fonction.
 */
import { describe, expect, it } from 'vitest';
import { classifyValue, DEFAULT_THRESHOLDS } from '../../src/domain/thresholds';

describe('classifyValue — fréquence cardiaque (§8)', () => {
  it('75 bpm est NORMAL : aucune condition renvoyée', () => {
    // Arrange : préparer les données
    const value = 75;

    // Act : appeler la fonction testée
    const result = classifyValue('heartRate', value, DEFAULT_THRESHOLDS);

    // Assert : comparer au résultat attendu par la spécification
    expect(result).toBeNull();
  });

  it('130 bpm est CRITICAL, cause HIGH', () => {
    expect(classifyValue('heartRate', 130, DEFAULT_THRESHOLDS)).toEqual({ cause: 'HIGH', severity: 'CRITICAL' });
  });

  // TODO étape 3 : ajouter les cas de votre tableau de conception
  // (une valeur par partition + chaque valeur frontière).
});

// TODO étape 4 : SpO2, température, pression systolique, pression diastolique.
