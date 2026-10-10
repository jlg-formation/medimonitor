import { useState } from 'react';
import type { PatientRuntime, VitalKey } from '../domain/model';
import { VITAL_KEYS } from '../domain/model';
import { NOT_RECEIVED, received } from '../domain/validation';
import { formatReadingWithUnit, parseManualInput } from '../app/format';
import { t, VITAL_LONG_LABELS, VITAL_UNITS } from '../app/strings.fr';
import { useSimulation } from '../state/SimulationProvider';

function OverrideRow({ runtime, vital }: { runtime: PatientRuntime; vital: VitalKey }) {
  const { state, dispatch } = useSimulation();
  const [text, setText] = useState('');
  const patientId = runtime.patient.id;
  const active = state.overrides.find((o) => o.patientId === patientId && o.vitalKey === vital);
  const inputId = `override-${patientId}-${vital}`;
  return (
    <tr data-testid={`override-${vital}`}>
      <th scope="row">
        <label htmlFor={inputId}>{VITAL_LONG_LABELS[vital]}</label>
        <div className="muted">{formatReadingWithUnit(vital, runtime.current.readings[vital])}</div>
      </th>
      <td>
        <form
          className="override-form"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'SET_OVERRIDE', patientId, vitalKey: vital, raw: received(parseManualInput(text)) });
          }}
        >
          <input
            id={inputId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={t.override.valueFor(VITAL_LONG_LABELS[vital])}
            placeholder={VITAL_UNITS[vital]}
            size={6}
          />
          <button type="submit">{t.override.set}</button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_OVERRIDE', patientId, vitalKey: vital, raw: NOT_RECEIVED })}
          >
            {t.override.unavailable}
          </button>
          <button
            type="button"
            disabled={!active}
            onClick={() => dispatch({ type: 'RELEASE_OVERRIDE', patientId, vitalKey: vital })}
          >
            {t.override.release}
          </button>
        </form>
      </td>
      <td>{active && <span className="manual-tag">{t.patient.manual}</span>}</td>
    </tr>
  );
}

/** Contrôles d'injection et de libération (UI-02, MAN-001…005). */
export function OverridePanel({ runtime }: { runtime: PatientRuntime }) {
  return (
    <section className="card" aria-labelledby="override-title">
      <h2 id="override-title">{t.override.title}</h2>
      <p className="muted">{t.override.help}</p>
      <div className="table-wrap">
        <table className="override-table">
          <tbody>
            {VITAL_KEYS.map((k) => (
              <OverrideRow key={k} runtime={runtime} vital={k} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
