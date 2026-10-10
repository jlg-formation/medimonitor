/**
 * MediMonitor — TP4 — Catalogue des mutants de classifyValue (corrigé formateur).
 *
 * Sans import : ce fichier est lu à la fois par Vitest (mutants.ts) et directement
 * par Node (run-mutants.ts).
 */
export interface MutantInfo {
  id: string;
  description: string;
  /** Exemple de cas de test qui détecte (« tue ») le mutant. */
  tueur: string;
}

export const MUTANT_CATALOGUE: readonly MutantInfo[] = [
  { id: 'M1', description: 'Borne critique basse incluse (< devient <=)', tueur: 'FC 50 → WARNING LOW' },
  { id: 'M2', description: 'Borne d\'alerte basse incluse (< devient <=)', tueur: 'FC 60 → NORMAL' },
  { id: 'M3', description: 'Borne critique haute incluse (> devient >=)', tueur: 'FC 120 → WARNING HIGH' },
  { id: 'M4', description: 'Borne d\'alerte haute incluse (> devient >=)', tueur: 'FC 100 → NORMAL' },
  { id: 'M5', description: 'Alerte basse testée avant critique basse', tueur: 'FC 49 → CRITICAL LOW' },
  { id: 'M6', description: 'Cause inversée côté bas (LOW devient HIGH)', tueur: 'toEqual sur l\'objet complet d\'une valeur basse' },
  { id: 'M7', description: 'Paramètre thresholds ignoré (seuils par défaut codés en dur)', tueur: 'test avec des seuils personnalisés' },
  { id: 'M8', description: 'Garde null des seuils hauts supprimée', tueur: 'SpO2 98 → NORMAL' },
  { id: 'M9', description: 'Valeur arrondie à l\'entier avant comparaison', tueur: 'température 35.9 → WARNING LOW' },
  { id: 'M10', description: 'NORMAL renvoyé comme undefined au lieu de null', tueur: 'toBeNull() / toEqual(null) au lieu de toBeFalsy()' },
];
