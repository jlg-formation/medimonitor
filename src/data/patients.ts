import type { Patient, PatientId } from '../domain/model';

export const PATIENT_IDS: readonly PatientId[] = [
  'P-001', 'P-002', 'P-003', 'P-004', 'P-005', 'P-006', 'P-007', 'P-008',
];

/** Les huit patients fictifs fixes, tous en SC-01 au démarrage. */
export function createPatients(): Patient[] {
  return PATIENT_IDS.map((id, i) => ({
    id,
    label: `Patient ${String(i + 1).padStart(2, '0')}`,
    scenarioId: 'SC-01',
  }));
}
