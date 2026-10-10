import { useId, useState } from 'react';
import { PATIENT_IDS } from '../data/patients';
import type { EventType, LogEvent, PatientId, Severity } from '../domain/model';
import { EVENT_TYPES } from '../domain/model';
import { EVENT_LABELS, LEVEL_LABELS, t } from '../app/strings.fr';
import { JournalTable } from '../components/JournalTable';
import { useSimulation } from '../state/SimulationProvider';

const SEVERITIES: Severity[] = ['CRITICAL', 'WARNING', 'INFORMATION'];

export interface JournalFilter {
  patientId: PatientId | '';
  type: EventType | '';
  severity: Severity | '';
}

/** Les événements sans gravité (hors alarmes) sont exclus quand un filtre de gravité est actif. */
export function filterEvents(events: LogEvent[], f: JournalFilter): LogEvent[] {
  return events.filter(
    (e) =>
      (!f.patientId || e.patientId === f.patientId) &&
      (!f.type || e.type === f.type) &&
      (!f.severity || e.payload.severity === f.severity),
  );
}

/** UI-06 : chronologie filtrable par patient, type et gravité. */
export function JournalPage() {
  const { state } = useSimulation();
  const [filter, setFilter] = useState<JournalFilter>({ patientId: '', type: '', severity: '' });
  const ids = { patient: useId(), type: useId(), severity: useId() };
  const events = filterEvents(state.journal, filter);
  return (
    <>
      <h1>{t.journal.title}</h1>
      <section className="card">
        <div className="filters">
          <label htmlFor={ids.patient}>{t.journal.filterPatient}</label>
          <select
            id={ids.patient}
            value={filter.patientId}
            onChange={(e) => setFilter({ ...filter, patientId: e.target.value as PatientId | '' })}
          >
            <option value="">{t.journal.all}</option>
            {PATIENT_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <label htmlFor={ids.type}>{t.journal.filterType}</label>
          <select
            id={ids.type}
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value as EventType | '' })}
          >
            <option value="">{t.journal.all}</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {EVENT_LABELS[type]}
              </option>
            ))}
          </select>
          <label htmlFor={ids.severity}>{t.journal.filterSeverity}</label>
          <select
            id={ids.severity}
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value as Severity | '' })}
          >
            <option value="">{t.journal.all}</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {LEVEL_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <JournalTable events={events} />
      </section>
    </>
  );
}
