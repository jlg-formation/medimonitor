import { useId } from 'react';
import type { PatientRuntime, ScenarioId } from '../domain/model';
import { isScenarioId, SCENARIOS } from '../domain/scenarios';
import { t } from '../app/strings.fr';
import { useSimulation } from '../state/SimulationProvider';

export function ScenarioSelect({ runtime }: { runtime: PatientRuntime }) {
  const { dispatch } = useSimulation();
  const id = useId();
  const selected: ScenarioId = runtime.pendingScenarioId ?? runtime.patient.scenarioId;
  return (
    <div className="scenario-select">
      <label htmlFor={id} className="visually-hidden">
        {t.patient.scenarioFor(runtime.patient.label)}
      </label>
      <select
        id={id}
        value={selected}
        onChange={(e) => {
          if (isScenarioId(e.target.value)) {
            dispatch({ type: 'SET_SCENARIO', patientId: runtime.patient.id, scenarioId: e.target.value });
          }
        }}
      >
        {SCENARIOS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.id} — {s.label}
          </option>
        ))}
      </select>
      {runtime.pendingScenarioId && (
        <span className="pending">{t.patient.pendingScenario(runtime.pendingScenarioId)}</span>
      )}
    </div>
  );
}
