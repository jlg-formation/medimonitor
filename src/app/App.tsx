import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AlarmsPage } from '../pages/AlarmsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { JournalPage } from '../pages/JournalPage';
import { SettingsPage } from '../pages/SettingsPage';
import { SimulationProvider } from '../state/SimulationProvider';

// Recharts n'est chargé qu'à l'ouverture d'une fiche patient.
const PatientDetailPage = lazy(() =>
  import('../pages/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="patient/:patientId"
          element={
            <Suspense fallback={<p>Chargement…</p>}>
              <PatientDetailPage />
            </Suspense>
          }
        />
        <Route path="alarmes" element={<AlarmsPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="parametres" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

/** HashRouter : compatible GitHub Pages sans configuration de réécriture. */
export function App() {
  return (
    <SimulationProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </SimulationProvider>
  );
}
