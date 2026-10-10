import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { createInitialState, reduce, type Action } from '../domain/engine';
import type { DisplayPreferences, EngineState } from '../domain/model';
import { createStepAccumulator } from './scheduler';
import { loadSettings, saveSettings } from './settingsStorage';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** Action sans horodatage réel : il est ajouté ici, jamais dans le domaine. */
export type Command = DistributiveOmit<Action, 'at'>;

interface SimulationContextValue {
  state: EngineState;
  dispatch: (command: Command) => void;
  display: DisplayPreferences;
  setDisplay: (display: DisplayPreferences) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

/** Période de rafraîchissement du scheduler (le rendu peut être moins fréquent que les pas). */
const SCHEDULER_PERIOD_MS = 100;

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [initialSettings] = useState(loadSettings);
  const [state, rawDispatch] = useReducer(reduce, undefined, () =>
    createInitialState(
      { seed: initialSettings.seed, speed: initialSettings.speed, thresholds: initialSettings.thresholds },
      Date.now(),
    ),
  );
  const [display, setDisplay] = useState(initialSettings.display);

  const dispatch = useCallback((command: Command) => rawDispatch({ ...command, at: Date.now() } as Action), []);

  // Persistance limitée aux réglages (HIS-004).
  useEffect(() => {
    saveSettings({ speed: state.speed, seed: state.seed, thresholds: state.thresholds, display });
  }, [state.speed, state.seed, state.thresholds, display]);

  // Scheduler : accumule le temps réel et exécute les pas entiers.
  const running = state.simulatorState === 'RUNNING';
  const speed = state.speed;
  useEffect(() => {
    if (!running) return;
    const accumulator = createStepAccumulator();
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const steps = accumulator.advance(now - last, speed);
      last = now;
      if (steps > 0) dispatch({ type: 'TICK', steps });
    }, SCHEDULER_PERIOD_MS);
    return () => window.clearInterval(id);
  }, [running, speed, dispatch]);

  // SIM-007 : pause automatique quand l'onglet est masqué.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) dispatch({ type: 'AUTO_PAUSE' });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [dispatch]);

  const value = useMemo(() => ({ state, dispatch, display, setDisplay }), [state, dispatch, display]);
  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation doit être utilisé dans un SimulationProvider.');
  return ctx;
}
