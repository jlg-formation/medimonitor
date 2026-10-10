import { useId, useState } from 'react';
import type { ChartWindow, Thresholds, VitalKey, VitalThresholds } from '../domain/model';
import { CHART_WINDOWS, VITAL_KEYS } from '../domain/model';
import { DEFAULT_THRESHOLDS, validateThresholds } from '../domain/thresholds';
import { t, VITAL_LONG_LABELS, VITAL_UNITS } from '../app/strings.fr';
import { useSimulation } from '../state/SimulationProvider';

type Field = keyof VitalThresholds;
const FIELDS: Field[] = ['criticalLow', 'warningLow', 'warningHigh', 'criticalHigh'];
type Draft = Record<VitalKey, Record<Field, string>>;

const toDraft = (th: Thresholds): Draft =>
  Object.fromEntries(
    VITAL_KEYS.map((k) => [k, Object.fromEntries(FIELDS.map((f) => [f, th[k][f] === null ? '' : String(th[k][f])]))]),
  ) as Draft;

const isOptional = (k: VitalKey, f: Field) => k === 'spo2' && (f === 'warningHigh' || f === 'criticalHigh');

/** Convertit la saisie ; une saisie non numérique devient NaN et sera rejetée par la validation. */
function fromDraft(draft: Draft): Thresholds {
  const parse = (text: string) => (text.trim() === '' ? NaN : Number(text.replace(',', '.')));
  return Object.fromEntries(
    VITAL_KEYS.map((k) => [
      k,
      Object.fromEntries(FIELDS.map((f) => [f, isOptional(k, f) ? null : parse(draft[k][f])])),
    ]),
  ) as unknown as Thresholds;
}

/** UI-05 : seuils configurables, validés avant sauvegarde, restaurables (THR-002). */
export function SettingsPage() {
  const { state, dispatch, display, setDisplay } = useSimulation();
  const [draft, setDraft] = useState<Draft>(() => toDraft(state.thresholds));
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const windowId = useId();

  const save = (thresholds: Thresholds, okMessage: string) => {
    const problems = validateThresholds(thresholds);
    setErrors(problems);
    if (problems.length > 0) {
      setMessage('');
      return;
    }
    dispatch({ type: 'SET_THRESHOLDS', thresholds });
    setMessage(okMessage);
  };

  return (
    <>
      <h1>{t.settings.title}</h1>
      <section className="card" aria-labelledby="thresholds-title">
        <h2 id="thresholds-title">{t.settings.thresholds}</h2>
        <p className="muted">{t.settings.thresholdsHelp}</p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(fromDraft(draft), t.settings.saved);
          }}
        >
          <div className="table-wrap">
            <table className="threshold-table">
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">{t.settings.criticalLow}</th>
                  <th scope="col">{t.settings.warningLow}</th>
                  <th scope="col">{t.settings.warningHigh}</th>
                  <th scope="col">{t.settings.criticalHigh}</th>
                </tr>
              </thead>
              <tbody>
                {VITAL_KEYS.map((k) => (
                  <tr key={k}>
                    <th scope="row">
                      {VITAL_LONG_LABELS[k]} ({VITAL_UNITS[k]})
                    </th>
                    {FIELDS.map((f) => (
                      <td key={f}>
                        {isOptional(k, f) ? (
                          <span className="muted">{t.settings.notApplicable}</span>
                        ) : (
                          <input
                            inputMode="decimal"
                            aria-label={`${VITAL_LONG_LABELS[k]} — ${t.settings[f]}`}
                            value={draft[k][f]}
                            size={6}
                            onChange={(e) => setDraft({ ...draft, [k]: { ...draft[k], [f]: e.target.value } })}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.length > 0 && (
            <div role="alert" className="form-errors">
              <p>{t.settings.invalid}</p>
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {message && (
            <p role="status" className="form-ok">
              {message}
            </p>
          )}
          <div className="form-actions">
            <button type="submit" className="primary">
              {t.settings.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(toDraft(DEFAULT_THRESHOLDS));
                save(DEFAULT_THRESHOLDS, t.settings.restored);
              }}
            >
              {t.settings.restore}
            </button>
          </div>
        </form>
      </section>

      <section className="card" aria-labelledby="display-title">
        <h2 id="display-title">{t.settings.display}</h2>
        <label htmlFor={windowId}>{t.settings.chartWindow}</label>{' '}
        <select
          id={windowId}
          value={display.chartWindowSeconds}
          onChange={(e) => setDisplay({ ...display, chartWindowSeconds: Number(e.target.value) as ChartWindow })}
        >
          {CHART_WINDOWS.map((w) => (
            <option key={w} value={w}>
              {t.settings.seconds(w)}
            </option>
          ))}
        </select>
      </section>
    </>
  );
}
