import { Link, useParams } from 'react-router-dom';
import { patientLevel, resolvedAlarms, unresolvedAlarms } from '../domain/alarms';
import { VITAL_KEYS } from '../domain/model';
import { SCENARIOS } from '../domain/scenarios';
import { formatSimTime } from '../app/format';
import { t } from '../app/strings.fr';
import { AlarmTable } from '../components/AlarmTable';
import { JournalTable } from '../components/JournalTable';
import { LevelBadge } from '../components/LevelBadge';
import { OverridePanel } from '../components/OverridePanel';
import { freshnessText } from '../components/PatientCard';
import { ScenarioSelect } from '../components/ScenarioSelect';
import { VitalChart } from '../components/VitalChart';
import { useSimulation } from '../state/SimulationProvider';

/** UI-02 : courbes, scénario, interventions, alarmes et historique du patient. */
export function PatientDetailPage() {
  const { patientId } = useParams();
  const { state, display } = useSimulation();
  const runtime = state.patients.find((p) => p.patient.id === patientId);
  if (!runtime) {
    return (
      <section className="card">
        <p>{t.patient.notFound}</p>
        <Link to="/">{t.patient.back}</Link>
      </section>
    );
  }
  const id = runtime.patient.id;
  const scenario = SCENARIOS.find((s) => s.id === runtime.patient.scenarioId);
  const samples = state.history[id].slice(-display.chartWindowSeconds);
  return (
    <div className="detail">
      <p>
        <Link to="/">← {t.patient.back}</Link>
      </p>
      <section className="card detail-header">
        <h1>
          {runtime.patient.label} <span className="muted">{id}</span>
        </h1>
        <LevelBadge level={patientLevel(state.alarms, id)} />
        <dl className="detail-meta">
          <div>
            <dt>{t.patient.scenario}</dt>
            <dd>
              <ScenarioSelect runtime={runtime} />
              <span className="muted">{scenario?.description}</span>
            </dd>
          </div>
          <div>
            <dt>{t.patient.lastUpdate}</dt>
            <dd>{formatSimTime(runtime.current.simulatedSecond)}</dd>
          </div>
          <div>
            <dt>{t.patient.freshness}</dt>
            <dd>{freshnessText(runtime.lastReceivedSecond, state.simulatedSecond)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="charts-title">
        <h2 id="charts-title">{t.charts.title}</h2>
        <p className="muted">{t.charts.gap}</p>
        <div className="chart-grid">
          {VITAL_KEYS.map((k) => (
            <VitalChart key={k} vital={k} samples={samples} thresholds={state.thresholds} />
          ))}
        </div>
      </section>

      <OverridePanel runtime={runtime} />

      <section className="card" aria-labelledby="patient-alarms">
        <h2 id="patient-alarms">{t.alarms.patientAlarms}</h2>
        <AlarmTable
          alarms={unresolvedAlarms(state.alarms, id)}
          patients={state.patients}
          mode="unresolved"
          caption={t.alarms.unresolved}
          emptyText={t.alarms.none}
        />
        <details>
          <summary>{t.alarms.resolved}</summary>
          <AlarmTable
            alarms={resolvedAlarms(state.alarms, id)}
            patients={state.patients}
            mode="resolved"
            caption={t.alarms.resolved}
            emptyText={t.alarms.noneResolved}
          />
        </details>
      </section>

      <section className="card" aria-labelledby="patient-journal">
        <h2 id="patient-journal">{t.journal.patientHistory}</h2>
        <JournalTable events={state.journal.filter((e) => e.patientId === id)} />
      </section>
    </div>
  );
}
