import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Sample, Thresholds, VitalKey } from '../domain/model';
import { t, VITAL_LONG_LABELS, VITAL_UNITS } from '../app/strings.fr';

interface Props {
  vital: VitalKey;
  samples: Sample[];
  thresholds: Thresholds;
}

const DOMAINS: Record<VitalKey, [number, number]> = {
  heartRate: [30, 160],
  spo2: [80, 100],
  temperature: [33, 41],
  systolic: [70, 180],
  diastolic: [40, 120],
};

/**
 * Courbe d'une composante (UI-REQ-004) : axes, unités, légende.
 * Les valeurs invalides ou indisponibles sont `null` → discontinuité, jamais zéro.
 */
export function VitalChart({ vital, samples, thresholds }: Props) {
  const data = samples.map((s) => ({ t: s.simulatedSecond, v: s.readings[vital].value }));
  const th = thresholds[vital];
  const unit = VITAL_UNITS[vital];
  const title = `${VITAL_LONG_LABELS[vital]} (${unit})`;
  const lines = [
    { y: th.criticalLow, kind: 'critical' },
    { y: th.warningLow, kind: 'warning' },
    { y: th.warningHigh, kind: 'warning' },
    { y: th.criticalHigh, kind: 'critical' },
  ].filter((l): l is { y: number; kind: string } => l.y !== null);
  return (
    <figure className="chart card" data-testid={`chart-${vital}`}>
      <figcaption>
        <strong>{title}</strong>
        <span className="chart-legend" aria-hidden="true">
          <span className="legend-line" /> mesure <span className="legend-dash warning" /> alerte{' '}
          <span className="legend-dash critical" /> critique
        </span>
      </figcaption>
      <div className="chart-body" role="img" aria-label={`Courbe ${title}, ${data.length} points. ${t.charts.gap}`}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 11 }}
              label={{ value: t.charts.time, position: 'insideBottom', offset: -8, fontSize: 11 }}
            />
            <YAxis
              domain={DOMAINS[vital]}
              allowDataOverflow
              tick={{ fontSize: 11 }}
              width={48}
              label={{ value: unit, angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            {lines.map((l, i) => (
              <ReferenceLine key={i} y={l.y} stroke={`var(--${l.kind})`} strokeDasharray="4 4" />
            ))}
            <Tooltip
              formatter={(value) => [value === null || value === undefined ? '—' : `${String(value)} ${unit}`, VITAL_LONG_LABELS[vital]]}
              labelFormatter={(label) => `t = ${String(label)} s`}
            />
            <Line
              type="linear"
              dataKey="v"
              stroke="var(--series)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
