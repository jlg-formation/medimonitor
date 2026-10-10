import { patientLevel } from '../domain/alarms';
import { t } from '../app/strings.fr';
import { PatientCard } from '../components/PatientCard';
import { useSimulation } from '../state/SimulationProvider';

/** UI-01 : huit cartes patient, grille 4 × 2 sur grand écran. */
export function DashboardPage() {
  const { state } = useSimulation();
  return (
    <>
      <h1 className="visually-hidden">{t.nav.dashboard}</h1>
      <div className="patient-grid">
        {state.patients.map((rt) => (
          <PatientCard
            key={rt.patient.id}
            runtime={rt}
            level={patientLevel(state.alarms, rt.patient.id)}
            simulatedSecond={state.simulatedSecond}
            overrides={state.overrides}
          />
        ))}
      </div>
    </>
  );
}
