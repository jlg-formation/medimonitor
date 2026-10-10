import type { LogEvent, Reading, VitalKey } from '../domain/model';
import { CAUSE_LABELS, LEVEL_LABELS, STATUS_LABELS, VITAL_LABELS, VITAL_UNITS } from './strings.fr';

const decimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Valeur numérique formatée, ou statut textuel : jamais zéro pour une donnée absente (UI-01). */
export function formatReading(key: VitalKey, reading: Reading): string {
  if (reading.status !== 'VALID' || reading.value === null) return STATUS_LABELS[reading.status as 'INVALID' | 'UNAVAILABLE'];
  return key === 'temperature' ? decimal.format(reading.value) : String(reading.value);
}

export function formatReadingWithUnit(key: VitalKey, reading: Reading): string {
  const text = formatReading(key, reading);
  return reading.status === 'VALID' ? `${text} ${VITAL_UNITS[key]}` : text;
}

/** Seconde simulée → hh:mm:ss. */
export function formatSimTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
export const formatRealTime = (ts: number) => timeFormat.format(new Date(ts));

function summarizeReading(value: unknown): string {
  if (typeof value !== 'object' || value === null) return '—';
  const r = value as { value: number | null; status: string };
  return r.status === 'VALID' ? String(r.value) : STATUS_LABELS[r.status as 'INVALID' | 'UNAVAILABLE'] ?? r.status;
}

/** Détails lisibles d'un événement de journal. */
export function describeEvent(e: LogEvent): string {
  const p = e.payload;
  const vital = typeof p.vitalKey === 'string' ? VITAL_LABELS[p.vitalKey as VitalKey] : '';
  switch (e.type) {
    case 'SPEED_CHANGED':
      return `×${String(p.from)} → ×${String(p.to)}`;
    case 'SCENARIO_CHANGED':
      return `${String(p.from)} → ${String(p.to)}`;
    case 'MANUAL_OVERRIDE_SET':
    case 'MANUAL_OVERRIDE_RELEASED':
      return `${vital} : ${summarizeReading(p.previous)} → ${summarizeReading(p.next)}`;
    case 'ALARM_CREATED':
    case 'ALARM_ACKNOWLEDGED':
    case 'ALARM_RESOLVED':
      return `${String(p.alarmId)} · ${vital} · ${CAUSE_LABELS[p.cause as keyof typeof CAUSE_LABELS]} · ${LEVEL_LABELS[p.severity as keyof typeof LEVEL_LABELS]}`;
    case 'SETTINGS_CHANGED':
      return p.setting === 'seed' ? `Graine ${String(p.from)} → ${String(p.to)}` : 'Seuils mis à jour';
    default:
      return '';
  }
}

/** Analyse une saisie d'override : nombre si possible, sinon texte brut (qui sera INVALID). */
export function parseManualInput(text: string): unknown {
  const trimmed = text.trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : text;
}
