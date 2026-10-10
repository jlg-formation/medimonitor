import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../src/app/App';
import { DEFAULT_THRESHOLDS } from '../../src/domain/thresholds';
import { SETTINGS_KEY } from '../../src/state/settingsStorage';
import { SimulationProvider } from '../../src/state/SimulationProvider';

function renderApp(path = '/') {
  return render(
    <SimulationProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </SimulationProvider>,
  );
}

// Précharge la page chargée paresseusement (Recharts) pour que findBy* ne dépende pas du temps de compilation.
beforeAll(async () => {
  await import('../../src/pages/PatientDetailPage');
}, 30_000);
beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe('tableau de bord (UI-01)', () => {
  it('affiche la mention de simulation et huit patients', () => {
    renderApp();
    expect(screen.getByText('SIMULATION — NE PAS UTILISER POUR DES SOINS')).toBeInTheDocument();
    for (let i = 1; i <= 8; i++) {
      expect(screen.getByTestId(`patient-card-P-00${i}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('sim-time')).toHaveTextContent('00:00:00');
    expect(screen.getByTestId('sim-state')).toHaveTextContent('Initialisée');
  });

  it('démarre, met en pause et reprend', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Démarrer/ }));
    expect(screen.getByTestId('sim-state')).toHaveTextContent('En cours');
    await user.click(screen.getByRole('button', { name: /Pause/ }));
    expect(screen.getByTestId('sim-state')).toHaveTextContent('En pause');
    await user.click(screen.getByRole('button', { name: /Reprendre/ }));
    expect(screen.getByTestId('sim-state')).toHaveTextContent('En cours');
  });

  it('le temps progresse selon la vitesse', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance', 'Date'] });
    renderApp();
    act(() => screen.getByRole('button', { name: /Démarrer/ }).click());
    act(() => screen.getByLabelText('×10').click());
    act(() => vi.advanceTimersByTime(3_000));
    expect(Number(screen.getByTestId('sim-time').dataset.seconds)).toBe(30);
  });

  it('change le scénario d’un patient', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.selectOptions(screen.getByLabelText('Scénario de Patient 02'), 'SC-07');
    expect(within(screen.getByTestId('patient-card-P-002')).getByText(/SC-07 au prochain pas/)).toBeInTheDocument();
  });
});

describe('interventions et alarmes', () => {
  it('AC-04/AC-05 : override, badge MANUEL, alarme critique acquittable', async () => {
    const user = userEvent.setup();
    renderApp('/patient/P-001');
    const row = await screen.findByTestId('override-heartRate');
    await user.type(within(row).getByRole('textbox'), '125');
    await user.click(within(row).getByRole('button', { name: 'Imposer' }));
    expect(within(row).getByText('MANUEL')).toBeInTheDocument();
    expect(within(row).getByText('125 bpm')).toBeInTheDocument();

    const ack = screen.getByRole('button', { name: /Acquitter l'alarme A-000001/ });
    await user.click(ack);
    expect(screen.getByRole('button', { name: /Acquitter l'alarme A-000001/ })).toBeDisabled();
    expect(screen.getAllByText('CRITIQUE').length).toBeGreaterThan(0);

    await user.click(within(row).getByRole('button', { name: 'Libérer' }));
    expect(within(row).queryByText('MANUEL')).not.toBeInTheDocument();
    expect(screen.getByText('Aucune alarme non résolue.')).toBeInTheDocument();
  });

  it('AC-12 : saisie de PA incohérente affichée INVALIDE', async () => {
    const user = userEvent.setup();
    renderApp('/patient/P-006');
    const dia = await screen.findByTestId('override-diastolic');
    await user.type(within(dia).getByRole('textbox'), '80');
    await user.click(within(dia).getByRole('button', { name: 'Imposer' }));
    const sys = screen.getByTestId('override-systolic');
    await user.type(within(sys).getByRole('textbox'), '70');
    await user.click(within(sys).getByRole('button', { name: 'Imposer' }));
    expect(within(sys).getByText('INVALIDE')).toBeInTheDocument();
    expect(within(dia).getByText('INVALIDE')).toBeInTheDocument();
    expect(screen.getAllByText('Donnée invalide')).toHaveLength(2);
  });

  it('le centre d’alarmes trie par gravité', async () => {
    const user = userEvent.setup();
    renderApp('/patient/P-003');
    const spo2 = await screen.findByTestId('override-spo2');
    await user.type(within(spo2).getByRole('textbox'), '94');
    await user.click(within(spo2).getByRole('button', { name: 'Imposer' }));
    const hr = screen.getByTestId('override-heartRate');
    await user.click(within(hr).getByRole('button', { name: 'Indisponible' }));
    const temp = screen.getByTestId('override-temperature');
    await user.type(within(temp).getByRole('textbox'), '40');
    await user.click(within(temp).getByRole('button', { name: 'Imposer' }));
    await user.click(screen.getByRole('link', { name: /Centre d'alarmes/ }));
    const table = screen.getByRole('table', { name: 'Alarmes non résolues' });
    const severities = within(table).getAllByRole('row').slice(1).map((r) => r.querySelector('.badge')?.textContent?.trim());
    expect(severities).toEqual(['▲▲ CRITIQUE', '▲ ALERTE', 'ⓘ INFORMATION']);
  });
});

describe('paramètres (UI-05)', () => {
  it('rejette des seuils incohérents avec un message explicite', async () => {
    const user = userEvent.setup();
    renderApp('/parametres');
    const input = screen.getByLabelText('Fréquence cardiaque — Alerte bas (<)');
    await user.clear(input);
    await user.type(input, '30');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les seuils' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/ordonnés/);
  });

  it('enregistre puis restaure les seuils et les persiste', async () => {
    const user = userEvent.setup();
    renderApp('/parametres');
    const input = screen.getByLabelText('Fréquence cardiaque — Critique haut (>)');
    await user.clear(input);
    await user.type(input, '130');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les seuils' }));
    expect(screen.getByText('Seuils enregistrés.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').thresholds.heartRate.criticalHigh).toBe(130);
    await user.click(screen.getByRole('button', { name: 'Restaurer les valeurs par défaut' }));
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').thresholds).toEqual(DEFAULT_THRESHOLDS);
    expect(screen.getByLabelText('Fréquence cardiaque — Critique haut (>)')).toHaveValue('120');
  });
});

describe('journal (UI-06)', () => {
  it('filtre par type', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Démarrer/ }));
    await user.click(screen.getByRole('button', { name: /Pause/ }));
    await user.click(screen.getByRole('link', { name: 'Journal' }));
    expect(screen.getAllByRole('row')).toHaveLength(3);
    await user.selectOptions(screen.getByLabelText('Type'), 'SIM_PAUSED');
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveTextContent('Simulation en pause');
  });
});
