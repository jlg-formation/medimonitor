import type { EventType, LogEvent, PatientId } from './model';

/** HIS-002 : taille maximale du journal en mémoire. */
export const MAX_JOURNAL_EVENTS = 10_000;

export const formatEventId = (seq: number) => `E-${String(seq).padStart(6, '0')}`;

export interface EventDraft {
  type: EventType;
  patientId?: PatientId;
  payload?: Record<string, unknown>;
}

export function createEvent(
  seq: number,
  draft: EventDraft,
  simulatedSecond: number,
  realTimestamp: number,
): LogEvent {
  const event: LogEvent = {
    id: formatEventId(seq),
    type: draft.type,
    simulatedSecond,
    realTimestamp,
    payload: draft.payload ?? {},
  };
  if (draft.patientId) event.patientId = draft.patientId;
  return event;
}

/** Ajoute des événements en supprimant les plus anciens au-delà de la limite. */
export function appendBounded<T>(list: T[], items: T[], max: number): T[] {
  if (items.length === 0) return list;
  const next = list.concat(items);
  return next.length > max ? next.slice(next.length - max) : next;
}
