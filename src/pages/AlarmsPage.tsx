import { resolvedAlarms, unresolvedAlarms } from '../domain/alarms';
import { t } from '../app/strings.fr';
import { AlarmTable } from '../components/AlarmTable';
import { useSimulation } from '../state/SimulationProvider';

/** UI-03 : alarmes non résolues triées (ALM-007) et historique des résolues. */
export function AlarmsPage() {
  const { state } = useSimulation();
  return (
    <>
      <h1>{t.alarms.title}</h1>
      <section className="card" aria-labelledby="unresolved-title">
        <h2 id="unresolved-title">{t.alarms.unresolved}</h2>
        <div aria-live="polite">
          <AlarmTable
            alarms={unresolvedAlarms(state.alarms)}
            patients={state.patients}
            mode="unresolved"
            caption={t.alarms.unresolved}
            emptyText={t.alarms.none}
          />
        </div>
      </section>
      <section className="card" aria-labelledby="resolved-title">
        <h2 id="resolved-title">{t.alarms.resolved}</h2>
        <AlarmTable
          alarms={resolvedAlarms(state.alarms)}
          patients={state.patients}
          mode="resolved"
          caption={t.alarms.resolved}
          emptyText={t.alarms.noneResolved}
        />
      </section>
    </>
  );
}
