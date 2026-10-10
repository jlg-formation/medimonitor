import type { Alarm, EngineState } from '../domain/model';
import { ALARM_STATE_LABELS, CAUSE_LABELS, t, VITAL_LABELS } from '../app/strings.fr';
import { useSimulation } from '../state/SimulationProvider';
import { LevelBadge } from './LevelBadge';

interface Props {
  alarms: Alarm[];
  patients: EngineState['patients'];
  mode: 'unresolved' | 'resolved';
  caption: string;
  emptyText: string;
}

/** Liste d'alarmes ; l'acquittement est distinct de la gravité (UI-03, ALM-008). */
export function AlarmTable({ alarms, patients, mode, caption, emptyText }: Props) {
  const { dispatch } = useSimulation();
  const label = (id: string) => patients.find((p) => p.patient.id === id)?.patient.label ?? id;
  if (alarms.length === 0) return <p className="empty">{emptyText}</p>;
  const c = t.alarms.columns;
  return (
    <div className="table-wrap">
      <table className="alarm-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{c.severity}</th>
            <th scope="col">{c.patient}</th>
            <th scope="col">{c.vital}</th>
            <th scope="col">{c.cause}</th>
            <th scope="col">{c.state}</th>
            <th scope="col">{c.created}</th>
            {mode === 'resolved' ? <th scope="col">{c.resolved}</th> : <th scope="col">{c.action}</th>}
          </tr>
        </thead>
        <tbody>
          {alarms.map((a) => (
            <tr key={a.id} data-testid={`alarm-${a.id}`} className={a.state === 'ACKNOWLEDGED' ? 'acknowledged' : ''}>
              <td>
                <LevelBadge level={a.severity} />
              </td>
              <td>
                {label(a.patientId)} <span className="muted">{a.patientId}</span>
              </td>
              <td>{VITAL_LABELS[a.vitalKey]}</td>
              <td>{CAUSE_LABELS[a.cause]}</td>
              <td>
                <span className={`state-tag state-${a.state.toLowerCase()}`}>{ALARM_STATE_LABELS[a.state]}</span>
              </td>
              <td>{a.createdSecond}</td>
              {mode === 'resolved' ? (
                <td>{a.resolvedSecond}</td>
              ) : (
                <td>
                  <button
                    type="button"
                    disabled={a.state !== 'ACTIVE'}
                    aria-label={t.alarms.acknowledgeLabel(a.id)}
                    onClick={() => dispatch({ type: 'ACK_ALARM', alarmId: a.id })}
                  >
                    {a.state === 'ACTIVE' ? t.alarms.acknowledge : `✓ ${t.alarms.acknowledged}`}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
