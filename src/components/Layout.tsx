import { NavLink, Outlet } from 'react-router-dom';
import { unresolvedAlarms } from '../domain/alarms';
import { t } from '../app/strings.fr';
import { useSimulation } from '../state/SimulationProvider';
import { ControlBar } from './ControlBar';

export function Layout() {
  const { state } = useSimulation();
  const pending = unresolvedAlarms(state.alarms);
  const unacknowledged = pending.filter((a) => a.state === 'ACTIVE').length;
  return (
    <div className="app">
      <div className="sim-banner" role="note">
        {t.simulationBanner}
      </div>
      <header className="app-header">
        <span className="app-title">{t.appName}</span>
        <nav aria-label={t.nav.main}>
          <NavLink to="/" end>
            {t.nav.dashboard}
          </NavLink>
          <NavLink to="/alarmes">
            {t.nav.alarms}{' '}
            <span className="count" aria-label={`${pending.length} non résolues, dont ${unacknowledged} non acquittées`}>
              {pending.length}
            </span>
          </NavLink>
          <NavLink to="/journal">{t.nav.journal}</NavLink>
          <NavLink to="/parametres">{t.nav.settings}</NavLink>
        </nav>
      </header>
      <ControlBar />
      <main id="main">
        <Outlet />
      </main>
      <footer className="app-footer">{t.disclaimer}</footer>
    </div>
  );
}
