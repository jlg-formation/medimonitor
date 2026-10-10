import { useEffect, useId, useState } from 'react';
import { SPEEDS } from '../domain/model';
import { formatSimTime } from '../app/format';
import { SIMULATOR_STATE_LABELS, t } from '../app/strings.fr';
import { useSimulation } from '../state/SimulationProvider';

/** UI-04 : démarrer, pause, reprendre, réinitialiser, vitesse, graine. */
export function ControlBar() {
  const { state, dispatch } = useSimulation();
  const seedId = useId();
  const [seedText, setSeedText] = useState(String(state.seed));
  useEffect(() => setSeedText(String(state.seed)), [state.seed]);

  const { simulatorState } = state;
  const seedEditable = simulatorState === 'INITIALIZED';
  const parsedSeed = Number(seedText);
  const seedValid = /^\d+$/.test(seedText.trim()) && parsedSeed <= 0xffffffff;

  return (
    <section className="control-bar" aria-label={t.controls.region}>
      <div className="control-group">
        {simulatorState === 'INITIALIZED' && (
          <button type="button" className="primary" onClick={() => dispatch({ type: 'START' })}>
            ▶ {t.controls.start}
          </button>
        )}
        {simulatorState === 'RUNNING' && (
          <button type="button" onClick={() => dispatch({ type: 'PAUSE' })}>
            ❚❚ {t.controls.pause}
          </button>
        )}
        {simulatorState === 'PAUSED' && (
          <button type="button" className="primary" onClick={() => dispatch({ type: 'RESUME' })}>
            ▶ {t.controls.resume}
          </button>
        )}
        <button type="button" onClick={() => dispatch({ type: 'RESET' })}>
          ↺ {t.controls.reset}
        </button>
      </div>

      <fieldset className="control-group speed">
        <legend>{t.controls.speed}</legend>
        {SPEEDS.map((s) => (
          <label key={s} className={state.speed === s ? 'chip selected' : 'chip'}>
            <input
              type="radio"
              name="speed"
              value={s}
              checked={state.speed === s}
              onChange={() => dispatch({ type: 'SET_SPEED', speed: s })}
            />
            ×{s}
          </label>
        ))}
      </fieldset>

      <form
        className="control-group seed"
        onSubmit={(e) => {
          e.preventDefault();
          if (seedValid) dispatch({ type: 'SET_SEED', seed: parsedSeed });
        }}
      >
        <label htmlFor={seedId}>{t.controls.seed}</label>
        <input
          id={seedId}
          inputMode="numeric"
          value={seedText}
          disabled={!seedEditable}
          aria-describedby={`${seedId}-help`}
          aria-invalid={!seedValid}
          onChange={(e) => setSeedText(e.target.value)}
          size={10}
        />
        <button type="submit" disabled={!seedEditable || !seedValid || parsedSeed === state.seed}>
          {t.controls.applySeed}
        </button>
        <span id={`${seedId}-help`} className="visually-hidden">
          {t.controls.seedHelp}
        </span>
      </form>

      <div className="control-group status" role="status" aria-live="polite">
        <span>
          {t.controls.state} : <strong data-testid="sim-state">{SIMULATOR_STATE_LABELS[simulatorState]}</strong>
        </span>
        <span>
          {t.controls.simulatedTime} :{' '}
          <strong data-testid="sim-time" data-seconds={state.simulatedSecond}>
            {formatSimTime(state.simulatedSecond)}
          </strong>
        </span>
      </div>
    </section>
  );
}
