import { Link } from 'react-router-dom';
import type { ManualOverride, PatientLevel, PatientRuntime, VitalKey } from '../domain/model';
import { formatReading } from '../app/format';
import { t, VITAL_LABELS, VITAL_LONG_LABELS, VITAL_UNITS } from '../app/strings.fr';
import { LevelBadge } from './LevelBadge';
import { ScenarioSelect } from './ScenarioSelect';

interface Props {
  runtime: PatientRuntime;
  level: PatientLevel;
  simulatedSecond: number;
  overrides: ManualOverride[];
}

export function freshnessText(lastReceived: number | null, now: number): string {
  if (lastReceived === null) return t.patient.neverReceived;
  const age = now - lastReceived;
  return age <= 0 ? t.patient.justNow : t.patient.secondsAgo(age);
}

function VitalCell({ runtime, vital, manual }: { runtime: PatientRuntime; vital: VitalKey; manual: boolean }) {
  const reading = runtime.current.readings[vital];
  const valid = reading.status === 'VALID';
  return (
    <div className={`vital ${valid ? '' : 'vital-missing'}`}>
      <dt title={VITAL_LONG_LABELS[vital]}>{VITAL_LABELS[vital]}</dt>
      <dd>
        <span className="vital-value">{formatReading(vital, reading)}</span>
        {valid && <span className="vital-unit"> {VITAL_UNITS[vital]}</span>}
        {manual && <span className="manual-tag">{t.patient.manual}</span>}
      </dd>
    </div>
  );
}

export function PatientCard({ runtime, level, simulatedSecond, overrides }: Props) {
  const { patient, current } = runtime;
  const isManual = (k: VitalKey) => overrides.some((o) => o.patientId === patient.id && o.vitalKey === k);
  const bp = current.readings;
  const bpManual = isManual('systolic') || isManual('diastolic');
  const bpValid = bp.systolic.status === 'VALID' && bp.diastolic.status === 'VALID';
  return (
    <article className={`patient-card card level-border-${level.toLowerCase()}`} aria-labelledby={`card-${patient.id}`} data-testid={`patient-card-${patient.id}`}>
      <header className="card-header">
        <h2 id={`card-${patient.id}`}>
          <Link to={`/patient/${patient.id}`} aria-label={`${patient.label} (${patient.id}) — ${t.patient.details}`}>
            {patient.label}
          </Link>{' '}
          <span className="muted">{patient.id}</span>
        </h2>
        <LevelBadge level={level} />
      </header>
      <dl className="vitals">
        <VitalCell runtime={runtime} vital="heartRate" manual={isManual('heartRate')} />
        <VitalCell runtime={runtime} vital="spo2" manual={isManual('spo2')} />
        <VitalCell runtime={runtime} vital="temperature" manual={isManual('temperature')} />
        <div className={`vital ${bpValid ? '' : 'vital-missing'}`}>
          <dt title="Pression artérielle systolique / diastolique">PA</dt>
          <dd>
            <span className="vital-value">
              {bp.systolic.status !== 'VALID' && bp.systolic.status === bp.diastolic.status
                ? formatReading('systolic', bp.systolic)
                : `${formatReading('systolic', bp.systolic)}/${formatReading('diastolic', bp.diastolic)}`}
            </span>
            {bpValid && <span className="vital-unit"> mmHg</span>}
            {bpManual && <span className="manual-tag">{t.patient.manual}</span>}
          </dd>
        </div>
      </dl>
      <footer className="card-footer">
        <span>
          {t.patient.freshness} : {freshnessText(runtime.lastReceivedSecond, simulatedSecond)}
        </span>
        <ScenarioSelect runtime={runtime} />
      </footer>
    </article>
  );
}
